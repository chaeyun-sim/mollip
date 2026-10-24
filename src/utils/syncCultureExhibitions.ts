import { getCultureDetail, getCultureExhibitionList } from '@/src/api/culture';
import { inferGenreAndTags } from '@/src/utils/exhibitionClassification';
import { formatDate } from '@/src/utils/cultureExhibitionMapper';
import {
	isExhibitionEndDateEligible,
	isExhibitionListingTitle,
	isValidExhibitionDateString,
} from '@/src/utils/exhibitionSearch';
import { normalizeExhibitionTitle, stripHtml } from '@/src/utils/stripHtml';
import { isStale, markSynced } from '@/src/utils/syncCache';
import { supabase } from '@/src/utils/supabase';

/** data_sync_meta key — 바꾸면 다음 앱 실행 시 재동기화 */
const CULTURE_SYNC_SOURCE = 'culture_period_v3';

// exhibitions(source='culture'): 24h마다 period2에서 없는 제목만 추가. 기존 행은 유지.
export async function syncCultureExhibitionsIfStale(): Promise<void> {
	if (!(await isStale(CULTURE_SYNC_SOURCE))) return;
	const res = await getCultureExhibitionList();
	const items = res.body.items
		.map(({ item }) => item)
		.filter((item) => item.startDate?.length === 8 && item.endDate?.length === 8);
	if (items.length === 0) return;
	const rows = items
		.map((item) => {
			const start_date = formatDate(item.startDate);
			const end_date = formatDate(item.endDate);
			if (!isValidExhibitionDateString(start_date) || !isExhibitionEndDateEligible(end_date)) {
				return null;
			}
			const title = stripHtml(item.title);
			if (!isExhibitionListingTitle(title)) {
				return null;
			}
			const { genre, type, tags } = inferGenreAndTags({
				title,
				description: item.place,
				legacyGenre: item.realmName,
			});
			return {
				seq: item.seq,
				source: 'culture' as const,
				venue_name_fallback: item.place || '장소 정보 없음',
				title,
				start_date,
				end_date,
				genre,
				type,
				tags: tags.length > 0 ? JSON.stringify(tags) : null,
				image_url: item.thumbnail || null,
				synced_at: new Date().toISOString(),
			};
		})
		.filter((row): row is NonNullable<typeof row> => row != null);
	const { data: existing } = await supabase.from('exhibitions').select('title');
	const taken = new Set(
		(existing ?? []).map((row) =>
			normalizeExhibitionTitle((row as { title?: string }).title ?? ''),
		),
	);
	const deduped: typeof rows = [];
	const seenTitles = new Set<string>();
	for (const row of rows) {
		const key = normalizeExhibitionTitle(row.title);
		if (!key || taken.has(key) || seenTitles.has(key)) continue;
		seenTitles.add(key);
		deduped.push(row);
	}
	if (deduped.length === 0) {
		await markSynced(CULTURE_SYNC_SOURCE);
		return;
	}
	const details = await Promise.all(
		deduped.map(async ({ seq }) => {
			try {
				const detailRes = await getCultureDetail(seq);
				const item = detailRes.body.items[0]?.item;
				return {
					web_site: item?.url || undefined,
					description: item?.contents1 ? stripHtml(item.contents1) : undefined,
				};
			} catch {
				return { web_site: undefined, description: undefined };
			}
		}),
	);
	const rowsToInsert = deduped.map(({ seq: _seq, ...row }, index) => ({
		...row,
		...details[index],
	}));
	const { error: insertError } = await supabase.from('exhibitions').upsert(rowsToInsert, {
		onConflict: 'title,start_date,end_date',
		ignoreDuplicates: true,
	});
	if (insertError) throw insertError;
	await markSynced(CULTURE_SYNC_SOURCE);
}
