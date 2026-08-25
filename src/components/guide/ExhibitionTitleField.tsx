import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { cn } from '@/src/lib/cn';

export interface ExhibitionSuggestion {
	id: string;
	title: string;
	venue: string;
}

interface ExhibitionTitleFieldProps {
	value: string;
	error: boolean;
	focused: boolean;
	isSearching: boolean;
	suggestions: ExhibitionSuggestion[];
	onFocus: () => void;
	onBlur: () => void;
	onChangeText: (text: string) => void;
	onSubmitEditing: () => void;
	onSelectSuggestion: (suggestion: ExhibitionSuggestion) => void;
}

/** 전시명 입력 필드 — 탭하면 편집 모드, 입력 중 전시 자동완성 목록을 아래에 띄운다. */
export function ExhibitionTitleField({
	value,
	error,
	focused,
	isSearching,
	suggestions,
	onFocus,
	onBlur,
	onChangeText,
	onSubmitEditing,
	onSelectSuggestion,
}: ExhibitionTitleFieldProps) {
	return (
		<View className='mb-5 z-10'>
			<Text className='text-xs mb-2 font-pretendard-semibold text-muted tracking-wider'>
				전시명
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
						className='flex-1 px-4 text-base text-on-dark font-pretendard-regular'
						textAlignVertical='center'
						placeholder='예) 이우환: 시간의 여백'
						placeholderTextColor='#57534E'
						value={value}
						onChangeText={onChangeText}
						returnKeyType='next'
						onSubmitEditing={onSubmitEditing}
						style={{ lineHeight: 0 }}
						multiline={false}
						numberOfLines={1}
						onBlur={onBlur}
						clearButtonMode='while-editing'
					/>
				) : (
					<Pressable
						style={{ flex: 1, paddingHorizontal: 16, justifyContent: 'center' }}
						onPress={onFocus}
						accessibilityRole='button'
						accessibilityLabel='전시명 입력'
					>
						<Text
							numberOfLines={1}
							className={cn(
								'text-base font-pretendard-regular',
								value ? 'text-on-dark' : 'text-secondary',
							)}
						>
							{value || '예) 이우환: 시간의 여백'}
						</Text>
					</Pressable>
				)}
				{isSearching && (
					<ActivityIndicator
						size='small'
						color='#57534E'
						style={{ position: 'absolute', right: 14, top: 16 }}
					/>
				)}
			</View>
			{error && (
				<Text className='text-xs mt-1.5 font-pretendard-regular text-error'>
					전시명을 입력해 주세요
				</Text>
			)}

			{suggestions.length > 0 && (
				<View
					className='mt-1 rounded-xl overflow-hidden bg-primary'
					style={{ borderWidth: StyleSheet.hairlineWidth, borderColor: '#3C3A38' }}
				>
					{suggestions.map((s, index) => (
						<Pressable
							key={s.id}
							className='px-4 py-3 flex-row items-center gap-3'
							style={({ pressed }) => ({
								opacity: pressed ? 0.7 : 1,
								borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
								borderTopColor: '#3C3A38',
							})}
							onPress={() => onSelectSuggestion(s)}
						>
							<Ionicons name='search' size={14} className='text-secondary' />
							<View className='flex-1'>
								<Text
									className='text-on-dark text-sm font-pretendard-semibold'
									numberOfLines={1}
								>
									{s.title}
								</Text>
								{s.venue ? (
									<Text
										className='text-xs mt-0.5 font-pretendard-regular text-tertiary'
										numberOfLines={1}
									>
										{s.venue}
									</Text>
								) : null}
							</View>
							<Ionicons name='return-down-back' size={14} className='text-secondary' />
						</Pressable>
					))}
				</View>
			)}
		</View>
	);
}
