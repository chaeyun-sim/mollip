import { useEffect, useState } from 'react';

import type { Exhibition } from '@/src/data/exhibitions';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import {
	EXHIBITION_COLUMNS,
	mapExhibitionRowToExhibition,
	type ExhibitionRow,
} from '@/src/utils/exhibitionMapper';
import { supabase } from '@/src/utils/supabase';

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
			.select(EXHIBITION_COLUMNS)
			.in(
				'id',
				ids.map(Number).filter((n) => !isNaN(n)),
			)
			.then(({ data: rows, error: sbError }) => {
				if (sbError) {
					setError(new Error(sbError.message));
					setData([]);
				} else {
					setData((rows ?? []).map((row) => mapExhibitionRowToExhibition(row as ExhibitionRow)));
				}
				setIsLoading(false);
			});
	}, [ids]);

	return { data, isLoading, error };
}
