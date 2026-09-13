import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, Text } from 'react-native';
import { cn } from '@/src/lib/cn';
import { SORT_OPTIONS, type SortCriterion } from './utils';

interface SortChipsProps {
	criterion: SortCriterion;
	onChangeCriterion: (criterion: SortCriterion) => void;
}

// 정렬 기준 칩 — 드롭다운 대신 항상 보이는 한 줄로 두어 선택 상태가 바로 읽힌다.
// 옵션이 늘어나 한 줄에 다 안 들어가면 가로 스크롤로 넘어간다.
export function SortChips({ criterion, onChangeCriterion }: SortChipsProps) {
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerClassName="gap-1.5"
		>
			{SORT_OPTIONS.map((option) => {
				const active = criterion === option.key;
				return (
					<Pressable
						key={option.key}
						onPress={() => {
							if (!active) Haptics.selectionAsync();
							onChangeCriterion(option.key);
						}}
						className={cn(
							'px-3 h-8 rounded-full items-center justify-center border',
							active ? 'bg-primary-dark border-transparent' : 'bg-transparent border-black/10',
						)}
						hitSlop={4}
						accessibilityRole="button"
						accessibilityState={{ selected: active }}
						accessibilityLabel={`${option.label}으로 정렬`}
					>
						<Text
							className={cn(
								'text-xs',
								active ? 'text-white font-pretendard-bold' : 'text-black/50 font-pretendard-medium',
							)}
						>
							{option.label}
						</Text>
					</Pressable>
				);
			})}
		</ScrollView>
	);
}
