import { useMemo } from 'react';
import { View } from 'react-native';
import { useCultureExhibitions } from '@/src/hooks/useCultureExhibitions';
import { useKcisaExhibitions } from '@/src/hooks/useKcisaExhibitions';
import { useExhibitionsByIds } from '@/src/hooks/useExhibitionsByIds';
import { DayVisit, useVisitStore } from '@/src/store/visitStore';
import { VisitTicketGridCard } from '@/src/components/archive/VisitTicketGridCard';

interface VisitTicketGridProps {
	onPress: (dateKey: string) => void;
}

export function VisitTicketGrid({ onPress }: VisitTicketGridProps) {
	const visits = useVisitStore((s) => s.visits);

	const { items } = useCultureExhibitions();
	const { items: kcisaItems } = useKcisaExhibitions();

	const sortedDateKeys = useMemo(
		() =>
			Object.keys(visits)
				.filter((k) => typeof visits[k].exhibitionId === 'string')
				.sort((a, b) => b.localeCompare(a)),
		[visits],
	);

	// 캐시에 없는 전시 ID만 추려서 날짜 필터 없이 조회 (만료된 전시 대응)
	const missingIds = useMemo(() => {
		const cachedIds = new Set([
			...kcisaItems.map((i) => i.id),
			...items.map((i) => i.id),
		]);
		return [
			...new Set(
				sortedDateKeys
					.map((dk) => visits[dk].exhibitionId)
					.filter((id): id is string => !!id && !cachedIds.has(id)),
			),
		];
	}, [sortedDateKeys, visits, kcisaItems, items]);

	const fetchedItems = useExhibitionsByIds(missingIds);

	const getData = (visit: DayVisit) =>
		kcisaItems.find((item) => item.id === visit.exhibitionId) ||
		items.find((item) => item.id === visit.exhibitionId) ||
		fetchedItems.find((item) => item.id === visit.exhibitionId);

	return (
		<View className='flex-col gap-4'>
			{sortedDateKeys.map((dateKey) => {
				const visit = visits[dateKey];
				const data = getData(visit);
				// 실시간 조회 실패 시(만료·리싱크로 id 불일치) 기록 당시 저장해둔 값으로 대체
				const title = data?.title ?? visit.exhibitionTitle;
				const venue = data?.venue ?? visit.venue;

				if (!title) {
					return (
						<View
							key={dateKey}
							className='w-full rounded-2xl bg-[#F0EDE8]'
							style={{ height: 116 }}
						/>
					);
				}

				return (
					<VisitTicketGridCard
						key={dateKey}
						dateKey={dateKey}
						title={title}
						venue={venue}
						onPress={() => onPress(dateKey)}
					/>
				);
			})}
		</View>
	);
}
