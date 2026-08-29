import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { ExhibitionResultCard } from '@/src/components/search/ExhibitionResultCard';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import { supabase } from '@/src/utils/supabase';
import {
	EXHIBITION_COLUMNS,
	mapExhibitionRowToExhibition,
	type ExhibitionRow,
} from '@/src/utils/exhibitionMapper';
import { getExhibitionStatus, isExhibitionListed } from '@/src/utils/exhibitionSearch';
import type { SearchResult } from '@/src/hooks/useExhibitionSearch';
import { colors } from '@/src/constants/colors';

const ITEM_LAYOUT = LinearTransition.duration(200);

const STATUS_ORDER = { ongoing: 0, upcoming: 1, ended: 2 } as const;

interface SavedExhibitionsProps {
	onPressExhibition: (id: string) => void;
}

export function SavedExhibitions({ onPressExhibition }: SavedExhibitionsProps) {
	const ids = useBookmarkStore((s) => s.ids);
	const [loading, setLoading] = useState(false);
	const [rows, setRows] = useState<SearchResult[]>([]);

	useEffect(() => {
		if (ids.length === 0) {
			setRows([]);
			return;
		}
		let cancelled = false;
		setLoading(true);
		const numericIds = ids.map(Number).filter((n) => Number.isFinite(n));
		if (numericIds.length === 0) {
			setRows([]);
			setLoading(false);
			return;
		}
		supabase
			.from('exhibitions')
			.select(EXHIBITION_COLUMNS)
			.in('id', numericIds)
			.then(({ data, error }) => {
				if (cancelled) return;
				if (error || !data) {
					setRows([]);
					setLoading(false);
					return;
				}
				const mapped = (data as ExhibitionRow[])
					.map((row) => ({
						exhibition: mapExhibitionRowToExhibition(row),
						status: getExhibitionStatus(mapExhibitionRowToExhibition(row)),
						distanceKm: null as number | null,
					}))
					.filter((r) => isExhibitionListed(r.exhibition));
				const order = new Map(ids.map((id, i) => [id, i]));
				mapped.sort(
					(a, b) => (order.get(a.exhibition.id) ?? 0) - (order.get(b.exhibition.id) ?? 0),
				);
				setRows(mapped);
				setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [ids]);

	const results = useMemo(
		() =>
			[...rows].sort(
				(a, b) =>
					STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
					a.exhibition.endDate.localeCompare(b.exhibition.endDate),
			),
		[rows],
	);

	if (loading && results.length === 0) {
		return (
			<View className="items-center py-16">
				<ActivityIndicator color={colors.gray600} />
			</View>
		);
	}

	if (results.length === 0) {
		return (
			<View className="rounded-[22px] bg-bg-light px-6 py-10 items-center">
				{/* TODO: 저장한 전시 빈 상태 일러스트
					프롬프트: 따뜻한 베이지(#F8F6F2) 배경 위에 접힌 리본 북마크와 작은 액자 그림,
					플랫 일러스트 스타일, 얇은 라인 아트, 잉크색(#1C1917) 윤곽선, 포인트 컬러는 은은한 테라코타,
					위 북마크 빈 상태 일러스트와 톤·구도를 맞춤, 정사각형 120x120 */}
				<Text className="text-[15px] text-center font-pretendard-semibold text-gray900">
					저장한 전시가 없어요
				</Text>
				<Text className="text-[13px] text-center mt-2 leading-[20px] font-pretendard-regular text-gray700">
					둘러보기에서 마음에 드는 전시를 저장해 보세요
				</Text>
			</View>
		);
	}

	return (
		<View className="gap-5">
			{results.map((r) => (
				<Animated.View
					key={r.exhibition.id}
					entering={FadeIn.duration(150)}
					exiting={FadeOut.duration(150)}
					layout={ITEM_LAYOUT}
				>
					<ExhibitionResultCard result={r} onPress={onPressExhibition} />
				</Animated.View>
			))}
		</View>
	);
}
