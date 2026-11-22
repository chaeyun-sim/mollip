import { useEffect, useState } from 'react';
import type { DayVisit } from '@/src/store/visitStore';
import type { VisitEnglishName } from '@/src/utils/visitEnglishNames';
import { supabase } from '@/src/utils/supabase';

interface ExhibitionEnglishRow {
	id: number;
	title_en: string | null;
	museums: { name_en: string | null } | null;
}

/**
 * 기록에 연결된 전시의 영문 제목·장소를 한 번에 조회한다.
 * enabled가 false(한국어)면 조회하지 않는다. 반환값은 visitKey → 영문 이름.
 */
export function useExhibitionEnglishNames(
	visits: Record<string, DayVisit>,
	enabled: boolean,
): Record<string, VisitEnglishName> {
	const [names, setNames] = useState<Record<string, VisitEnglishName>>({});
	const visitIdsKey = JSON.stringify(
		Object.fromEntries(Object.entries(visits).map(([k, v]) => [k, v.exhibitionId])),
	);

	useEffect(() => {
		if (!enabled) return;
		const entries = Object.entries(visits).filter(
			([, v]) => v.exhibitionId && Number.isFinite(Number(v.exhibitionId)),
		);
		const ids = [...new Set(entries.map(([, v]) => Number(v.exhibitionId)))];
		if (ids.length === 0) return;

		let cancelled = false;
		supabase
			.from('exhibitions')
			.select('id, title_en, museums(name_en)')
			.in('id', ids)
			.then(({ data, error }) => {
				if (cancelled || error) return;
				const byId = new Map(
					((data ?? []) as unknown as ExhibitionEnglishRow[]).map((row) => [row.id, row]),
				);
				const map: Record<string, VisitEnglishName> = {};
				for (const [key, visit] of entries) {
					const row = byId.get(Number(visit.exhibitionId));
					const title = row?.title_en?.trim() || undefined;
					const venue = row?.museums?.name_en?.trim() || undefined;
					if (title || venue) map[key] = { title, venue };
				}
				setNames(map);
			});

		return () => {
			cancelled = true;
		};
		// visitIdsKey가 실제 변경 조건. visits 객체 identity는 매 렌더 달라질 수 있다.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [visitIdsKey, enabled]);

	return names;
}
