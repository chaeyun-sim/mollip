import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useAuthStore } from '@/src/store/authStore';
import { Screen } from '@/src/components/layout/Screen';
import { CardRow, PillSelector, SettingsCard } from '@/src/components/mypage';
import { APP_VERSION, FONT_SIZE_OPTIONS, SCRAP_TILES, SPEED_OPTIONS } from '@/src/data/mypage';
import { colors } from '@/src/constants/colors';
import { useSettingsStore } from '@/src/store/settingsStore';
import { LoginRequiredPressable } from '@/src/components/auth/LoginRequiredPressable';
import { useEffect, useState } from 'react';
import { fetchVoices } from '@/src/utils/api';
import type { Voice } from '@/src/hooks/useTTS';

export default function MyPageScreen() {
	const router = useRouter();
	const session = useAuthStore((s) => s.session);
	const authLoading = useAuthStore((s) => s.isLoading);
	const {
		voiceId,
		voiceSpeed,
		setVoiceSpeed,
		fontSize,
		setFontSize,
		pushNotificationsEnabled,
		setPushNotificationsEnabled,
	} = useSettingsStore();

	const [currentVoiceName, setCurrentVoiceName] = useState<string>('');

	useEffect(() => {
		fetchVoices()
			.then((voices) => {
				const found = voices.find((v: Voice) => v.voice_id === voiceId);
				if (found) setCurrentVoiceName(found.name);
			})
			.catch(console.error);
	}, [voiceId]);

	if (authLoading) return <ActivityIndicator style={{ flex: 1 }} />;

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back />
				<Screen.Header.Center>마이페이지</Screen.Header.Center>
				<Screen.Header.Right>
					<LoginRequiredPressable
						onPress={() => router.push('/settings/general')}
						hitSlop={8}
						accessibilityRole="button"
						accessibilityLabel="설정"
						style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
					>
						<Ionicons name="settings-outline" size={22} className="text-primary" />
					</LoginRequiredPressable>
				</Screen.Header.Right>
			</Screen.Header>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 60 }}
			>
				<View className="w-full">
					{/* 로그인 유도 */}
					{!session && (
						<View>
							<Pressable
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
									router.push({ pathname: '/auth/login', params: { returnTo: '/settings' } });
								}}
								accessibilityRole="button"
								accessibilityLabel="로그인하기"
								className="mt-4"
								style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
							>
								<Text className="font-pretendard-bold text-primary text-[18px] mb-1.5">
									로그인하고 더 많은 기능을 만나보세요
								</Text>
								<Text className="font-pretendard-regular text-tertiary text-[13px] leading-[19px] mb-4">
									{`몰입모드, 나만의 해설 생성, 취향 기반 추천까지\n로그인하면 모두 이용할 수 있어요`}
								</Text>
								<View className="self-start rounded-full bg-primary px-5 py-2.5">
									<Text className="font-pretendard-semibold text-white text-[13px]">
										로그인하기
									</Text>
								</View>
							</Pressable>
							<View className="h-2.5 bg-bg-tonal mt-8" style={{ marginHorizontal: -24 }} />
						</View>
					)}

					<View className={session ? 'mt-4' : 'mt-6'}>
						<SettingsCard>
							{(session ? SCRAP_TILES : SCRAP_TILES.slice(0, 1)).map((tile) => (
								<CardRow
									key={tile.key}
									label={tile.label}
									onPress={() => router.push(tile.route)}
								/>
							))}
						</SettingsCard>
					</View>

					<View className="h-[1px] w-full bg-muted/30 my-3" />

					{session && (
						<View>
							<SettingsCard>
								<CardRow label="재생 속도" className="py-3.5">
									<PillSelector
										options={SPEED_OPTIONS}
										value={voiceSpeed}
										onChange={setVoiceSpeed}
									/>
								</CardRow>
								<CardRow
									label="음성 선택"
									value={currentVoiceName ? currentVoiceName.split(' - ')[0] : undefined}
									onPress={() => router.push('/settings/voice')}
								/>
								<CardRow
									label="해설 강화 항목"
									onPress={() => router.push('/settings/description')}
								/>
								<CardRow label="텍스트 크기" className="py-3.5">
									<PillSelector
										options={FONT_SIZE_OPTIONS}
										value={fontSize}
										onChange={setFontSize}
									/>
								</CardRow>
							</SettingsCard>
						</View>
					)}

					<View className="h-[1px] w-full bg-muted/30 my-3" />

					<View className="relative">
						<SettingsCard>
							<CardRow label="푸시 알림" className="py-3">
								<Switch
									value={pushNotificationsEnabled}
									onValueChange={setPushNotificationsEnabled}
									trackColor={{ false: colors.border, true: colors.primary }}
									thumbColor="#FFFFFF"
									ios_backgroundColor={colors.border}
									style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
									className="absolute -right-1 top-2"
								/>
							</CardRow>
						</SettingsCard>
					</View>

					<View className="h-[1px] w-full bg-muted/30 my-3" />

					<View>
						<SettingsCard>
							<CardRow label="의견 보내기" onPress={() => router.push('/settings/inquiry')} />
							<CardRow label="버전" value={APP_VERSION} />
						</SettingsCard>
					</View>
				</View>
			</ScrollView>
		</Screen>
	);
}
