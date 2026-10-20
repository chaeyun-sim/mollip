import { Ionicons } from '@expo/vector-icons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Pressable, Text, View } from 'react-native';
import { ImageFallback } from '@/src/components/common/ImageFallback';
import type { DayVisit } from '@/src/store/visitStore';
import { cn } from '@/src/lib/cn';
import type { DayEvent } from '@/src/utils/diaryEvents';

export interface VisitPickerEntry {
	visitKey: string;
	visit: DayVisit;
	imageUrl?: string;
}

interface VisitPickerSheetProps {
	dateLabel: string;
	entries: VisitPickerEntry[];
	onSelect: (visitKey: string) => void;
	/** 그날 열리거나 닫히는 스크랩한 전시 — 고르면 전시 상세로 */
	events?: DayEvent[];
	onSelectEvent?: (exhibitionId: string) => void;
}

// 캘린더 날짜를 탭하면 뜨는 선택 시트 — 그날의 관람 티켓과 스크랩한 전시의 개막·마감을 함께 보여준다
export function VisitPickerSheet({
	dateLabel,
	entries,
	onSelect,
	events = [],
	onSelectEvent,
}: VisitPickerSheetProps) {
	const title = entries.length > 0 ? '어떤 티켓을 볼까요?' : '이 날의 스크랩한 전시';

	return (
		<BottomSheetScrollView className="px-6" contentContainerClassName="pb-10">
			<Text className="mt-2 mb-1 text-[12px] tracking-wider font-pretendard-semibold text-gray500">
				{dateLabel}
			</Text>
			<Text className="mb-5 text-[18px] font-hahmlet-bold text-gray900">{title}</Text>

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
				{events.map((event) => {
					const kindLabel = event.kind === 'open' ? '개막' : '마감';
					return (
						<Pressable
							key={`${event.id}-${event.kind}`}
							onPress={() => onSelectEvent?.(event.id)}
							accessibilityRole="button"
							accessibilityLabel={`${event.title} ${kindLabel}, 전시 보기`}
							style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
							className="flex-row items-center gap-3 rounded-2xl bg-gray100 px-4 py-3.5"
						>
							<Text
								className={cn('rounded-[4px] px-1.5 py-0.5 text-[11px] font-pretendard-semibold', {
									'bg-brand/15 text-brand': event.kind === 'open',
									'bg-error/10 text-error': event.kind === 'close',
								})}
							>
								{kindLabel}
							</Text>
							<Text
								className="flex-1 text-[15px] font-pretendard-semibold text-gray900"
								numberOfLines={1}
							>
								{event.title}
							</Text>
							<Ionicons name="chevron-forward" size={18} className="text-gray400" />
						</Pressable>
					);
				})}
			</View>
		</BottomSheetScrollView>
	);
}
