import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

interface StarRatingProps {
	value: number;
	onChange: (value: number) => void;
	size?: number;
	disabled?: boolean;
	/** light: 흰 카드(확정 큐) / dark: 다크 다이어리 화면 */
	tone?: 'light' | 'dark';
}

// 확정 큐 1단계 — 탭해서 별점(1~5)을 매긴다
export function StarRating({
	value,
	onChange,
	size = 30,
	disabled,
	tone = 'light',
}: StarRatingProps) {
	const STAR_VALUES = [1, 2, 3, 4, 5] as const;

	const filled = tone === 'dark' ? 'text-primary' : 'text-primary-dark';
	const empty = tone === 'dark' ? 'text-white/28' : 'text-gray400';

	return (
		<View className="flex-row gap-2">
			{STAR_VALUES.map((n) => (
				<Pressable
					key={n}
					onPress={() => onChange(n)}
					disabled={disabled}
					hitSlop={6}
					accessibilityRole="button"
					accessibilityLabel={`별점 ${n}점`}
					accessibilityState={{ selected: n <= value }}
					style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
				>
					<Ionicons
						name={n <= value ? 'star' : 'star-outline'}
						size={size}
						className={n <= value ? filled : empty}
					/>
				</Pressable>
			))}
		</View>
	);
}
