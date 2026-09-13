import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
	Easing,
	interpolate,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import type { OnboardingIntroTicket } from '@/src/data/onboardingIntroTickets';
import { ONBOARDING_INTRO_TICKETS } from '@/src/data/onboardingIntroTickets';
import { Screen } from '@/src/components/layout/Screen';
import { cn } from '@/src/lib/cn';

const FLIP_TIMING = { duration: 520, easing: Easing.inOut(Easing.cubic) };

interface OnboardingIntroStackProps {
	onFinished: () => void;
}

interface IntroTicketCardProps {
	ticket: OnboardingIntroTicket;
	index: number;
	isTop: boolean;
	reduceMotion: boolean;
}

function IntroTicketCard({ ticket, index, isTop, reduceMotion }: IntroTicketCardProps) {
	const [flipped, setFlipped] = useState(false);
	const rotation = useSharedValue(0);

	const handleFlip = useCallback(() => {
		if (!isTop) return;
		const next = !flipped;
		setFlipped(next);
		rotation.set(reduceMotion ? (next ? 1 : 0) : withTiming(next ? 1 : 0, FLIP_TIMING));
	}, [flipped, isTop, reduceMotion, rotation]);

	const frontStyle = useAnimatedStyle(() => ({
		transform: reduceMotion
			? []
			: [
					{ perspective: 1200 },
					{ rotateY: `${interpolate(rotation.value, [0, 1], [0, -180])}deg` },
				],
		opacity: reduceMotion ? (flipped ? 0 : 1) : 1,
		backfaceVisibility: 'hidden',
	}));

	const backStyle = useAnimatedStyle(() => ({
		transform: reduceMotion
			? []
			: [{ perspective: 1200 }, { rotateY: `${interpolate(rotation.value, [0, 1], [180, 0])}deg` }],
		opacity: reduceMotion ? (flipped ? 1 : 0) : 1,
		backfaceVisibility: 'hidden',
	}));

	const stackStyle = {
		transform: isTop || reduceMotion ? [] : [{ scale: index === 1 ? 0.94 : 0.88 }],
		top: isTop || reduceMotion ? 0 : index * -14,
	};

	return (
		<Pressable
			onPress={handleFlip}
			disabled={!isTop}
			accessibilityRole="button"
			accessibilityLabel={`${ticket.front} 티켓`}
			accessibilityHint="탭하면 뒷면을 봅니다"
			className="absolute inset-x-0"
			style={stackStyle}
		>
			<View className="h-[360px]">
				<Animated.View
					className="absolute inset-0 rounded-3xl bg-white px-7 py-8 justify-between border border-gray300"
					pointerEvents={flipped ? 'none' : 'auto'}
					style={[
						{
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 8 },
							shadowOpacity: 0.12,
							shadowRadius: 20,
							elevation: 8,
							zIndex: flipped ? 0 : 2,
						},
						frontStyle,
					]}
				>
					<Text className="text-[12px] text-gray600 font-pretendard-medium tracking-[1px]">
						입장권
					</Text>
					<Text className="text-[40px] leading-[48px] text-gray900 font-hahmlet-bold">
						{ticket.front}
					</Text>
					<View className="border-t border-dashed border-gray300 pt-4">
						<Text className="text-[13px] text-gray600 font-pretendard-regular">
							앞면을 탭하면 뒤집힙니다
						</Text>
					</View>
				</Animated.View>
				<Animated.View
					className="absolute inset-0 rounded-3xl bg-gray200 px-7 py-8 justify-between border border-gray300"
					pointerEvents={flipped ? 'auto' : 'none'}
					style={[
						{
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 8 },
							shadowOpacity: 0.12,
							shadowRadius: 20,
							elevation: 8,
							zIndex: flipped ? 2 : 0,
						},
						backStyle,
					]}
				>
					<Text className="text-[12px] text-gray600 font-pretendard-medium tracking-[1px]">
						{ticket.front}
					</Text>
					<Text className="text-[22px] leading-[30px] text-gray900 font-hahmlet-bold">
						{ticket.back}
					</Text>
					<View className="w-2 h-2 rounded-full bg-accent" />
				</Animated.View>
			</View>
		</Pressable>
	);
}

export function OnboardingIntroStack({ onFinished }: OnboardingIntroStackProps) {
	const reduceMotion = useReducedMotion();
	const [remaining, setRemaining] = useState(ONBOARDING_INTRO_TICKETS);

	const handleNext = useCallback(() => {
		if (remaining.length <= 1) {
			onFinished();
			return;
		}
		setRemaining((prev) => prev.slice(1));
	}, [onFinished, remaining.length]);

	const isLast = remaining.length === 1;

	return (
		<>
			<View className="flex-1 justify-center px-1">
				<View className="h-[380px]">
					{remaining
						.slice(0, 3)
						.map((ticket, index) => (
							<IntroTicketCard
								key={ticket.id}
								ticket={ticket}
								index={index}
								isTop={index === 0}
								reduceMotion={!!reduceMotion}
							/>
						))
						.reverse()}
				</View>
			</View>
			<Screen.Bottom className="pb-10">
				<Pressable
					onPress={handleNext}
					accessibilityRole="button"
					accessibilityLabel={isLast ? '계속하기' : '다음 티켓'}
					className={cn(
						'w-full items-center justify-center rounded-[18px] py-[18px]',
						'bg-primary-dark',
					)}
					style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
				>
					<Text className="text-white text-base font-pretendard-semibold">
						{isLast ? '계속하기' : '다음 티켓'}
					</Text>
				</Pressable>
			</Screen.Bottom>
		</>
	);
}
