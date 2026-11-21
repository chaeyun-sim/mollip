import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '@/src/components/common/Button';
import { TextField } from '@/src/components/common/TextField';
import { Screen } from '@/src/components/layout/Screen';
import { cn } from '@/src/lib/cn';
import { useAuthStore } from '@/src/store/authStore';
import type { AsyncStatus } from '@/src/types/asyncStatus.types';
import { deleteAccount } from '@/src/utils/api';
import { supabase } from '@/src/utils/supabase';
import { colors } from '@/src/constants/colors';

type Reason =
	'low_usage' | 'too_many_notifications' | 'bad_recommendations' | 'privacy_concern' | 'other';

const REASON_OPTIONS: { value: Reason; labelKey: string; tipKey?: string }[] = [
	{ value: 'low_usage', labelKey: 'delete_account.reason_low_usage' },
	{
		value: 'too_many_notifications',
		labelKey: 'delete_account.reason_too_many_notifications',
		tipKey: 'delete_account.tip_too_many_notifications',
	},
	{
		value: 'bad_recommendations',
		labelKey: 'delete_account.reason_bad_recommendations',
		tipKey: 'delete_account.tip_bad_recommendations',
	},
	{
		value: 'privacy_concern',
		labelKey: 'delete_account.reason_privacy_concern',
		tipKey: 'delete_account.tip_privacy_concern',
	},
	{ value: 'other', labelKey: 'delete_account.reason_other' },
];

export default function DeleteAccountScreen() {
	const { t } = useTranslation();

	const router = useRouter();
	const signOut = useAuthStore((s) => s.signOut);
	const [reason, setReason] = useState<Reason | null>(null);
	const [detail, setDetail] = useState('');
	const [status, setStatus] = useState<AsyncStatus>('idle');

	const selectedOption = REASON_OPTIONS.find((o) => o.value === reason);
	const canSubmit = reason !== null && status !== 'loading';

	const handleSubmit = async () => {
		if (!canSubmit || !reason) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setStatus('loading');

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
						{t('delete_account.done_title')}
					</Text>
					<Text className="text-gray-400 text-[13px] font-pretendard-regular text-center leading-5">
						{t('delete_account.done_body')}
					</Text>
					<Pressable
						onPress={() => router.replace('/(tabs)')}
						className="mt-4 px-6 py-3 rounded-full bg-secondary"
						accessibilityRole="button"
						accessibilityLabel={t('delete_account.go_home')}
					>
						<Text className="text-white text-[14px] font-pretendard-semibold">
							{t('delete_account.go_home')}
						</Text>
					</Pressable>
				</View>
			</Screen>
		);
	}

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back onPress={() => router.back()} />
				<Screen.Header.Center>{t('delete_account.title')}</Screen.Header.Center>
			</Screen.Header>

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				className="flex-1"
			>
				<ScrollView
					className="flex-1"
					// 하단 고정 버튼에 가리지 않도록 여백을 둔다
					contentContainerClassName="pt-4 pb-32"
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
				>
					<Text className="font-pretendard-bold text-[22px] leading-[30px] text-gray900">
						{t('delete_account.intro_title')}
					</Text>
					<Text className="mt-2 font-pretendard-regular text-[14px] leading-[21px] text-gray600">
						{t('delete_account.intro_body')}
					</Text>

					<Text className="ml-1 mt-8 mb-2 font-pretendard-semibold text-gray600 text-[12px] tracking-[1px]">
						{t('delete_account.reason_label')}
					</Text>
					<View
						className="mb-3 overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-gray900 elevation-[2px]"
						style={{
							shadowOpacity: 0.06,
							shadowRadius: 10,
							shadowOffset: { width: 0, height: 2 },
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
									className={cn('min-h-[52px] flex-row items-center justify-between px-4', {
										'border-b border-ink/10': i < REASON_OPTIONS.length - 1,
										'bg-surface-neutral': selected,
									})}
									accessibilityRole="radio"
									accessibilityState={{ checked: selected }}
									accessibilityLabel={t(opt.labelKey)}
								>
									<Text
										className={cn('flex-1 pr-3 text-[15px] text-gray900', {
											'font-pretendard-semibold': selected,
											'font-pretendard-regular': !selected,
										})}
									>
										{t(opt.labelKey)}
									</Text>
									<Ionicons
										name={selected ? 'radio-button-on' : 'radio-button-off'}
										size={20}
										className={cn(selected ? 'text-gray900' : 'text-gray400')}
									/>
								</Pressable>
							);
						})}
					</View>

					{selectedOption?.tipKey && (
						<View className="flex-row gap-2 rounded-2xl bg-surface-neutral px-4 py-3.5 mb-3">
							<Ionicons
								name="bulb-outline"
								size={16}
								className="text-brand"
								style={{ marginTop: 1 }}
							/>
							<Text className="flex-1 text-[13px] leading-[19px] font-pretendard-regular text-ink">
								{t(selectedOption.tipKey)}
							</Text>
						</View>
					)}

					{reason === 'other' && (
						<TextField
							variant="area"
							placeholder={t('delete_account.detail_placeholder')}
							placeholderTextColor={colors.gray700}
							value={detail}
							onChangeText={setDetail}
							maxLength={1000}
						/>
					)}

					{status === 'error' && (
						<Text className="mt-4 px-1 text-[13px] font-pretendard-regular text-error">
							{t('delete_account.failed')}
						</Text>
					)}
				</ScrollView>
				<Screen.BottomAbsolute className="bottom-10 px-1">
					<Button
						onPress={handleSubmit}
						tone="danger"
						disabled={!canSubmit}
						loading={status === 'loading'}
						accessibilityLabel={t('delete_account.submit')}
					>
						{t('delete_account.submit')}
					</Button>
				</Screen.BottomAbsolute>
			</KeyboardAvoidingView>
		</Screen>
	);
}
