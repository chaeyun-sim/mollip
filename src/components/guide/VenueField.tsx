import { Pressable, Text, TextInput, View } from 'react-native';

import { cn } from '@/src/lib/cn';

interface VenueFieldProps {
	value: string;
	error: boolean;
	focused: boolean;
	onFocus: () => void;
	onBlur: () => void;
	onChangeText: (text: string) => void;
	onSubmitEditing: () => void;
}

/** 관람 장소 입력 필드 — 탭하면 편집 모드로 전환되는 단순 텍스트 필드. */
export function VenueField({
	value,
	error,
	focused,
	onFocus,
	onBlur,
	onChangeText,
	onSubmitEditing,
}: VenueFieldProps) {
	return (
		<View className='mb-8'>
			<Text className='text-xs mb-2 font-pretendard-semibold text-muted tracking-wider'>
				위치
			</Text>
			<View
				className={cn(
					'rounded-lg border bg-primary',
					error ? 'border-error' : 'border-divider-dark',
				)}
				style={{ height: 52, overflow: 'hidden' }}
			>
				{focused ? (
					<TextInput
						autoFocus
						className='flex-1 px-4 text-base font-pretendard-regular text-on-dark'
						placeholder='예) 국립현대미술관 과천관'
						placeholderTextColor='#57534E'
						value={value}
						onChangeText={onChangeText}
						returnKeyType='done'
						onSubmitEditing={onSubmitEditing}
						numberOfLines={1}
						style={{ lineHeight: 0 }}
						onBlur={onBlur}
					/>
				) : (
					<Pressable
						style={{ flex: 1, paddingHorizontal: 16, justifyContent: 'center' }}
						onPress={onFocus}
						accessibilityRole='button'
						accessibilityLabel='위치 입력'
					>
						<Text
							numberOfLines={1}
							className={cn(
								'text-base font-pretendard-regular',
								value ? 'text-on-dark' : 'text-secondary',
							)}
						>
							{value || '예) 국립현대미술관 과천관'}
						</Text>
					</Pressable>
				)}
			</View>
			{error && (
				<Text className='text-xs mt-1.5 font-pretendard-regular text-error'>
					위치를 입력해 주세요
				</Text>
			)}
		</View>
	);
}
