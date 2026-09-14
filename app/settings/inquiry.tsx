import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
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

type Category = 'suggestion' | 'bug' | 'account' | 'other';

const CATEGORY_OPTIONS: { value: Category; label: string; emoji: string }[] = [
	{ value: 'suggestion', label: '기능 제안', emoji: '💡' },
	{ value: 'bug', label: '버그 제보', emoji: '🐛' },
	{ value: 'account', label: '계정', emoji: '👤' },
	{ value: 'other', label: '기타', emoji: '✉️' },
];

export default function InquiryScreen() {
	const router = useRouter();
	const userEmail = useAuthStore((s) => s.user?.email);
	const [category, setCategory] = useState<Category>('bug');
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
					<Screen.Header.Center>문의하기</Screen.Header.Center>
				</Screen.Header>

				<Result
					icon="checkmark"
					tone="success"
					iconBackground
					title="문의가 접수됐어요"
					description={'확인 후 남겨주신 연락처로\n답변드릴게요'}
					actionLabel="확인"
					onAction={() => router.back()}
				/>
			</Screen>
		);
	}

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back onPress={() => router.back()} />
				<Screen.Header.Center>문의하기</Screen.Header.Center>
			</Screen.Header>

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				className="flex-1"
			>
				<ScrollView
					className="flex-1"
					contentContainerClassName="pt-2 pb-10"
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
				>
					<Text className="mt-4 text-gray600 text-[13px] font-pretendard-regular leading-[20px]">
						모든 문의는 익명으로 진행되며 확인 후 남겨주신 연락처로 빠르게 답변드릴게요. 답변은
						1일정도 소요될 수 있어요.
					</Text>
					{/* 카테고리 */}
					<Text className="mt-5 file:text-[12px] mb-3 font-pretendard-medium text-gray500 tracking-[0.6px] uppercase">
						유형
					</Text>
					<View className="flex-row gap-2 mb-8">
						{CATEGORY_OPTIONS.map((opt) => {
							const selected = category === opt.value;
							return (
								<Chip
									key={opt.value}
									label={opt.label}
									active={selected}
									onPress={() => setCategory(opt.value)}
								/>
							);
						})}
					</View>

					{/* 내용 */}
					<Text className="text-[12px] mb-3 font-pretendard-medium text-gray500 tracking-[0.6px] uppercase">
						내용
					</Text>
					<TextField
						variant="area"
						placeholder="내용을 입력해주세요"
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
						이메일
					</Text>
					<TextField
						placeholder="답변받을 이메일"
						value={contactValue}
						onChangeText={setContact}
						keyboardType="email-address"
						autoCapitalize="none"
						returnKeyType="done"
					/>

					{status === 'error' && (
						<Text className="mt-4 text-[13px] font-pretendard-regular text-error">
							전송에 실패했어요. 잠시 후 다시 시도해주세요.
						</Text>
					)}
				</ScrollView>
				<Screen.BottomAbsolute className="bottom-10 px-1">
					<Button
						onPress={handleSubmit}
						disabled={!canSubmit}
						loading={status === 'loading'}
						accessibilityLabel="문의 보내기"
					>
						보내기
					</Button>
				</Screen.BottomAbsolute>
			</KeyboardAvoidingView>
		</Screen>
	);
}
