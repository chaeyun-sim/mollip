import { Image, Text, View } from 'react-native';

import { Button } from '@/src/components/common/Button';
import { Screen } from '@/src/components/layout/Screen';
import { OnboardingSkipAction } from '@/src/components/onboarding/OnboardingSkipAction';

interface OnboardingWallPrologueProps {
	onStart: () => void;
	onSkip: () => void;
}

/** 빈 벽 앞에서 시작하는 온보딩 프롤로그 — 소개 티켓·오디오 없이 진입/스킵만 제공한다. */
export function OnboardingWallPrologue({ onStart, onSkip }: OnboardingWallPrologueProps) {
	return (
		<Screen variant="warm" edges={[]}>
			<Screen.Header>
				<Screen.Header.Back className="-ml-5" />
				<Screen.Header.Right className="mr-2">
					<OnboardingSkipAction onPress={onSkip} />
				</Screen.Header.Right>
			</Screen.Header>
			<View className="absolute top-0 left-0 right-0 bottom-0 mb-20 items-center justify-center gap-8">
				<View className="w-[220px] h-[160px] relative rounded-2xl border-[1.5px] border-dashed border-gray300">
					<Image
						source={require('@/assets/images/onboarding/wall-bg.png')}
						className="w-full h-full"
					/>
					<Image source={require('@/assets/images/skulpture/heart.png')} className="absolute bottom-1 right-1/2 translate-x-1/2 w-[60px] h-[70px]" />
				</View>

				<View className="items-center gap-2 px-4">
					<Text className="text-gray900 text-[22px] leading-[30px] font-hahmlet-semibold text-center">
						마음이 머무는 작품으로{'\n'}첫 전시를 꾸며볼까요?
					</Text>
					<Text className="mt-2 text-gray700 text-[13px] font-pretendard-regular text-center">
						세 장만 고르면, 취향에 맞는 전시를 먼저 보여드려요.
					</Text>
				</View>
			</View>

			<Screen.BottomAbsolute className="items-center bottom-10">
				<Button onPress={onStart} accessibilityLabel="내 전시 벽 만들기">
					내 전시 벽 만들기
				</Button>
			</Screen.BottomAbsolute>
		</Screen>
	);
}
