import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Switch, View } from 'react-native';
import { useAuthStore } from '@/src/store/authStore';
import { Screen } from '@/src/components/layout/Screen';
import {
	CardRow,
	PillSelector,
	SectionLabel,
	SettingsCard,
} from '@/src/components/mypage';
import type { Voice } from '@/src/hooks/useTTS';
import { useSettingsStore } from '@/src/store/settingsStore';
import { fetchVoices } from '@/src/utils/api';
import { APP_VERSION, SCRAP_TILES, SPEED_OPTIONS } from '@/src/data/mypage';

export default function SettingsScreen() {
	const router = useRouter();
	const session = useAuthStore((s) => s.session);
	const authLoading = useAuthStore((s) => s.isLoading);
	const {
		voiceId,
		voiceSpeed,
		setVoiceSpeed,
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
	if (!session) return <Redirect href='/auth/login' />;

	return (
		<Screen className='flex-1 bg-[#f4f4f1]'>
			<StatusBar style='dark' />
			<Screen.Header>
				<Screen.Header.Logo />
			</Screen.Header>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 60 }}
			>
				<View className='w-full gap-6'>
					{/* 계정 */}
					<View className='mt-4 gap-2'>
						<SectionLabel>계정</SectionLabel>
						<SettingsCard>
							<CardRow
								icon='person-outline'
								label='계정 정보'
								onPress={() => router.push('/settings/account')}
								last
							/>
						</SettingsCard>
					</View>

					{/* 스크랩 */}
					<View className='gap-2'>
						<SectionLabel>스크랩</SectionLabel>
						<SettingsCard>
							{SCRAP_TILES.map((tile, idx) => (
								<CardRow
									key={tile.key}
									icon={tile.icon}
									label={tile.label}
									onPress={() => router.push(tile.route)}
									last={idx === SCRAP_TILES.length - 1}
								/>
							))}
						</SettingsCard>
					</View>

					{/* 해설 생성 설정 */}
					<View className='gap-2'>
						<SectionLabel>해설 생성 설정</SectionLabel>
						<SettingsCard>
							<CardRow icon='speedometer-outline' label='재생 속도'>
								<PillSelector
									options={SPEED_OPTIONS}
									value={voiceSpeed}
									onChange={setVoiceSpeed}
								/>
							</CardRow>
							<CardRow
								icon='mic-outline'
								label='음성 선택'
								value={currentVoiceName ? currentVoiceName.split(' - ')[0] : undefined}
								onPress={() => router.push('/settings/voice')}
								last
							/>
						</SettingsCard>
					</View>

					{/* 알림 */}
					<View className='gap-2'>
						<SectionLabel>알림</SectionLabel>
						<SettingsCard>
							<CardRow
								icon='notifications-outline'
								label='푸시 알림'
								last
								className='py-2.5'
							>
								<Switch
									value={pushNotificationsEnabled}
									onValueChange={setPushNotificationsEnabled}
									trackColor={{ false: '#E7E5E4', true: '#1C1917' }}
									thumbColor='#FFFFFF'
									ios_backgroundColor='#E7E5E4'
									style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
								/>
							</CardRow>
						</SettingsCard>
					</View>

					{/* 지원 */}
					<View className='gap-2'>
						<SectionLabel>지원</SectionLabel>
						<SettingsCard>
							<CardRow
								icon='chatbubble-ellipses-outline'
								label='문의하기'
								onPress={() => router.push('/settings/inquiry')}
								last
							/>
						</SettingsCard>
					</View>

					{/* 앱 정보 */}
					<View className='gap-2'>
						<SectionLabel>앱 정보</SectionLabel>
						<SettingsCard>
							<CardRow
								icon='information-circle-outline'
								label='버전'
								value={APP_VERSION}
								last
							/>
						</SettingsCard>
					</View>
				</View>
			</ScrollView>
		</Screen>
	);
}
