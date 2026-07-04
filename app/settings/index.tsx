import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/layout/Screen';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import type { Voice } from '../../src/hooks/useTTS';
import {
	FONT_SIZE_VALUE,
	type FontSize,
	type VoiceSpeed,
	useSettingsStore,
} from '../../src/store/settingsStore';
import { fetchVoices } from '../../src/utils/api';
import { cn } from '@/src/lib/cn';

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

/* ─── 섹션 컴포넌트 ─── */

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<View className='mb-8'>
			<Text className='text-xs mb-3 px-1 font-pretendard-semibold text-[#78716C] tracking-[0.8]'>
				{title.toUpperCase()}
			</Text>
			<View
				className='rounded-2xl overflow-hidden bg-[#1C1917] border-white/8'
				style={{
					borderWidth: StyleSheet.hairlineWidth,
				}}
			>
				{children}
			</View>
		</View>
	);
}

function Row({
	label,
	children,
	border = true,
	onPress,
}: {
	label: string;
	children?: React.ReactNode;
	border?: boolean;
	onPress?: () => void;
}) {
	const content = (pressed: boolean) => (
		<View
			className='flex-row items-center justify-between px-4'
			style={[
				{ minHeight: 52, opacity: pressed ? 0.7 : 1 },
				border ? { borderBottomWidth: 1, borderBottomColor: '#292524' } : undefined,
			]}
		>
			<Text className='font-pretendard-regular text-[#E8E8E8] text-[15px]'>
				{label}
			</Text>
			{children}
		</View>
	);

	if (onPress) {
		return (
			<Pressable
				onPress={() => {
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
					onPress();
				}}
			>
				{({ pressed }) => content(pressed)}
			</Pressable>
		);
	}
	return content(false);
}

/* ─── 메인 화면 ─── */

export default function SettingsScreen() {
	const router = useRouter();
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
		<Screen>
			<ScreenHeader>
				<ScreenHeader.Left>
					<ScreenHeader.Back onPress={() => router.back()} />
				</ScreenHeader.Left>
				<ScreenHeader.Center>
					<Text className='text-[16px] text-white font-pretendard-semibold'>
						설정
					</Text>
				</ScreenHeader.Center>
				<ScreenHeader.Right />
			</ScreenHeader>

			<ScrollView
				className='flex-1'
				contentContainerStyle={{ paddingTop: 20, paddingBottom: 48 }}
				showsVerticalScrollIndicator={false}
			>
				{/* ── 계정 ── */}
				<Section title='계정'>
					<Row
						label='계정 정보'
						border={false}
						onPress={() => router.push('/settings/account')}
					>
						<Ionicons name='chevron-forward' size={16} color='#78716C' />
					</Row>
				</Section>

				{/* ── 음성 ── */}
				<Section title='음성'>
					<Row label='재생 속도'>
						<View className='flex-row gap-2'>
							{SPEED_OPTIONS.map(({ value: speed, label }) => (
								<Pressable
									key={speed}
									className='px-3 rounded-lg items-center justify-center'
									style={({ pressed }) => ({
										height: 32,
										backgroundColor: voiceSpeed === speed ? '#3B82F6' : '#292524',
										transform: [{ scale: pressed ? 0.95 : 1 }],
									})}
									onPress={() => {
										Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
										setVoiceSpeed(speed);
									}}
								>
									<Text
										className={cn(
											'font-pretendard-semibold text-[12px]',
											voiceSpeed === speed ? 'text-white' : 'text-[#A8A29E]',
										)}
									>
										{label}
									</Text>
								</Pressable>
							))}
						</View>
					</Row>

					<Row
						label='음성 선택'
						border={false}
						onPress={() => router.push('/settings/voice')}
					>
						<View className='flex-row items-center gap-1'>
							{currentVoiceName ? (
								<Text className='font-pretendard-regular text-[#666] text-[13px]'>
									{currentVoiceName.split(' - ')[0]}
								</Text>
							) : null}
							<Ionicons name='chevron-forward' size={16} color='#78716C' />
						</View>
					</Row>
				</Section>

				{/* ── 해설 표시 ── */}
				<Section title='해설 표시'>
					<Row label='글자 크기' border={false}>
						<View className='flex-row gap-2'>
							{FONT_SIZE_OPTIONS.map((opt) => (
								<Pressable
									key={opt.value}
									className='px-3 rounded-lg items-center justify-center'
									style={({ pressed }) => ({
										height: 32,
										backgroundColor: fontSize === opt.value ? '#3B82F6' : '#292524',
										transform: [{ scale: pressed ? 0.95 : 1 }],
									})}
									onPress={() => {
										Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
										setFontSize(opt.value);
									}}
								>
									<Text
										className={cn(
											'font-pretendard-semibold',
											fontSize === opt.value ? 'text-white' : 'text-[#A8A29E',
										)}
										style={{
											fontSize: FONT_SIZE_VALUE[opt.value] - 5,
										}}
									>
										{opt.label}
									</Text>
								</Pressable>
							))}
						</View>
					</Row>
				</Section>

				{/* ── 앱 정보 ── */}
				<Section title='앱 정보'>
					<Row label='버전' border={false}>
						<Text className='font-pretendard-regular text-[#78716C] text-[13px]'>
							{APP_VERSION}
						</Text>
					</Row>
				</Section>
			</ScrollView>
		</Screen>
	);
}
