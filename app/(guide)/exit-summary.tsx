import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useImmersiveStore } from '@/src/store/immersiveStore';
import { ExitIllustration } from '@/src/components/guide/ExitIllustration';
import { Screen } from '@/src/components/layout/Screen';

// 셀프 가이드를 종료할 때 보여주는 마무리 화면 — create-description의 종료 확인 후 진입.
// 여기서 "다른 전시 보러가기"를 눌러야 메인 서비스로 돌아간다 (create-description.tsx 참고).
// 다른 (guide) 화면들과 달리 흰 배경 — 종료의 산뜻한 느낌을 위해 의도적으로 다른 톤.
export default function ExitSummaryScreen() {
	const router = useRouter();
	const exitImmersive = useImmersiveStore((s) => s.exit);

	return (
		<Screen variant="warm" edges={['top', 'bottom']}>
			<View className="flex-1 items-center justify-center pb-[120px]">
				<ExitIllustration width={300} />
				<Text className="mb-2 mt-8 text-center font-pretendard-bold text-[22px] text-gray900">
					오디오 가이드가 종료되었습니다.
				</Text>
				<Text className="text-center font-pretendard-regular text-sm leading-normal text-gray600">
					오늘 전시 즐거우셨나요?{'\n'}관람 기록은 아카이브에서 다시 볼 수 있어요
				</Text>
			</View>

			<View className="absolute left-0 right-0 bottom-0 px-6 pb-10">
				<Pressable
					className="rounded-2xl items-center py-4 bg-secondary"
					onPress={() => {
						// 방어적으로 한 번 더 리셋 — 진입 경로가 늘어나도 몰입 모드가 남지 않도록
						exitImmersive();
						router.dismissTo('/(tabs)');
					}}
					accessibilityRole="button"
					accessibilityLabel="다른 전시 보러가기"
				>
					<Text className="text-white font-pretendard-semibold text-[16px]">
						다른 전시 보러가기
					</Text>
				</Pressable>
			</View>
		</Screen>
	);
}
