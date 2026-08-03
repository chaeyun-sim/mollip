import { useMemo } from 'react';

import { useBookmarkStore } from '@/src/store/bookmarkStore';
import { useVisitStore } from '@/src/store/visitStore';

export interface ArchiveStats {
	visitDayCount: number;
	listenedCount: number;
	savedCount: number;
}

export function useArchiveStats(): ArchiveStats {
	const visits = useVisitStore((s) => s.visits);
	const savedCount = useBookmarkStore((s) => s.ids.length);

	return useMemo(() => {
		const visitDayCount = Object.keys(visits).length;
		let listenedCount = 0;
		for (const day of Object.values(visits)) {
			listenedCount += day.listened.length;
		}
		return { visitDayCount, listenedCount, savedCount };
	}, [visits, savedCount]);
}

export function useRecentVisitDateKeys(limit = 5): string[] {
	const visits = useVisitStore((s) => s.visits);

	return useMemo(() => {
		return Object.keys(visits)
			.filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key))
			.sort((a, b) => b.localeCompare(a))
			.slice(0, limit);
	}, [visits, limit]);
}
