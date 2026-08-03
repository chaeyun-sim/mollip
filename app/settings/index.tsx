import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Screen } from '../../src/components/layout/Screen';
import type { Voice } from '../../src/hooks/useTTS';
import {
	FONT_SIZE_VALUE,
	type FontSize,
	type VoiceSpeed,
	useSettingsStore,
} from '../../src/store/settingsStore';
import { fetchVoices } from '../../src/utils/api';
import { cn } from '@/src/lib/cn';
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

/* ─── 섹션 컴포넌트 ─── */

interface SectionProps {
	title: string;
	children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
	return (
		<View className='mb-6'>
			<Text className='text-[12px] mb-2 px-1 font-pretendard-semibold text-gray-400 tracking-[0.8]'>
				{title.toUpperCase()}
			</Text>
			<View
				className='rounded-3xl overflow-hidden bg-[#F2EFE9]'
				style={{
					shadowColor: '#1C1917',
					shadowOpacity: 0.05,
					shadowRadius: 12,
					shadowOffset: { width: 0, height: 4 },
					elevation: 2,
				}}
			>
				{children}
			</View>
		</View>
	);
}

interface RowProps {
	label: string;
	icon?: keyof typeof Ionicons.glyphMap;
	children?: React.ReactNode;
	border?: boolean;
	onPress?: () => void;
	danger?: boolean;
}

function Row({ label, icon, children, border = true, onPress, danger = false }: RowProps) {
	const content = (pressed: boolean) => (
		<View
			className={cn(
				'flex-row items-center justify-between px-4 gap-3',
				border && 'border-b border-black/5',
			)}
			style={{ minHeight: 52, opacity: pressed ? 0.6 : 1 }}
		>
			<View className='flex-row items-center gap-3 flex-1'>
				{icon ? (
					<Ionicons name={icon} size={14} color={danger ? '#EF4444' : '#57534E'} />
				) : null}
				<Text
					className={cn(
						'font-pretendard-regular text-[15px]',
						danger ? 'text-red-500' : 'text-gray-900',
					)}
				>
					{label}
				</Text>
			</View>
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
				accessibilityRole='button'
				accessibilityLabel={label}
			>
				{({ pressed }) => content(pressed)}
			</Pressable>
		);
	}
	return content(false);
}

interface PillGroupProps<T extends string | number> {
	options: { value: T; label: string }[];
	value: T;
	onChange: (value: T) => void;
	labelFontSize?: (value: T) => number;
}

function PillGroup<T extends string | number>({
	options,
	value,
	onChange,
	labelFontSize,
}: PillGroupProps<T>) {
	return (
		<View
			className='flex-row gap-1 rounded-2xl p-1'
			style={{ backgroundColor: 'rgba(28,25,23,0.06)' }}
		>
			{options.map((opt) => {
				const selected = value === opt.value;
				return (
					<Pressable
						key={opt.value}
						className='px-3 rounded-xl items-center justify-center'
						style={({ pressed }) => ({
							height: 32,
							backgroundColor: selected ? '#1C1917' : 'transparent',
							transform: [{ scale: pressed ? 0.95 : 1 }],
							...(selected
								? {
										shadowColor: '#1C1917',
										shadowOpacity: 0.25,
										shadowRadius: 6,
										shadowOffset: { width: 0, height: 2 },
										elevation: 3,
									}
								: null),
						})}
						accessibilityRole='button'
						accessibilityState={{ selected }}
						accessibilityLabel={opt.label}
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							onChange(opt.value);
						}}
					>
						<Text
							className={cn(
								'font-pretendard-semibold',
								selected ? 'text-white' : 'text-gray-400',
							)}
							style={{ fontSize: labelFontSize ? labelFontSize(opt.value) : 12 }}
						>
							{opt.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}

/* ─── 메인 화면 ─── */

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
				<Section title='계정'>
					<Row
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
					</Row>
				</Section>

				{/* ── 음성 ── */}
				<Section title='음성'>
					<Row label='재생 속도' icon='speedometer-outline'>
						<PillGroup options={SPEED_OPTIONS} value={voiceSpeed} onChange={setVoiceSpeed} />
					</Row>

					<Row
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
					</Row>
				</Section>

				{/* ── 해설 표시 ── */}
				<Section title='해설 표시'>
					<Row label='글자 크기' icon='text-outline' border={false}>
						<PillGroup
							options={FONT_SIZE_OPTIONS}
							value={fontSize}
							onChange={setFontSize}
							labelFontSize={(v) => FONT_SIZE_VALUE[v] - 5}
						/>
					</Row>
				</Section>

				{/* ── 지원 ── */}
				<Section title='지원'>
					<Row
						label='문의하기'
						icon='chatbubble-ellipses-outline'
						border={false}
						onPress={() => router.push('/settings/inquiry')}
					>
						<Ionicons name='chevron-forward' size={16} color='#A8A29E' />
					</Row>
				</Section>

				{/* ── 앱 정보 ── */}
				<Section title='앱 정보'>
					<Row label='버전' icon='information-circle-outline' border={false}>
						<Text className='font-pretendard-regular text-gray-400 text-[13px]'>
							{APP_VERSION}
						</Text>
					</Row>
				</Section>
			</ScrollView>
		</Screen>
	);
}
