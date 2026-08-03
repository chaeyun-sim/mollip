import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
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
import { Screen } from '../../src/components/layout/Screen';
import { supabase } from '@/src/utils/supabase';
import { cn } from '@/src/lib/cn';
import { useAuthStore } from '@/src/store/authStore';

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';
type Category = 'bug' | 'feature' | 'other';

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
	{ value: 'bug', label: '버그 제보' },
	{ value: 'feature', label: '기능 제안' },
	{ value: 'other', label: '기타' },
];

export default function InquiryScreen() {
	const router = useRouter();
	const userEmail = useAuthStore((s) => s.user?.email);
	const [category, setCategory] = useState<Category>('bug');
	const [content, setContent] = useState('');
	const [contact, setContact] = useState('');

	useEffect(() => {
		if (userEmail && !contact) setContact(userEmail);
	}, [userEmail, contact]);
	const [status, setStatus] = useState<SubmitStatus>('idle');

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
					<Screen.Header.Left>
						<Screen.Header.Back color='#1C1917' onPress={() => router.back()} />
					</Screen.Header.Left>
					<Screen.Header.Center>
						<Text className='text-[18px] text-gray-900 font-hahmlet-semibold'>문의하기</Text>
					</Screen.Header.Center>
					<Screen.Header.Right />
				</Screen.Header>

				<View className='flex-1 items-center justify-center gap-4 px-6'>
					<View className='w-16 h-16 rounded-full bg-[#EFF6FF] items-center justify-center'>
						<Ionicons name='checkmark' size={32} color='#3B82F6' />
					</View>
					<Text className='text-gray-900 text-[17px] font-pretendard-semibold text-center'>
						문의가 접수됐어요
					</Text>
					<Text className='text-gray-400 text-[13px] font-pretendard-regular text-center'>
						확인 후 남겨주신 연락처로 답변드릴게요
					</Text>
					<Pressable
						onPress={() => router.back()}
						className='mt-4 px-6 py-3 rounded-full bg-[#1C1917]'
						accessibilityRole='button'
						accessibilityLabel='설정으로 돌아가기'
					>
						<Text className='text-white text-[14px] font-pretendard-semibold'>확인</Text>
					</Pressable>
				</View>
			</Screen>
		);
	}

	return (
		<Screen variant='warm'>
			<Screen.Header>
				<Screen.Header.Left>
					<Screen.Header.Back color='#1C1917' onPress={() => router.back()} />
				</Screen.Header.Left>
				<Screen.Header.Center>
					<Text className='text-[18px] text-gray-900 font-hahmlet-semibold'>문의하기</Text>
				</Screen.Header.Center>
				<Screen.Header.Right />
			</Screen.Header>

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				className='flex-1'
			>
				<ScrollView
					className='flex-1'
					contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps='handled'
				>

					<Text className='text-[12px] mb-2 px-1 font-pretendard-semibold text-gray-400 tracking-[0.8]'>
						유형
					</Text>
					<View
						className='flex-row gap-2 rounded-3xl bg-[#F2EFE9] p-2 mb-6'
						style={{
							shadowColor: '#1C1917',
							shadowOpacity: 0.05,
							shadowRadius: 12,
							shadowOffset: { width: 0, height: 4 },
							elevation: 2,
						}}
					>
						{CATEGORY_OPTIONS.map((opt) => {
							const selected = category === opt.value;
							return (
								<Pressable
									key={opt.value}
									onPress={() => {
										Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
										setCategory(opt.value);
									}}
									className='flex-1 h-11 rounded-2xl items-center justify-center'
									style={{
										backgroundColor: selected ? '#3B82F6' : '#FFFFFF',
										...(selected
											? {
													shadowColor: '#3B82F6',
													shadowOpacity: 0.25,
													shadowRadius: 6,
													shadowOffset: { width: 0, height: 2 },
													elevation: 3,
												}
											: null),
									}}
									accessibilityRole='radio'
									accessibilityState={{ checked: selected }}
									accessibilityLabel={opt.label}
								>
									<Text
										className={cn(
											'text-[13px] font-pretendard-semibold',
											selected ? 'text-white' : 'text-gray-500',
										)}
									>
										{opt.label}
									</Text>
								</Pressable>
							);
						})}
					</View>

					<Text className='text-[12px] mb-2 px-1 font-pretendard-semibold text-gray-400 tracking-[0.8]'>
						내용
					</Text>
					<TextInput
						className='rounded-3xl bg-[#F2EFE9] px-4 py-4 text-gray-900 text-[15px]'
						style={{ fontFamily: 'Pretendard-Regular', minHeight: 160, textAlignVertical: 'top' }}
						placeholder='내용을 입력해주세요'
						placeholderTextColor='#A8A29E'
						value={content}
						onChangeText={setContent}
						multiline
						maxLength={2000}
					/>

					<Text className='text-[12px] mt-6 mb-2 px-1 font-pretendard-semibold text-gray-400 tracking-[0.8]'>
						연락처 (선택)
					</Text>
					<TextInput
						className='rounded-3xl bg-[#F2EFE9] px-4 text-gray-900 text-[15px]'
						style={{ fontFamily: 'Pretendard-Regular', height: 52 }}
						placeholder='답변받을 이메일을 입력해주세요'
						placeholderTextColor='#A8A29E'
						value={contact}
						onChangeText={setContact}
						keyboardType='email-address'
						autoCapitalize='none'
						returnKeyType='done'
					/>

					{status === 'error' ? (
						<Text className='mt-4 px-1 text-[13px] font-pretendard-regular text-red-500'>
							전송에 실패했어요. 잠시 후 다시 시도해주세요
						</Text>
					) : null}
				</ScrollView>

				<Screen.BottomAbsolute className="bottom-10">
					<Pressable
						onPress={handleSubmit}
						disabled={!canSubmit}
						className={cn(
							'h-14 rounded-2xl items-center justify-center',
							canSubmit ? 'bg-[#1C1917]' : 'bg-black/10',
						)}
						accessibilityRole='button'
						accessibilityLabel='문의 보내기'
						accessibilityState={{ disabled: !canSubmit }}
					>
						{status === 'submitting' ? (
							<ActivityIndicator size='small' color='#fff' />
						) : (
							<Text
								className={cn(
									'text-[15px] font-pretendard-semibold',
									canSubmit ? 'text-white' : 'text-gray-400',
								)}
							>
								보내기
							</Text>
						)}
					</Pressable>
				</Screen.BottomAbsolute>
			</KeyboardAvoidingView>
		</Screen>
	);
}
