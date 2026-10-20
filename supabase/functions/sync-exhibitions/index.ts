import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

type Exhibition = Record<string, string | null> & {
	source: string;
	title: string;
	start_date: string;
	end_date: string;
	venue_name_fallback: string;
	synced_at: string;
};

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;

function seoulDate(offsetDays: number): string {
	return new Date(Date.now() + SEOUL_OFFSET_MS + offsetDays * 86400_000)
		.toISOString()
		.slice(0, 10)
		.replaceAll('-', '.');
}

// 웜 isolate가 날짜를 넘겨 재사용돼도 어제 날짜를 쓰지 않도록 요청마다 갱신한다.
let today = seoulDate(0);
let syncEndMin = seoulDate(2);
const blockedVenues = ['현대어린이책미술관', '증평민속체험미술관', '수목원테마파크'];
const blockedParts = [
	'어린이책미술',
	'어린이미술관',
	'어린이박물관',
	'민속체험미술',
	'민속체험박물',
	'테마파크',
	'체험형전시',
];

function decode(value: string): string {
	return value
		.replaceAll('&amp;', '&')
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&quot;', '"')
		.replaceAll('&apos;', "'")
		.replaceAll('&#39;', "'")
		.replaceAll('&middot;', '·')
		.replaceAll('&nbsp;', ' ')
		.replaceAll('&amp;', '&')
		.replace(/\s+/g, ' ')
		.trim();
}

function tag(xml: string, name: string): string {
	const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return decode(xml.match(new RegExp(`<${escaped}>([\\s\\S]*?)</${escaped}>`, 'i'))?.[1] ?? '');
}

function validRow(row: Exhibition): boolean {
	if (!row.title || !/^\d{4}\.\d{2}\.\d{2}$/.test(row.start_date) || row.end_date < syncEndMin)
		return false;
	const venueNorm = row.venue_name_fallback.replace(/\s/g, '');
	const allNorm = `${row.venue_name_fallback} ${row.title}`.replace(/\s/g, '');
	if (blockedVenues.some((v) => venueNorm === v.replace(/\s/g, ''))) return false;
	if (blockedParts.some((v) => allNorm.includes(v))) return false;
	if (/(5\s*d|3\s*d|\bvr\b|가상현실|테마\s*파크)/i.test(`${row.venue_name_fallback} ${row.title}`))
		return false;
	if (/대관\s*(공고|모집|안내|신청|접수|요강)|정기\s*대관/.test(row.title)) return false;
	return true;
}

async function fetchXml(url: URL): Promise<string> {
	const response = await fetch(url, { signal: AbortSignal.timeout(120_000) });
	if (!response.ok) throw new Error(`Source API ${response.status}: ${url.origin}`);
	const xml = await response.text();
	if (/<resultCode>(?!00|0000)[^<]+<\/resultCode>/i.test(xml)) {
		throw new Error(
			`Source API returned an error: ${tag(xml, 'resultCode')} ${tag(xml, 'resultMsg')}`,
		);
	}
	return xml;
}

async function fetchPages(
	base: string,
	apiKey: string,
	params: Record<string, string>,
	parse: (item: string) => Exhibition | null,
): Promise<Exhibition[]> {
	const rows: Exhibition[] = [];
	let total = 0;
	for (let page = 1; page <= 50; page++) {
		const url = new URL(base);
		const pageKey = Object.keys(params).find((key) => key.toLowerCase() === 'pageno') ?? 'pageNo';
		for (const [key, value] of Object.entries({
			...params,
			[pageKey]: String(page),
			serviceKey: apiKey,
		})) {
			url.searchParams.set(key, value);
		}
		const xml = await fetchXml(url);
		if (page === 1) total = Number(tag(xml, 'totalCount')) || 0;
		const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
		for (const item of items) {
			const row = parse(item);
			if (row && validRow(row)) rows.push(row);
		}
		if (items.length < 1000 || (total > 0 && page * 1000 >= total)) break;
	}
	return rows;
}

function baseRow(
	source: string,
	title: string,
	venue: string,
	start: string,
	end: string,
): Exhibition {
	return {
		source,
		title,
		venue_name_fallback: venue || '장소 정보 없음',
		start_date: start,
		end_date: end,
		synced_at: new Date().toISOString(),
	};
}

async function cultureRows(key: string): Promise<Exhibition[]> {
	return await fetchPages(
		'https://apis.data.go.kr/B553457/cultureinfo/period2',
		key,
		{
			PageNo: '1',
			numOfrows: '1000',
			sortStdr: '1',
			from: '20260101',
			to: '29991231',
			serviceTp: 'A',
		},
		(item) => {
			if (tag(item, 'serviceName') !== '전시') return null;
			const start = tag(item, 'startDate');
			const end = tag(item, 'endDate');
			if (!/^\d{8}$/.test(start) || !/^\d{8}$/.test(end)) return null;
			const row = baseRow(
				'culture',
				tag(item, 'title'),
				tag(item, 'place'),
				`${start.slice(0, 4)}.${start.slice(4, 6)}.${start.slice(6)}`,
				`${end.slice(0, 4)}.${end.slice(4, 6)}.${end.slice(6)}`,
			);
			const image = tag(item, 'thumbnail');
			if (image) row.image_url = image;
			return row;
		},
	);
}

function kcisaRow(item: string, source: 'sac' | 'kcisa_moca'): Exhibition | null {
	const isSac = source === 'sac';
	if (isSac && tag(item, 'GENRE') !== '전시') return null;
	const title = tag(item, isSac ? 'TITLE' : 'title');
	const venue = isSac
		? tag(item, 'EVENT_SITE') || tag(item, 'CNTC_INSTT_NM')
		: tag(item, 'rights') || tag(item, 'venue');
	const period = tag(item, isSac ? 'PERIOD' : 'eventPeriod');
	const match = period.match(/^(\d{4})-(\d{2})-(\d{2})~(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) return null;
	const [, sy, sm, sd, ey, em, ed] = match;
	const row = baseRow(source, title, venue, `${sy}.${sm}.${sd}`, `${ey}.${em}.${ed}`);
	const fields: Record<string, string> = isSac
		? {
				description: tag(item, 'DESCRIPTION') || tag(item, 'SUB_DESCRIPTION'),
				open_hours: tag(item, 'EVENT_PERIOD') || '운영시간 정보 없음',
				admission: tag(item, 'CHARGE') || '정보 없음',
				ticket_url: tag(item, 'URL'),
				genre: '전시',
				image_url: tag(item, 'IMAGE_OBJECT'),
			}
		: {
				description: tag(item, 'subDescription'),
				admission: tag(item, 'charge') === '0' ? '무료' : tag(item, 'charge') || '정보 없음',
			};
	for (const [key, value] of Object.entries(fields)) if (value) row[key] = value;
	return row;
}

async function syncSource(
	supabase: SupabaseClient,
	source: string,
	rows: Exhibition[],
): Promise<number> {
	if (rows.length === 0)
		throw new Error(`${source} returned no eligible exhibitions; existing rows were kept.`);
	let inserted = 0;
	for (let index = 0; index < rows.length; index += 100) {
		const { data, error } = await supabase.rpc('sync_exhibitions_batch', {
			p_rows: rows.slice(index, index + 100),
		});
		if (error) throw new Error(`${source} database write failed: ${error.message}`);
		inserted += Number(data ?? 0);
	}
	const syncedAt = new Date().toISOString();
	const { data: museumRows, error: museumError } = await supabase
		.from('museums')
		.select('id,name,venue_group_name')
		.limit(10000);
	if (museumError) throw new Error(`Museum lookup failed: ${museumError.message}`);
	const museums = (museumRows ?? []).map((museum) => ({
		id: museum.id as number,
		keys: [museum.name, museum.venue_group_name]
			.filter((value): value is string => Boolean(value))
			.map((value) => value.toLowerCase().replace(/[^0-9a-z가-힣]/g, '')),
	}));
	const { data: exhibitionRows, error: exhibitionError } = await supabase
		.from('exhibitions')
		.select('id,venue_name_fallback,museum_id')
		.eq('source', source)
		.gte('end_date', today)
		.limit(2000);
	if (exhibitionError)
		throw new Error(`Exhibition venue lookup failed: ${exhibitionError.message}`);
	for (const exhibition of exhibitionRows ?? []) {
		if (exhibition.museum_id) continue;
		const venue = String(exhibition.venue_name_fallback ?? '')
			.toLowerCase()
			.replace(/[^0-9a-z가-힣]/g, '');
		if (venue.length < 4) continue;
		const match = museums.find((museum) =>
			museum.keys.some(
				(key) => key.length >= 4 && (key === venue || key.includes(venue) || venue.includes(key)),
			),
		);
		if (!match) continue;
		const { error } = await supabase
			.from('exhibitions')
			.update({ museum_id: match.id })
			.eq('id', exhibition.id);
		if (error) console.error(`Museum link failed for exhibition ${exhibition.id}:`, error.message);
	}
	const { error: pruneError } = await supabase
		.from('exhibitions')
		.delete()
		.eq('source', source)
		.lt('end_date', today);
	if (pruneError) throw new Error(`${source} cleanup failed: ${pruneError.message}`);
	const { error: metaError } = await supabase
		.from('data_sync_meta')
		.upsert({ source, synced_at: syncedAt }, { onConflict: 'source' });
	if (metaError) console.error(`${source} sync metadata update failed:`, metaError.message);
	return inserted;
}

Deno.serve(async (req) => {
	const authHeader = req.headers.get('Authorization') ?? '';
	const cronSecret = Deno.env.get('CRON_SECRET') ?? '';
	if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 });
	}

	today = seoulDate(0);
	syncEndMin = seoulDate(2);

	try {
		const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
		const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
		if (!supabaseUrl || !serviceKey) throw new Error('Supabase server credentials are missing.');
		const supabase = createClient(supabaseUrl, serviceKey);
		const dataKey = Deno.env.get('EXPO_PUBLIC_DATA_KEY') ?? '';
		const sacKey = Deno.env.get('EXPO_SAC_API_KEY') ?? '';
		const kcisaKey = Deno.env.get('EXPO_KOREAN_CONTEMPORARY_MUSEUM_API_KEY') ?? '';
		if (!dataKey || !sacKey || !kcisaKey)
			throw new Error('One or more exhibition source API keys are missing.');

		const sourceRows = await Promise.all([
			cultureRows(dataKey),
			fetchPages(
				'https://api.kcisa.kr/openapi/API_CCA_149/request',
				sacKey,
				{ numOfRows: '1000' },
				(item) => kcisaRow(item, 'sac'),
			),
			fetchPages(
				'https://api.kcisa.kr/openapi/service/rest/moca/docMeta',
				kcisaKey,
				{ numOfRows: '1000' },
				(item) => kcisaRow(item, 'kcisa_moca'),
			),
		]);
		const summaries = [];
		for (const [index, source] of ['culture', 'sac', 'kcisa_moca'].entries()) {
			const rows = sourceRows[index];
			const unique = [
				...new Map(
					rows.map((row) => [`${row.title}\0${row.start_date}\0${row.end_date}`, row]),
				).values(),
			];
			summaries.push({ source, count: await syncSource(supabase, source, unique) });
		}
		return Response.json({ ok: true, synced: summaries });
	} catch (error) {
		console.error('Exhibition sync failed:', error);
		return Response.json(
			{ error: error instanceof Error ? error.message : 'Unknown sync error' },
			{ status: 500 },
		);
	}
});
