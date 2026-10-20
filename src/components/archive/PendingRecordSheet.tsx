import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { forwardRef } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PendingRecordItem } from '@/src/components/archive/PendingRecordStrip';
import { colors } from '@/src/constants/colors';
import { cn } from '@/src/lib/cn';

interface PendingRecordSheetProps {
	/** 남은 기간이 짧은 순으로 정렬해서 넘긴다 */
	items: PendingRecordItem[];
	onPress: (visitKey: string) => void;
}

/** 기록을 기다리는 전시 목록 — 하나만 있어도 같은 시트로 보여준다 */
export const PendingRecordSheet = forwardRef<BottomSheetModal, PendingRecordSheetProps>(
	function PendingRecordSheet({ items, onPress }, ref) {
		const insets = useSafeAreaInsets();
		const { height: windowHeight } = useWindowDimensions();

		return (
			<BottomSheetModal
				ref={ref}
				enableDynamicSizing
				maxDynamicContentSize={windowHeight * 0.7}
				enablePanDownToClose
				backgroundStyle={{ backgroundColor: colors.canvas }}
				handleIndicatorStyle={{ backgroundColor: colors.divider, width: 36 }}
				backdropComponent={(props) => (
					<BottomSheetBackdrop
						{...props}
						disappearsOnIndex={-1}
						appearsOnIndex={0}
						opacity={0.42}
					/>
				)}
			>
				<BottomSheetScrollView
					contentContainerClassName="px-6 pt-2"
					contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
				>
					<Text
						accessibilityRole="header"
						className="font-pretendard-bold text-[20px] leading-[28px] text-ink"
					>
						기록을 기다리는 전시
					</Text>
					<Text className="mt-1 font-pretendard-regular text-[13px] text-gray600">
						기간이 지나면 사라져요. 남은 기간이 짧은 순서예요
					</Text>

					<View className="mt-4">
						{items.map((item, index) => (
							<Pressable
								key={item.visitKey}
								onPress={() => onPress(item.visitKey)}
								accessibilityRole="button"
								accessibilityLabel={`${item.title} 기록하기, ${item.daysLeft}일 남음`}
								className={cn(
									'min-h-[64px] flex-row items-center gap-3 py-3',
									index > 0 && 'border-t-[0.5px] border-divider',
								)}
								style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
							>
								<View className="flex-1">
									<Text
										numberOfLines={2}
										className="font-pretendard-semibold text-[16px] leading-[22px] text-ink"
									>
										{item.title}
									</Text>
									<View className="mt-1 flex-row items-center gap-1">
										<Ionicons name="time-outline" size={13} color={colors.gray600} />
										<Text className="font-pretendard-regular text-[12px] text-gray600">
											{item.daysLeft}일 남음
										</Text>
									</View>
								</View>
								<View className="flex-row items-center gap-0.5">
									<Text className="font-pretendard-semibold text-[13px] text-brand">기록하기</Text>
									<Ionicons name="chevron-forward" size={14} color={colors.brand} />
								</View>
							</Pressable>
						))}
					</View>
				</BottomSheetScrollView>
			</BottomSheetModal>
		);
	},
);
