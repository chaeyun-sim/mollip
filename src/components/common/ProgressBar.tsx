import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { cn } from '@/src/lib/cn';

export type ProgressBarSize = 'light' | 'normal' | 'bold';

interface ProgressBarProps {
	/** 0~1 사이 진행률 */
	progress: number;
	/** light: 2px / normal: 4px(기본) / bold: 8px */
	size?: ProgressBarSize;
	/** 진행 바 색상 className */
	colorClassName?: string;
	/** 트랙(배경) 색상 className */
	trackClassName?: string;
	/** 진행도 변경 시 부드러운 전환 애니메이션 적용 여부 (기본 true) */
	animate?: boolean;
	className?: string;
}

const SIZE_HEIGHT: Record<ProgressBarSize, string> = {
	light: 'h-0.5',
	normal: 'h-1',
	bold: 'h-2',
};

/** 토스 TDS ProgressBar를 참고한 단계·업로드 진행률 표시 바. 0~1 값을 받아 너비로 시각화한다. */
export function ProgressBar({
	progress,
	size = 'normal',
	colorClassName = 'bg-primary-dark',
	trackClassName = 'bg-gray200',
	animate = true,
	className,
}: ProgressBarProps) {
	const clamped = Math.min(1, Math.max(0, progress));
	const width = useSharedValue(clamped);

	useEffect(() => {
		width.set(animate ? withTiming(clamped, { duration: 250 }) : clamped);
	}, [clamped, animate, width]);

	const fillStyle = useAnimatedStyle(() => ({
		width: `${width.value * 100}%`,
	}));

	return (
		<View
			className={cn(
				'w-full overflow-hidden rounded-full',
				SIZE_HEIGHT[size],
				trackClassName,
				className,
			)}
			accessibilityRole="progressbar"
			accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
		>
			<Animated.View className={cn('h-full rounded-full', colorClassName)} style={fillStyle} />
		</View>
	);
}
