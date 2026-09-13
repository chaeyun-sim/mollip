import { useMemo } from 'react';
import { View } from 'react-native';
import { useCultureExhibitions } from '@/src/hooks/useCultureExhibitions';
import { useKcisaExhibitions } from '@/src/hooks/useKcisaExhibitions';
import { useExhibitionsByIds } from '@/src/hooks/useExhibitionsByIds';
import { DayVisit, dateKeyOf, useVisitStore } from '@/src/store/visitStore';
import { VisitTicketGridCard } from '@/src/components/archive/VisitTicketGridCard';

interface VisitTicketGridProps {
	/** 카드가 속한 날짜(YYYY-MM-DD) — 그날 확정 기록이 여러 개면 목적지 화면이 모아서 보여준다 */
	onPress: (dateKey: string) => void;
}

export function VisitTicketGrid({ onPress }: VisitTicketGridProps) {
	const visits = useVisitStore((s) => s.visits);

	const { items } = useCultureExhibitions();
	const { items: kcisaItems } = useKcisaExhibitions();

	// visits 키는 "날짜::전시" — 최신순 정렬은 그대로 문자열 정렬로 충분(날짜가 앞에 오므로)
	const sortedVisitKeys = useMemo(
		() =>
			Object.keys(visits)
				.filter((k) => visits[k].status === 'confirmed')
				.sort((a, b) => b.localeCompare(a)),
		[visits],
	);

	// 캐시에 없는 전시 ID만 추려서 날짜 필터 없이 조회 (만료된 전시 대응)
	const missingIds = useMemo(() => {
		const cachedIds = new Set([...kcisaItems.map((i) => i.id), ...items.map((i) => i.id)]);
		return [
			...new Set(
				sortedVisitKeys
					.map((k) => visits[k].exhibitionId)
					.filter((id): id is string => !!id && !cachedIds.has(id)),
			),
		];
	}, [sortedVisitKeys, visits, kcisaItems, items]);

	const fetchedItems = useExhibitionsByIds(missingIds);

	const getData = (visit: DayVisit) =>
		kcisaItems.find((item) => item.id === visit.exhibitionId) ||
		items.find((item) => item.id === visit.exhibitionId) ||
		fetchedItems.find((item) => item.id === visit.exhibitionId);

	return (
		<View className="gap-4">
			{sortedVisitKeys.map((visitKey) => {
				const visit = visits[visitKey];
				const dateKey = dateKeyOf(visitKey);
				const data = getData(visit);
				// 실시간 조회 실패 시(만료·리싱크로 id 불일치) 기록 당시 저장해둔 값으로 대체
				const title = data?.title ?? visit.exhibitionTitle;
				const venue = data?.venue ?? visit.venue;

				if (!title) {
					return (
						<View
							key={visitKey}
							className="w-full rounded-2xl bg-[#F0EDE8]"
							style={{ height: 116 }}
						/>
					);
				}

				return (
					<VisitTicketGridCard
						key={visitKey}
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
