import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/src/components/layout/Screen';
import { CardRow, PillSelector, SectionLabel, SettingsCard } from '@/src/components/mypage';
import type { Voice } from '@/src/hooks/useTTS';
import { useSettingsStore } from '@/src/store/settingsStore';
import { fetchVoices } from '@/src/utils/api';
import { FONT_SIZE_OPTIONS, SPEED_OPTIONS } from '@/src/data/mypage';

export default function NarrationSettingsScreen() {
	const router = useRouter();
	const { voiceId, voiceSpeed, setVoiceSpeed, fontSize, setFontSize } = useSettingsStore();
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
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back />
				<Screen.Header.Center>해설 생성 설정</Screen.Header.Center>
			</Screen.Header>

			<View className="w-full mt-4">
				<SectionLabel>해설 생성 설정</SectionLabel>
				<View className="mt-2">
					<SettingsCard>
						<CardRow label="재생 속도" className="py-3.5">
							<PillSelector options={SPEED_OPTIONS} value={voiceSpeed} onChange={setVoiceSpeed} />
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
							<PillSelector options={FONT_SIZE_OPTIONS} value={fontSize} onChange={setFontSize} />
						</CardRow>
					</SettingsCard>
				</View>
			</View>
		</Screen>
	);
}
