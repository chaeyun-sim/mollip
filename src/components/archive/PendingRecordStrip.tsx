import { Image } from 'expo-image';
import { Pressable, ScrollView, Text, View } from 'react-native';

export interface PendingRecordItem {
	visitKey: string;
	title: string;
	imageUri?: string;
	daysLeft: number;
}

interface PendingRecordStripProps {
	items: PendingRecordItem[];
	onPress: (visitKey: string) => void;
}

/** 도슨트로 들었지만 아직 기록하지 않은 전시 — 벽 맨 위에서 이어서 기록하게 한다 */
export function PendingRecordStrip({ items, onPress }: PendingRecordStripProps) {
	return (
		<View className="mt-4 mb-2">
			<Text className="mb-3 font-pretendard-semibold text-[13.5px] text-gray900">
				기록을 기다리는 전시
			</Text>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerClassName="gap-3"
			>
				{items.map((item) => (
					<Pressable
						key={item.visitKey}
						onPress={() => onPress(item.visitKey)}
						accessibilityRole="button"
						accessibilityLabel={`${item.title} 기록하기, ${item.daysLeft}일 남음`}
						style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
						className="w-[220px] flex-row items-center rounded-2xl border-[1px] border-dashed border-gray300 bg-bg-tonal p-3"
					>
						<View className="mr-3 h-[78px] w-[56px] overflow-hidden rounded-[2px] bg-white">
							{item.imageUri && (
								<Image
									source={{ uri: item.imageUri }}
									contentFit="cover"
									style={{ width: '100%', height: '100%' }}
								/>
							)}
						</View>
						<View className="flex-1">
							<Text numberOfLines={2} className="font-hahmlet-semibold text-[13px] text-ink">
								{item.title}
							</Text>
							<Text className="mt-1 font-pretendard-regular text-[11.5px] text-gray600">
								{item.daysLeft}일 남음
							</Text>
						</View>
					</Pressable>
				))}
			</ScrollView>
		</View>
	);
}
