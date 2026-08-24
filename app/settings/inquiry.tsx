import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

import { Screen } from '@/src/components/layout/Screen';
import { cn } from '@/src/lib/cn';
import { useAuthStore } from '@/src/store/authStore';
import { supabase } from '@/src/utils/supabase';
import { colors } from '@/src/constants/colors';

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';
type Category = 'bug' | 'other';

const CATEGORY_OPTIONS: { value: Category; label: string; emoji: string }[] = [
	{ value: 'bug', label: '버그 제보', emoji: '🐛' },
	{ value: 'other', label: '기타', emoji: '✉️' },
];

export default function InquiryScreen() {
	const router = useRouter();
	const userEmail = useAuthStore((s) => s.user?.email);
	const [category, setCategory] = useState<Category>('bug');
	const [content, setContent] = useState('');
	const [contact, setContact] = useState('');
	const [status, setStatus] = useState<SubmitStatus>('idle');

	useEffect(() => {
		if (userEmail && !contact) setContact(userEmail);
	}, [userEmail]);

	const canSubmit = content.trim().length > 0 && status !== 'submitting';

	const handleSubmit = async () => {
		if (!canSubmit) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setStatus('submitting');
		const { error } = await supabase.from('inquiries').insert({
			category,
			content: content.trim(),
			contact: contact.trim() || null,
		});

		if (error) {
			setStatus('error');
			return;
		}

		setStatus('success');
	};

	if (status === 'success') {
		return (
			<Screen variant='warm'>
				<Screen.Header>
					<Screen.Header.Back color={colors.primary} onPress={() => router.back()} />
					<Screen.Header.Center>
						<Text className='text-[18px] text-primary font-hahmlet-semibold'>
							문의하기
						</Text>
					</Screen.Header.Center>
				</Screen.Header>

				<View className='flex-1 items-center justify-center gap-4 px-6'>
					<View className='w-[72px] h-[72px] rounded-full bg-[#E8E3DB] items-center justify-center mb-1'>
						<Text style={{ fontSize: 32 }}>✓</Text>
					</View>
					<Text className='text-primary text-[17px] font-pretendard-semibold text-center'>
						문의가 접수됐어요
					</Text>
					<Text className='text-tertiary text-[13px] font-pretendard-regular text-center leading-[20px]'>
						확인 후 남겨주신 연락처로{'\n'}답변드릴게요
					</Text>
					<Pressable
						onPress={() => router.back()}
						className='mt-4 px-8 py-[14px] rounded-2xl bg-primary'
						accessibilityRole='button'
						accessibilityLabel='설정으로 돌아가기'
						style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
					>
						<Text className='text-white text-[15px] font-pretendard-semibold'>
							확인
						</Text>
					</Pressable>
				</View>
			</Screen>
		);
	}

	return (
		<Screen variant='warm'>
			<Screen.Header>
				<Screen.Header.Back color={colors.primary} onPress={() => router.back()} />
				<Screen.Header.Center>
					<Text className='text-[18px] text-primary font-hahmlet-semibold'>
						문의하기
					</Text>
				</Screen.Header.Center>
				<Screen.Header.Right>
					<Pressable
						onPress={handleSubmit}
						disabled={!canSubmit}
						hitSlop={8}
						accessibilityRole='button'
						accessibilityLabel='문의 보내기'
						accessibilityState={{ disabled: !canSubmit }}
						className={cn(
							'rounded-full px-3.5 py-1.5',
							canSubmit ? 'bg-primary' : 'bg-divider',
						)}
						style={({ pressed }) => ({ opacity: pressed && canSubmit ? 0.8 : 1 })}
					>
						{status === 'submitting' ? (
							<ActivityIndicator size='small' color='#fff' />
						) : (
							<Text
								className={cn(
									'text-[14px] font-pretendard-semibold',
									canSubmit ? 'text-white' : 'text-muted',
								)}
							>
								보내기
							</Text>
						)}
					</Pressable>
				</Screen.Header.Right>
			</Screen.Header>

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				className='flex-1'
			>
				<ScrollView
					className='flex-1'
					contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps='handled'
				>
					{/* 카테고리 */}
					<Text className='text-[12px] mb-3 font-pretendard-medium text-muted tracking-[0.6px] uppercase'>
						유형
					</Text>
					<View className='flex-row gap-2 mb-8'>
						{CATEGORY_OPTIONS.map((opt) => {
							const selected = category === opt.value;
							return (
								<Pressable
									key={opt.value}
									onPress={() => {
										Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
										setCategory(opt.value);
									}}
									className={cn(
										'flex-1 py-[13px] rounded-2xl items-center justify-center gap-1',
										selected ? 'bg-primary' : 'bg-bg-tonal',
									)}
									accessibilityRole='radio'
									accessibilityState={{ checked: selected }}
									accessibilityLabel={opt.label}
									style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
								>
									<Text style={{ fontSize: 18 }}>{opt.emoji}</Text>
									<Text
										className={cn(
											'text-[12px] font-pretendard-semibold',
											selected ? 'text-white' : 'text-tertiary',
										)}
									>
										{opt.label}
									</Text>
								</Pressable>
							);
						})}
					</View>

					{/* 내용 */}
					<Text className='text-[12px] mb-3 font-pretendard-medium text-muted tracking-[0.6px] uppercase'>
						내용
					</Text>
					<TextInput
						className='rounded-2xl bg-bg-tonal px-4 py-4 text-primary text-[15px] font-pretendard-regular'
						style={{ minHeight: 160, textAlignVertical: 'top' }}
						placeholder='내용을 입력해주세요'
						placeholderTextColor='#C7C3BD'
						value={content}
						onChangeText={setContent}
						multiline
						maxLength={2000}
					/>
					<Text className='text-right text-[12px] font-pretendard-regular text-[#C7C3BD] mt-1.5 pr-1'>
						{content.length}/2000
					</Text>

					{/* 연락처 */}
					<Text className='text-[12px] mt-6 mb-3 font-pretendard-medium text-muted tracking-[0.6px] uppercase'>
						연락처 (선택)
					</Text>
					<TextInput
						className='rounded-2xl bg-bg-tonal px-4 text-primary text-[15px] h-[52px] font-pretendard-regular'
						placeholder='답변받을 이메일'
						placeholderTextColor='#C7C3BD'
						value={contact}
						onChangeText={setContact}
						keyboardType='email-address'
						autoCapitalize='none'
						returnKeyType='done'
					/>

					{status === 'error' && (
						<Text className='mt-4 text-[13px] font-pretendard-regular text-error'>
							전송에 실패했어요. 잠시 후 다시 시도해주세요.
						</Text>
					)}
				</ScrollView>
			</KeyboardAvoidingView>
		</Screen>
	);
}
