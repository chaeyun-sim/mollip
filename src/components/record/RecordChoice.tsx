import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

interface RecordChoiceProps {
	label: string;
	selected: boolean;
	onPress: () => void;
}

/** 둘 중 하나를 고르는 큰 선택지 — 선택은 색뿐 아니라 체크 아이콘과 굵은 글씨로도 드러난다 */
export function RecordChoice({ label, selected, onPress }: RecordChoiceProps) {
	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="radio"
			accessibilityLabel={label}
			accessibilityState={{ checked: selected }}
			className={cn('min-h-[64px] flex-row items-center gap-3 rounded-2xl border-[1.5px] px-4', {
				'border-moss bg-white': selected,
				'border-transparent bg-surface-neutral': !selected,
			})}
			style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
		>
			<View
				className={cn('h-6 w-6 items-center justify-center rounded-full border-[1.5px]', {
					'border-moss bg-moss': selected,
					'border-gray600': !selected,
				})}
			>
				{selected && <Ionicons name="checkmark" size={15} className="text-white" />}
			</View>
			<Text
				className={cn('text-[16px]', {
					'font-pretendard-semibold text-gray900': selected,
					'font-pretendard-medium text-gray700': !selected,
				})}
			>
				{label}
			</Text>
		</Pressable>
	);
}
