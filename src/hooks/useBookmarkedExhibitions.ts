import { useEffect, useState } from 'react';
import type { Exhibition } from '@/src/data/exhibitions';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import {
	EXHIBITION_COLUMNS,
	mapExhibitionRowToExhibition,
	type ExhibitionRow,
} from '@/src/utils/exhibitionMapper';
import { supabase } from '@/src/utils/supabase';

type MuseumNameEn = { name_en: string | null };
type BookmarkedExhibitionRow = ExhibitionRow & {
	museums: MuseumNameEn | MuseumNameEn[] | null;
};

const museumNameEn = (raw: BookmarkedExhibitionRow['museums']) => {
	const museum = Array.isArray(raw) ? raw[0] : raw;
	return museum?.name_en?.trim() || undefined;
};

export function useBookmarkedExhibitions(): {
	data: Exhibition[];
	isLoading: boolean;
	error: Error | null;
} {
	const ids = useBookmarkStore((s) => s.ids);
	const [data, setData] = useState<Exhibition[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		if (ids.length === 0) {
			setData([]);
			setIsLoading(false);
			setError(null);
			return;
		}

		setIsLoading(true);
		setError(null);

		supabase
			.from('exhibitions')
			// 영어 화면용 미술관 영문명만 조인한다 — 한국어 장소(venue)는 기존 그대로
			.select(`${EXHIBITION_COLUMNS}, museums(name_en)`)
			.in(
				'id',
				ids.map(Number).filter((n) => !isNaN(n)),
			)
			.then(({ data: rows, error: sbError }) => {
				if (sbError) {
					setError(new Error(sbError.message));
					setData([]);
				} else {
					setData(
						((rows ?? []) as BookmarkedExhibitionRow[]).map((row) => ({
							...mapExhibitionRowToExhibition(row),
							venueEn: museumNameEn(row.museums),
						})),
					);
				}
				setIsLoading(false);
			});
	}, [ids]);

	return { data, isLoading, error };
}
