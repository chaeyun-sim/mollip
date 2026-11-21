import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Button } from '@/src/components/common/Button';
import { Chip } from '@/src/components/common/Chip';
import { Result } from '@/src/components/common/Result';
import { TextField } from '@/src/components/common/TextField';
import { Screen } from '@/src/components/layout/Screen';
import { useAuthStore } from '@/src/store/authStore';
import type { AsyncStatus } from '@/src/types/asyncStatus.types';
import { supabase } from '@/src/utils/supabase';

type Category = 'suggestion' | 'bug' | 'account' | 'subscription' | 'other';

const CATEGORY_OPTIONS: { value: Category; labelKey: string; emoji: string }[] = [
	{ value: 'suggestion', labelKey: 'inquiry.category_suggestion', emoji: '💡' },
	{ value: 'bug', labelKey: 'inquiry.category_bug', emoji: '🐛' },
	{ value: 'account', labelKey: 'inquiry.category_account', emoji: '👤' },
	{ value: 'subscription', labelKey: 'inquiry.category_subscription', emoji: '💰' },
	{ value: 'other', labelKey: 'inquiry.category_other', emoji: '✉️' },
];

export default function InquiryScreen() {
	const { t } = useTranslation();

	const router = useRouter();
	const { category: initialCategory } = useLocalSearchParams();

	const userEmail = useAuthStore((s) => s.user?.email);
	const [category, setCategory] = useState<Category>((initialCategory as Category) || 'bug');
	const [content, setContent] = useState('');
	const [contact, setContact] = useState<string | null>(null);
	const [status, setStatus] = useState<AsyncStatus>('idle');
	const contactValue = contact ?? userEmail ?? '';
	const isAnonymous = !userEmail;

	const canSubmit =
		content.trim().length > 0 &&
		status !== 'loading' &&
		(!isAnonymous || contactValue.trim().length > 0);

	const handleSubmit = async () => {
		if (!canSubmit) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setStatus('loading');
		const { error } = await supabase.from('inquiries').insert({
			category,
			content: content.trim(),
			contact: contactValue.trim() || null,
		});

		if (error) {
			setStatus('error');
			return;
		}

		setStatus('success');
	};

	if (status === 'success') {
		return (
			<Screen variant="warm">
				<Screen.Header>
					<Screen.Header.Back onPress={() => router.back()} />
					<Screen.Header.Center>{t('settings.inquiry')}</Screen.Header.Center>
				</Screen.Header>

				<Result
					icon="checkmark"
					tone="success"
					iconBackground
					title={t('inquiry.success_title')}
					description={t('inquiry.success_body')}
					actionLabel={t('common.confirm')}
					onAction={() => router.back()}
				/>
			</Screen>
		);
	}

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back onPress={() => router.back()} />
				<Screen.Header.Center>{t('settings.inquiry')}</Screen.Header.Center>
			</Screen.Header>

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				className="flex-1"
			>
				<ScrollView
					className="flex-1"
					contentContainerClassName="pb-10"
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
				>
					<Text className="my-2 text-gray600 text-[13px] font-pretendard-regular leading-[20px]">
						{t('inquiry.intro')}
					</Text>
					{/* 카테고리 */}
					<Text className="mt-5 file:text-[12px] mb-3 font-pretendard-medium text-gray500 tracking-[0.6px] uppercase">
						{t('inquiry.category_label')}
					</Text>
					<View className="flex-row flex-wrap gap-2 mb-8">
						{CATEGORY_OPTIONS.map((opt) => {
							const selected = category === opt.value;
							return (
								<Chip
									key={opt.value}
									label={t(opt.labelKey)}
									active={selected}
									onPress={() => setCategory(opt.value)}
								/>
							);
						})}
					</View>

					{/* 내용 */}
					<Text className="text-[12px] mb-3 font-pretendard-medium text-gray500 tracking-[0.6px] uppercase">
						{t('inquiry.content_label')}
					</Text>
					<TextField
						variant="area"
						placeholder={t('inquiry.content_placeholder')}
						value={content}
						onChangeText={setContent}
						maxLength={2000}
						style={{ minHeight: 160 }}
					/>
					<Text className="text-right text-[12px] font-pretendard-regular text-[#C7C3BD] mt-1.5 pr-1">
						{content.length}/2000
					</Text>

					{/* 연락처 */}
					<Text className="text-[12px] mt-6 mb-3 font-pretendard-medium text-gray500 tracking-[0.6px] uppercase">
						{t('inquiry.email_label')}
					</Text>
					<TextField
						placeholder={t('inquiry.email_placeholder')}
						value={contactValue}
						onChangeText={setContact}
						keyboardType="email-address"
						autoCapitalize="none"
						returnKeyType="done"
					/>

					{status === 'error' && (
						<Text className="mt-4 text-[13px] font-pretendard-regular text-error">
							{t('inquiry.send_failed')}
						</Text>
					)}
				</ScrollView>
				<Screen.BottomAbsolute className="bottom-10 px-1">
					<Button
						onPress={handleSubmit}
						disabled={!canSubmit}
						loading={status === 'loading'}
						accessibilityLabel={t('inquiry.submit_a11y')}
					>
						{t('inquiry.submit')}
					</Button>
				</Screen.BottomAbsolute>
			</KeyboardAvoidingView>
		</Screen>
	);
}
