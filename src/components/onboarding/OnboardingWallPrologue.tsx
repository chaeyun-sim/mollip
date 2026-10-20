import { Image, Text, View } from 'react-native';
import { Button } from '@/src/components/common/Button';
import { Screen } from '@/src/components/layout/Screen';
import { OnboardingSkipAction } from '@/src/components/onboarding/OnboardingSkipAction';

interface OnboardingWallPrologueProps {
	onStartWall: () => void;
	onStartChips: () => void;
	onSkip: () => void;
}

/** 빈 벽 앞에서 시작하는 온보딩 프롤로그 — 소개 티켓·오디오 없이 진입/스킵만 제공한다. */
export function OnboardingWallPrologue({
	onStartWall,
	onStartChips,
	onSkip,
}: OnboardingWallPrologueProps) {
	return (
		<>
			<Screen.Header>
				<Screen.Header.Back />
				<Screen.Header.Right className="-mr-2">
					<OnboardingSkipAction onPress={onSkip} />
				</Screen.Header.Right>
			</Screen.Header>
			<View className="gap-2">
				<Text className="text-3xl text-gray900 mb-2 font-pretendard-bold">
					마음이 머무는 방식으로{'\n'}취향을 골라볼까요?
				</Text>
				<Text className="text-md leading-6 text-gray700">
					좋아하는 장르를 알려주시면 취향에 맞는 전시를 추천해드려요.
				</Text>
			</View>
			<View className="mb-8 w-full flex-1 items-center justify-center">
				<View className="w-[270px] h-[200px] relative rounded-2xl border-[1.5px] border-dashed border-gray300 overflow-hidden">
					<Image
						source={require('@/assets/images/onboarding/wall-bg.png')}
						className="w-full h-full"
					/>
					<Image
						source={require('@/assets/images/skulpture/heart.png')}
						className="absolute bottom-1.5 right-1/2 translate-x-1/2 w-[70px] h-[80px]"
					/>
				</View>
			</View>
			<Screen.Bottom className="bottom-10 gap-2">
				<Button onPress={onStartWall} accessibilityLabel="작품을 골라 전시 벽 만들기">
					작품을 골라 전시 벽 만들기
				</Button>
				<Button
					variant="ghost"
					tone="gray"
					block
					onPress={onStartChips}
					accessibilityLabel="장르 칩으로 빠르게 고르기"
				>
					장르 칩으로 빠르게 고르기
				</Button>
			</Screen.Bottom>
		</>
	);
}
