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
import { colors } from '@/src/constants/colors';

interface ExcludeWordsModalProps {
	visible: boolean;
	words: string[];
	onAdd: (word: string) => void;
	onRemove: (word: string) => void;
	onClearAll: () => void;
	onDismiss: () => void;
}

export function ExcludeWordsModal({
	visible,
	words,
	onAdd,
	onRemove,
	onClearAll,
	onDismiss,
}: ExcludeWordsModalProps) {
	const insets = useSafeAreaInsets();
	const [input, setInput] = useState('');

	const handleSubmit = () => {
		onAdd(input);
		setInput('');
	};

	return (
		<Modal visible={visible} transparent animationType="fade">
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				style={{ flex: 1 }}
			>
				<Pressable className="flex-1 justify-end bg-black/35" onPress={onDismiss}>
					<Pressable onPress={(e) => e.stopPropagation()}>
						<View
							className="bg-white rounded-t-3xl px-6 pt-3"
							style={{ paddingBottom: insets.bottom + 16 }}
						>
							<View className="items-center pb-3">
								<View className="w-9 h-1 rounded-full bg-black/15" />
							</View>

							<Text className="text-gray900 text-lg mb-1 font-pretendard-bold">제외할 검색어</Text>
							<Text className="text-gray600 text-[13px] mb-4 font-pretendard-regular">
								입력한 단어가 포함된 전시는 결과에서 빠집니다
							</Text>

							<View className="flex-row items-center gap-2 bg-bg-tonal rounded-2xl px-4 py-3 mb-4">
								<Ionicons name="remove-circle-outline" size={16} className="text-gray600" />
								<TextInput
									className="flex-1 text-gray900 text-sm font-pretendard-regular leading-none"
									placeholder="예: 미디어아트"
									placeholderTextColor={colors.gray500}
									value={input}
									onChangeText={setInput}
									onSubmitEditing={handleSubmit}
									returnKeyType="done"
									submitBehavior="submit"
									style={{ lineHeight: 0 }}
								/>
								<Pressable
									onPress={onClearAll}
									disabled={words.length === 0}
									hitSlop={8}
									accessibilityLabel="제외어 전체 삭제"
									accessibilityRole="button"
									accessibilityState={{ disabled: words.length === 0 }}
								>
									<Ionicons
										name="close-circle"
										size={22}
										className={words.length > 0 ? 'text-gray900' : 'text-gray400'}
									/>
								</Pressable>
							</View>

							{words.length > 0 && (
								<View className="flex-row flex-wrap gap-2 mb-2">
									{words.map((word) => (
										<Pressable
											key={word}
											onPress={() => onRemove(word)}
											accessibilityLabel={`제외어 ${word} 삭제`}
											accessibilityRole="button"
											className="flex-row items-center gap-1 rounded-full bg-primary-dark px-3 py-1.5"
											style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
										>
											<Text className="text-white text-[13px] font-pretendard-medium">{word}</Text>
											<Ionicons name="close" size={13} color="rgba(255,255,255,0.7)" />
										</Pressable>
									))}
								</View>
							)}

							<Pressable
								onPress={onDismiss}
								accessibilityLabel="완료"
								accessibilityRole="button"
								className="items-center rounded-2xl bg-secondary py-3.5 mt-2"
								style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
							>
								<Text className="text-white text-[15px] font-pretendard-semibold">완료</Text>
							</Pressable>
						</View>
					</Pressable>
				</Pressable>
			</KeyboardAvoidingView>
		</Modal>
	);
}
