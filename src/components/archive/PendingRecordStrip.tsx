import { Ionicons } from '@expo/vector-icons';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useMemo, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';

import { PendingRecordSheet } from '@/src/components/archive/PendingRecordSheet';
import { colors } from '@/src/constants/colors';

export interface PendingRecordItem {
	visitKey: string;
	title: string;
	daysLeft: number;
}

interface PendingRecordStripProps {
	items: PendingRecordItem[];
	onPress: (visitKey: string) => void;
}

/** 도슨트로 들었지만 아직 기록하지 않은 전시 — 벽 맨 위 배너를 누르면 목록 시트가 열려 이어서 기록한다 */
export function PendingRecordStrip({ items, onPress }: PendingRecordStripProps) {
	const sheetRef = useRef<BottomSheetModal>(null);

	const sortedItems = useMemo(() => [...items].sort((a, b) => a.daysLeft - b.daysLeft), [items]);
	const mostUrgent = sortedItems[0];

	const handleOpenSheet = () => sheetRef.current?.present();

	const handlePressItem = (visitKey: string) => {
		sheetRef.current?.dismiss();
		onPress(visitKey);
	};

	if (!mostUrgent) return null;

	return (
		<View className="mb-2 mt-4">
			<Pressable
				onPress={handleOpenSheet}
				accessibilityRole="button"
				accessibilityLabel={`기록을 기다리는 전시 ${items.length}개, 가장 급한 전시 ${mostUrgent.daysLeft}일 남음`}
				accessibilityHint="목록을 열어 기록을 이어서 해요"
				style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
				className="min-h-[72px] flex-row items-center gap-3 rounded-2xl bg-brand px-5 py-4"
			>
				<View className="flex-1">
					<Text
						numberOfLines={1}
						className="font-pretendard-semibold text-[16px] leading-[22px] text-white"
					>
						기록을 기다리는 전시
					</Text>
					<View className="mt-1 flex-row items-center gap-1">
						<Ionicons name="time-outline" size={13} color={colors.white} />
						<Text className="font-pretendard-regular text-[12px] text-white/80">
							{`${items.length}개 · 가장 급한 전시 ${mostUrgent.daysLeft}일 남음`}
						</Text>
					</View>
				</View>
				<View className="flex-row items-center gap-0.5 rounded-full bg-white px-3.5 py-2">
					<Text className="font-pretendard-semibold text-[13px] text-brand">보기</Text>
					<Ionicons name="chevron-forward" size={14} color={colors.brand} />
				</View>
			</Pressable>

			<PendingRecordSheet ref={sheetRef} items={sortedItems} onPress={handlePressItem} />
		</View>
	);
}
