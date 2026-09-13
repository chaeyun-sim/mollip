import { Pressable, Text, View } from 'react-native';
import { cn } from '@/src/lib/cn';

export type VenueExhibitionTab = 'active' | 'upcoming';

interface VenueExhibitionTabsProps {
	tab: VenueExhibitionTab;
	onChangeTab: (tab: VenueExhibitionTab) => void;
	activeCount: number;
	upcomingCount: number;
	accentColor: string;
}

export function VenueExhibitionTabs({
	tab,
	onChangeTab,
	activeCount,
	upcomingCount,
	accentColor,
}: VenueExhibitionTabsProps) {
	return (
		<View
			className="flex-row items-end gap-6 mb-4 border-b border-black/6"
			accessibilityRole="tablist"
		>
			{(
				[
					['active', '진행 중', activeCount],
					['upcoming', '예정', upcomingCount],
				] as const
			).map(([key, label, count]) => (
				<Pressable
					key={key}
					onPress={() => onChangeTab(key)}
					hitSlop={8}
					className="pt-2 pb-2.5"
					style={({ pressed }) => pressed && { opacity: 0.6 }}
					accessibilityRole="tab"
					accessibilityState={{ selected: tab === key }}
					accessibilityLabel={`${label} 전시 ${count}개`}
				>
					<Text
						className={cn(
							'text-sm font-pretendard-bold',
							tab === key ? 'text-black' : 'text-black/55',
						)}
					>
						{label} <Text className="text-xs font-pretendard-medium">{count}</Text>
					</Text>
					{tab === key && (
						<View
							className="absolute -bottom-px inset-x-0 h-0.5 rounded-full"
							style={{ backgroundColor: accentColor }}
						/>
					)}
				</Pressable>
			))}
		</View>
	);
}
