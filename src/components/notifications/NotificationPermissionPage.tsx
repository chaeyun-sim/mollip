import { Image, Linking, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { Button } from '@/src/components/common/Button';
import { PottedPlantIllustration } from '@/src/components/illustration/PottedPlantIllustration';
import { Screen } from '@/src/components/layout/Screen';

interface NotificationPermissionPageProps {
	/** 권한 요청 또는 설정 이동 시도가 끝난 뒤 부모가 권한 상태를 다시 읽도록 알린다 */
	onPermissionRequested: () => void;
}

export function NotificationPermissionPage({
	onPermissionRequested,
}: NotificationPermissionPageProps) {
	const reduceMotion = useReducedMotion();

	const handleEnablePress = async () => {
		try {
			const permission = await Notifications.getPermissionsAsync();
			// 아직 물어볼 수 있으면 앱에서 바로 요청한다. iOS는 한 번도 요청하지 않은 앱의 알림 항목을 설정에 보여주지 않는다.
			if (permission.status !== 'granted' && permission.canAskAgain) {
				await Notifications.requestPermissionsAsync();
				return;
			}
			await Linking.openSettings();
		} catch (error) {
			console.warn('[notifications] 알림 권한 요청 실패:', error);
		} finally {
			onPermissionRequested();
		}
	};

	return (
		<Screen variant="warm" className="px-0">
			<Screen.Header fullBleed>
				<Screen.Header.Back />
				<Screen.Header.Center className="mb-1">알림</Screen.Header.Center>
			</Screen.Header>

			<View className="flex-1 px-7 pb-8 pt-5">
				<View className="h-[205px] w-full">
					<Animated.View
						entering={reduceMotion ? undefined : FadeInDown.delay(160).duration(520)}
						className="absolute top-0 w-full h-[68px] justify-center items-center rounded-3xl bg-white px-4 shadow-floating"
					>
						<View className="flex-row items-center gap-3">
							<View className="h-11 w-11 overflow-hidden rounded-lg bg-[#F8F6F2]">
								<Image
									source={require('../../../assets/images/logo/icon.png')}
									className="h-full w-full"
									resizeMode="contain"
									accessibilityIgnoresInvertColors
								/>
							</View>
							<View className="flex-1">
								<View className="mb-1 flex-row items-center">
									<Text className="font-pretendard-semibold text-[14px] text-gray900">
										찜한 전시가 곧 마감돼요
									</Text>
									<Text className="ml-auto font-pretendard-regular text-[12px] text-gray500">
										지금
									</Text>
								</View>
								<Text className="mt-0.5 font-pretendard-regular text-[13px] text-gray600">
									놓치기 전에 확인해 보세요.
								</Text>
							</View>
						</View>
					</Animated.View>
					<Animated.View
						entering={reduceMotion ? undefined : FadeInDown.delay(680).duration(520)}
						className="absolute top-[68px] mt-4 w-full self-center flex-row items-center gap-3 rounded-3xl bg-white p-4 shadow-chip"
					>
						<View className="h-11 w-11 overflow-hidden rounded-lg bg-[#F8F6F2]">
							<Image
								source={require('../../../assets/images/logo/icon.png')}
								className="h-full w-full"
								resizeMode="contain"
								accessibilityIgnoresInvertColors
							/>
						</View>
						<View className="flex-1">
							<View className="mb-1 flex-row items-center">
								<Text className="font-pretendard-semibold text-[14px] text-gray900">
									이번 주 추천 전시
								</Text>
								<Text className="ml-auto font-pretendard-regular text-[12px] text-gray500">
									1분 전
								</Text>
							</View>
							<Text className="mt-0.5 font-pretendard-regular text-[13px] text-gray600">
								몰립 외 2개의 추천 전시를 만나보세요.
							</Text>
						</View>
					</Animated.View>
				</View>

				<View className="mt-auto gap-10 pb-10">
					<View>
						<View className="mb-2">
							<PottedPlantIllustration width={64} />
						</View>
						<Text className="mb-3 mt-5 font-pretendard-bold text-[27px] leading-[36px] text-gray900">
							전시 소식을 놓치지 마세요
						</Text>
						<Text
							className="font-pretendard-regular text-[16px] leading-[24px] text-gray600"
							lineBreakStrategyIOS="hangul-word"
						>
							알림을 켜면 찜한 전시의 마감 알림과 새로운 전시의 소식을 받을 수 있어요.
						</Text>
					</View>
					<View className="flex flex-row items-center">
						<Button
							tone="brand"
							onPress={() => void handleEnablePress()}
							accessibilityRole="button"
							accessibilityLabel="알림 켜기"
							className="flex-1 rounded-xl"
						>
							<Text className="font-pretendard-semibold text-[16px] text-white">알림 켜기</Text>
						</Button>
					</View>
				</View>
			</View>
		</Screen>
	);
}
