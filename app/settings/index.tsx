import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SettingsPillGroup } from '@/src/components/settings/SettingsPillGroup';
import { SettingsRow } from '@/src/components/settings/SettingsRow';
import { SettingsSection } from '@/src/components/settings/SettingsSection';
import { Screen } from '../../src/components/layout/Screen';
import type { Voice } from '../../src/hooks/useTTS';
import {
	FONT_SIZE_VALUE,
	type FontSize,
	type VoiceSpeed,
	useSettingsStore,
} from '../../src/store/settingsStore';
import { fetchVoices } from '../../src/utils/api';
import { authDisplayLabel } from '@/src/hooks/useRequireAuth';
import { useAuthStore } from '@/src/store/authStore';

const APP_VERSION = '1.0.0';

const FONT_SIZE_OPTIONS: { label: string; value: FontSize }[] = [
	{ label: '작게', value: 'small' },
	{ label: '보통', value: 'medium' },
	{ label: '크게', value: 'large' },
];

const SPEED_OPTIONS: { value: VoiceSpeed; label: string }[] = [
	{ value: 0.7, label: '0.7x' },
	{ value: 1.0, label: '1.0x' },
	{ value: 1.25, label: '1.25x' },
	{ value: 1.5, label: '1.5x' },
];

export default function SettingsScreen() {
	const router = useRouter();
	const user = useAuthStore((s) => s.user);
	const { voiceId, voiceSpeed, fontSize, setVoiceSpeed, setFontSize } =
		useSettingsStore();

	const [currentVoiceName, setCurrentVoiceName] = useState<string>('');

	useEffect(() => {
		fetchVoices()
			.then((voices) => {
				const found = voices.find((v: Voice) => v.voice_id === voiceId);
				if (found) setCurrentVoiceName(found.name);
			})
			.catch(console.error);
	}, [voiceId]);

	return (
		<Screen variant='warm'>
			<Screen.Header>
				<Screen.Header.Left>
					<Screen.Header.Back color='#1C1917' onPress={() => router.back()} />
				</Screen.Header.Left>
				<Screen.Header.Center>
					<Text className='text-[18px] text-gray-900 font-hahmlet-semibold'>설정</Text>
				</Screen.Header.Center>
				<Screen.Header.Right />
			</Screen.Header>

			<ScrollView
				className='flex-1'
				contentContainerStyle={{ paddingTop: 12, paddingBottom: 48 }}
				showsVerticalScrollIndicator={false}
			>
				{/* ── 계정 ── */}
				<SettingsSection title='계정'>
					<SettingsRow
						label='계정 정보'
						icon='person-outline'
						border={false}
						onPress={() =>
							user
								? router.push('/settings/account')
								: router.push({
										pathname: '/auth/login',
										params: { returnTo: '/settings' },
									})
						}
					>
						<View className='flex-row items-center gap-1 max-w-[50%]'>
							{user ? (
								<Text
									className='font-pretendard-regular text-gray-400 text-[13px]'
									numberOfLines={1}
								>
									{authDisplayLabel(user)}
								</Text>
							) : (
								<Text className='font-pretendard-regular text-[#A8A29E] text-[13px]'>
									로그인하기
								</Text>
							)}
							<Ionicons name='chevron-forward' size={16} color='#A8A29E' />
						</View>
					</SettingsRow>
				</SettingsSection>

				{/* ── 음성 ── */}
				<SettingsSection title='음성'>
					<SettingsRow label='재생 속도' icon='speedometer-outline'>
						<SettingsPillGroup options={SPEED_OPTIONS} value={voiceSpeed} onChange={setVoiceSpeed} />
					</SettingsRow>

					<SettingsRow
						label='음성 선택'
						icon='mic-outline'
						border={false}
						onPress={() => router.push('/settings/voice')}
					>
						<View className='flex-row items-center gap-1'>
							{currentVoiceName ? (
								<Text className='font-pretendard-regular text-gray-400 text-[13px]'>
									{currentVoiceName.split(' - ')[0]}
								</Text>
							) : null}
							<Ionicons name='chevron-forward' size={16} color='#A8A29E' />
						</View>
					</SettingsRow>
				</SettingsSection>

				{/* ── 해설 표시 ── */}
				<SettingsSection title='해설 표시'>
					<SettingsRow label='글자 크기' icon='text-outline' border={false}>
						<SettingsPillGroup
							options={FONT_SIZE_OPTIONS}
							value={fontSize}
							onChange={setFontSize}
							labelFontSize={(v) => FONT_SIZE_VALUE[v] - 5}
						/>
					</SettingsRow>
				</SettingsSection>

				{/* ── 지원 ── */}
				<SettingsSection title='지원'>
					<SettingsRow
						label='문의하기'
						icon='chatbubble-ellipses-outline'
						border={false}
						onPress={() => router.push('/settings/inquiry')}
					>
						<Ionicons name='chevron-forward' size={16} color='#A8A29E' />
					</SettingsRow>
				</SettingsSection>

				{/* ── 앱 정보 ── */}
				<SettingsSection title='앱 정보'>
					<SettingsRow label='버전' icon='information-circle-outline' border={false}>
						<Text className='font-pretendard-regular text-gray-400 text-[13px]'>
							{APP_VERSION}
						</Text>
					</SettingsRow>
				</SettingsSection>
			</ScrollView>
		</Screen>
	);
}
