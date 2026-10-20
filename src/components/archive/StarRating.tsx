import { View } from 'react-native';
import { StarButton } from '@/src/components/archive/StarButton';

interface StarRatingProps {
	value: number;
	onChange: (value: number) => void;
	size?: number;
	disabled?: boolean;
	/** light: 밝은 화면(기록하기) / dark: 다크 다이어리 화면 / cocoa: 브랜드색 없이 코코아 톤으로 조용하게 */
	tone?: 'light' | 'dark' | 'cocoa' | 'gold';
}

// 별의 왼쪽/오른쪽을 탭해 0.5점 단위로 매긴다 — 기록하기·티켓 상세 공용
export function StarRating({
	value,
	onChange,
	size = 30,
	disabled,
	tone = 'light',
}: StarRatingProps) {
	const STAR_VALUES = [1, 2, 3, 4, 5] as const;

	const filled = {
		light: 'text-brand',
		dark: 'text-brand-on-dark',
		cocoa: 'text-gray700',
		gold: 'text-amber-300',
	}[tone];
	const empty = {
		light: 'text-gray400',
		dark: 'text-white/28',
		cocoa: 'text-gray600',
		gold: 'text-amber-200',
	}[tone];

	return (
		<View className="flex-row gap-2">
			{STAR_VALUES.map((n) => {
				let iconName: 'star' | 'star-half' | 'star-outline' = 'star-outline';
				if (value >= n) iconName = 'star';
				else if (value >= n - 0.5) iconName = 'star-half';

				return (
					<StarButton
						key={n}
						iconName={iconName}
						size={size}
						iconClassName={n - 0.5 <= value ? filled : empty}
						onPress={(locationX) => onChange(locationX < size / 2 ? n - 0.5 : n)}
						disabled={disabled}
						accessibilityLabel={`별점 ${n - 0.5}점 또는 ${n}점`}
						accessibilityHint="별의 왼쪽은 반 점, 오른쪽은 한 점"
						selected={n - 0.5 <= value}
					/>
				);
			})}
		</View>
	);
}
