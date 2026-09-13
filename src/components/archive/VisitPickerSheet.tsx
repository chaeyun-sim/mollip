import { Ionicons } from '@expo/vector-icons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Pressable, Text, View } from 'react-native';

import { ImageFallback } from '@/src/components/common/ImageFallback';
import type { DayVisit } from '@/src/store/visitStore';

export interface VisitPickerEntry {
	visitKey: string;
	visit: DayVisit;
	imageUrl?: string;
}

interface VisitPickerSheetProps {
	dateLabel: string;
	entries: VisitPickerEntry[];
	onSelect: (visitKey: string) => void;
}

// 하루에 전시를 여러 개 봤을 때 캘린더 우표를 탭하면 뜨는 선택 시트 — 하나 고르면 그 티켓 상세로 이동
export function VisitPickerSheet({ dateLabel, entries, onSelect }: VisitPickerSheetProps) {
	return (
		<BottomSheetScrollView className="px-6" contentContainerClassName="pb-10">
			<Text className="mt-2 mb-1 text-[12px] tracking-wider font-pretendard-semibold text-gray500">
				{dateLabel}
			</Text>
			<Text className="mb-5 text-[18px] font-hahmlet-bold text-gray900">어떤 티켓을 볼까요?</Text>

			<View className="gap-3">
				{entries.map(({ visitKey, visit, imageUrl }) => (
					<Pressable
						key={visitKey}
						onPress={() => onSelect(visitKey)}
						accessibilityRole="button"
						accessibilityLabel={`${visit.exhibitionTitle ?? '오늘의 전시'} 티켓 보기`}
						style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
						className="flex-row items-center gap-3 p-2 rounded-2xl bg-gray100"
					>
						<ImageFallback
							heroImageUri={imageUrl}
							className="w-14 h-14 rounded-xl bg-image-placeholder"
							iconSize={20}
							resizeMode="cover"
						/>
						<View className="flex-1">
							<Text className="text-[15px] font-pretendard-semibold text-gray900" numberOfLines={1}>
								{visit.exhibitionTitle ?? '오늘의 전시'}
							</Text>
							{visit.venue && (
								<Text
									className="mt-0.5 text-[12px] font-pretendard-regular text-gray600"
									numberOfLines={1}
								>
									{visit.venue}
								</Text>
							)}
						</View>
						<Ionicons name="chevron-forward" size={18} className="text-gray400" />
					</Pressable>
				))}
			</View>
		</BottomSheetScrollView>
	);
}
