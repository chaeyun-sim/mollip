import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	Text,
	TextInput,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ExcludeWordsModalProps {
	visible: boolean;
	words: string[];
	onAdd: (word: string) => void;
	onRemove: (word: string) => void;
	onDismiss: () => void;
}

export function ExcludeWordsModal({
	visible,
	words,
	onAdd,
	onRemove,
	onDismiss,
}: ExcludeWordsModalProps) {
	const insets = useSafeAreaInsets();
	const [input, setInput] = useState('');

	const handleSubmit = () => {
		onAdd(input);
		setInput('');
	};

	return (
		<Modal visible={visible} transparent animationType='fade'>
			<Pressable
				className='flex-1 justify-end'
				style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
				onPress={onDismiss}
			>
				<Pressable onPress={(e) => e.stopPropagation()}>
					<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
						<View
							className='bg-white rounded-t-3xl px-6 pt-3'
							style={{ paddingBottom: insets.bottom + 16 }}
						>
							<View className='items-center pb-3'>
								<View className='w-9 h-1 rounded-full bg-black/15' />
							</View>

							<Text
								className='text-[#1C1917] text-lg mb-1'
								style={{ fontFamily: 'Pretendard-Bold' }}
							>
								제외할 검색어
							</Text>
							<Text
								className='text-[#78716C] text-[13px] mb-4'
								style={{ fontFamily: 'Pretendard-Regular' }}
							>
								입력한 단어가 포함된 전시는 결과에서 빠집니다
							</Text>

							<View className='flex-row items-center gap-2 bg-[#F2EFE9] rounded-2xl px-4 py-3 mb-4'>
								<Ionicons name='remove-circle-outline' size={16} color='#78716C' />
								<TextInput
									className='flex-1 text-[#1C1917] text-sm'
									style={{ fontFamily: 'Pretendard-Regular', lineHeight: 0 }}
									placeholder='예: 미디어아트'
									placeholderTextColor='#A8A29E'
									value={input}
									onChangeText={setInput}
									onSubmitEditing={handleSubmit}
									returnKeyType='done'
									submitBehavior='submit'
								/>
								<Pressable
									onPress={handleSubmit}
									hitSlop={8}
									accessibilityLabel='제외어 추가'
									accessibilityRole='button'
								>
									<Ionicons name='add-circle' size={22} color='#1C1917' />
								</Pressable>
							</View>

							{words.length > 0 && (
								<View className='flex-row flex-wrap gap-2 mb-2'>
									{words.map((word) => (
										<Pressable
											key={word}
											onPress={() => onRemove(word)}
											accessibilityLabel={`제외어 ${word} 삭제`}
											accessibilityRole='button'
											className='flex-row items-center gap-1 rounded-full bg-[#1C1917] px-3 py-1.5'
											style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
										>
											<Text
												className='text-white text-[13px]'
												style={{ fontFamily: 'Pretendard-Medium' }}
											>
												{word}
											</Text>
											<Ionicons name='close' size={13} color='rgba(255,255,255,0.7)' />
										</Pressable>
									))}
								</View>
							)}

							<Pressable
								onPress={onDismiss}
								accessibilityLabel='완료'
								accessibilityRole='button'
								className='items-center rounded-2xl bg-[#1C1917] py-3.5 mt-2'
								style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
							>
								<Text
									className='text-white text-[15px]'
									style={{ fontFamily: 'Pretendard-SemiBold' }}
								>
									완료
								</Text>
							</Pressable>
						</View>
					</KeyboardAvoidingView>
				</Pressable>
			</Pressable>
		</Modal>
	);
}
