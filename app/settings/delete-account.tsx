import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from 'react-native';
import { cn } from '@/src/lib/cn';
import { Screen } from '@/src/components/layout/Screen';
import { useAuthStore } from '@/src/store/authStore';
import { deleteAccount } from '@/src/utils/api';
import { supabase } from '@/src/utils/supabase';
import { colors } from '@/src/constants/colors';

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';
type Reason =
	'low_usage' | 'too_many_notifications' | 'bad_recommendations' | 'privacy_concern' | 'other';

const REASON_OPTIONS: { value: Reason; label: string; tip?: string }[] = [
	{ value: 'low_usage', label: '생각보다 잘 쓰게 되지 않아요' },
	{
		value: 'too_many_notifications',
		label: '알림이 너무 많아요',
		tip: '설정 > 알림에서 원하는 알림만 골라 끌 수 있어요',
	},
	{
		value: 'bad_recommendations',
		label: '취향에 맞는 추천을 못 받았어요',
		tip: '온보딩에서 취향을 다시 골라보면 추천이 더 정확해질 수 있어요',
	},
	{
		value: 'privacy_concern',
		label: '개인정보가 걱정돼요',
		tip: '정보는 개인 기록과 추천에만 사용 중이고, 탈퇴하면 전부 즉시 삭제돼요',
	},
	{ value: 'other', label: '기타' },
];

export default function DeleteAccountScreen() {
	const router = useRouter();
	const signOut = useAuthStore((s) => s.signOut);
	const [reason, setReason] = useState<Reason | null>(null);
	const [detail, setDetail] = useState('');
	const [status, setStatus] = useState<SubmitStatus>('idle');

	const selectedOption = REASON_OPTIONS.find((o) => o.value === reason);
	const canSubmit = reason !== null && status !== 'submitting';

	const handleSubmit = async () => {
		if (!canSubmit || !reason) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setStatus('submitting');

		await supabase.from('account_deletion_feedback').insert({
			reason,
			detail: reason === 'other' ? detail.trim() || null : null,
		});

		try {
			await deleteAccount();
			await signOut();
			setStatus('success');
		} catch {
			setStatus('error');
		}
	};

	if (status === 'success') {
		return (
			<Screen variant="warm">
				<View className="flex-1 items-center justify-center gap-4 px-6">
					<View className="w-16 h-16 rounded-full bg-bg-tonal items-center justify-center">
						<Ionicons name="heart-outline" size={30} color="#B8935A" />
					</View>
					<Text className="text-gray-900 text-[18px] font-hahmlet-semibold text-center">
						그동안 함께해주셔서 감사했어요
					</Text>
					<Text className="text-gray-400 text-[13px] font-pretendard-regular text-center leading-5">
						계정이 정상적으로 삭제됐어요{'\n'}언제든 다시 찾아주세요
					</Text>
					<Pressable
						onPress={() => router.replace('/(tabs)')}
						className="mt-4 px-6 py-3 rounded-full bg-primary"
						accessibilityRole="button"
						accessibilityLabel="메인으로 가기"
					>
						<Text className="text-white text-[14px] font-pretendard-semibold">메인으로 가기</Text>
					</Pressable>
				</View>
			</Screen>
		);
	}

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Left>
					<Screen.Header.Back onPress={() => router.back()} />
				</Screen.Header.Left>
				<Screen.Header.Center>
					<Text className="text-[18px] text-gray-900 font-hahmlet-semibold">탈퇴하기</Text>
				</Screen.Header.Center>
				<Screen.Header.Right>
					<Pressable
						onPress={handleSubmit}
						disabled={!canSubmit}
						hitSlop={8}
						accessibilityRole="button"
						accessibilityLabel="탈퇴하기"
						accessibilityState={{ disabled: !canSubmit }}
						className={cn('rounded-full px-3.5 py-1.5', canSubmit ? 'bg-red-500' : 'bg-black/10')}
						style={({ pressed }) => ({ opacity: pressed && canSubmit ? 0.8 : 1 })}
					>
						{status === 'submitting' ? (
							<ActivityIndicator size="small" color="#fff" />
						) : (
							<Text
								className={cn(
									'text-[14px] font-pretendard-semibold',
									canSubmit ? 'text-white' : 'text-gray-400',
								)}
							>
								탈퇴하기
							</Text>
						)}
					</Pressable>
				</Screen.Header.Right>
			</Screen.Header>

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				className="flex-1"
			>
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
				>
					<Text className="text-[12px] mb-2 px-1 font-pretendard-semibold text-gray-400 tracking-[0.8]">
						탈퇴하시는 이유를 알려주세요
					</Text>
					<View
						className="rounded-3xl overflow-hidden bg-bg-tonal mb-3"
						style={{
							shadowColor: colors.primary,
							shadowOpacity: 0.05,
							shadowRadius: 12,
							shadowOffset: { width: 0, height: 4 },
							elevation: 2,
						}}
					>
						{REASON_OPTIONS.map((opt, i) => {
							const selected = reason === opt.value;
							return (
								<Pressable
									key={opt.value}
									onPress={() => {
										Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
										setReason(opt.value);
									}}
									className={cn(
										'flex-row items-center justify-between px-4 min-h-[52px]',
										i < REASON_OPTIONS.length - 1 && 'border-b border-black/5',
									)}
									accessibilityRole="radio"
									accessibilityState={{ checked: selected }}
									accessibilityLabel={opt.label}
								>
									<Text className="font-pretendard-regular text-gray-900 text-[15px]">
										{opt.label}
									</Text>
									<Ionicons
										name={selected ? 'radio-button-on' : 'radio-button-off'}
										size={20}
										className={cn(selected ? 'text-primary' : 'text-muted')}
									/>
								</Pressable>
							);
						})}
					</View>

					{selectedOption?.tip ? (
						<View className="flex-row gap-2 rounded-2xl bg-blue-50 px-4 py-3.5 mb-3">
							<Ionicons
								name="bulb-outline"
								size={16}
								className="text-accent"
								style={{ marginTop: 1 }}
							/>
							<Text className="flex-1 text-[13px] leading-[19px] font-pretendard-regular text-blue-700">
								{selectedOption.tip}
							</Text>
						</View>
					) : null}

					{reason === 'other' ? (
						<TextInput
							className="rounded-3xl bg-bg-tonal px-4 py-4 text-gray-900 text-[15px]"
							style={{
								fontFamily: 'Pretendard-Regular',
								minHeight: 120,
								textAlignVertical: 'top',
							}}
							placeholder="어떤 점이 아쉬웠는지 알려주세요 (선택)"
							placeholderTextColor={colors.secondary}
							value={detail}
							onChangeText={setDetail}
							multiline
							maxLength={1000}
						/>
					) : null}

					{status === 'error' ? (
						<Text className="mt-4 px-1 text-[13px] font-pretendard-regular text-red-500">
							탈퇴 처리에 실패했어요. 잠시 후 다시 시도해주세요
						</Text>
					) : null}
				</ScrollView>
			</KeyboardAvoidingView>
		</Screen>
	);
}
