import { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';

import { useCultureExhibitions, type CultureExhibitionItem } from '@/src/hooks/useCultureExhibitions';
import { useKcisaExhibitions, type KcisaExhibitionItem } from '@/src/hooks/useKcisaExhibitions';
import { useVisitStore } from '@/src/store/visitStore';
import { VisitTicketGridCard } from '@/src/components/archive/VisitTicketGridCard';

const GAP = 12;

interface VisitTicketGridCardContainerProps {
	dateKey: string;
	data: KcisaExhibitionItem | CultureExhibitionItem | undefined;
	onPress: (dateKey: string) => void;
}

function VisitTicketGridCardContainer({
	dateKey,
	data,
	onPress,
}: VisitTicketGridCardContainerProps) {
	if (!data) {
		return (
			<View
				className='w-1/2 rounded-tl-2xl rounded-tr-2xl bg-[#F0EDE8]'
				style={{ height: 310 }}
			/>
		);
	}

	return (
		<VisitTicketGridCard
			dateKey={dateKey}
			title={data.title ?? ''}
			imageUrl={data.thumbnail ?? ''}
			venue={data.venue ?? ''}
			onPress={() => onPress(dateKey)}
		/>
	);
}

interface VisitTicketGridProps {
	onPress: (dateKey: string) => void;
}

export function VisitTicketGrid({ onPress }: VisitTicketGridProps) {
	const visits = useVisitStore((s) => s.visits);
	const [containerWidth, setContainerWidth] = useState(0);

	const { items } = useCultureExhibitions();
	const { items: kcisaItems } = useKcisaExhibitions();

	const handleLayout = (e: LayoutChangeEvent) => {
		const w = e.nativeEvent.layout.width;
		if (w > 0 && w !== containerWidth) setContainerWidth(w);
	};

	const sortedDateKeys = Object.keys(visits).sort((a, b) => b.localeCompare(a));

	return (
		<View onLayout={handleLayout} className='flex-row flex-wrap gap-3'>
			{containerWidth > 0 &&
				sortedDateKeys.map((dateKey) => {
					const visit = visits[dateKey];
					const data =
						kcisaItems.find((item) => item.id === visit.exhibitionId) ||
						items.find((item) => item.id === visit.exhibitionId);
					return (
						<VisitTicketGridCardContainer
							key={dateKey}
							dateKey={dateKey}
							data={data}
							onPress={onPress}
						/>
					);
				})}
		</View>
	);
}
