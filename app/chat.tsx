import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { Screen } from '../src/components/layout/Screen';
import { ScreenHeader } from '../src/components/layout/ScreenHeader';
import { CHAT_SYSTEM_PROMPT } from '../src/constants/prompts';
import { store } from '../src/store';
import { useChatStore } from '../src/store/chatStore';
import { streamChat } from '../src/utils/api';

export default function ChatScreen() {
	const router = useRouter();
	const { messages, history, addMessage, updateMessage, markError, pushHistory } =
		useChatStore();
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const flatListRef = useRef<FlatList>(null);

	const sendMessage = async (overrideText?: string) => {
		const text = overrideText ?? input.trim();
		if (!text || isLoading) return;
		Keyboard.dismiss();

		const userMsg = { id: Date.now().toString(), role: 'user' as const, text };
		if (!overrideText) {
			addMessage(userMsg);
			setInput('');
		}
		setIsLoading(true);

		pushHistory({ role: 'user', content: text });

		const assistantId = (Date.now() + 1).toString();
		addMessage({ id: assistantId, role: 'assistant', text: '' });

		let fullText = '';
		try {
			const gen = streamChat(
				CHAT_SYSTEM_PROMPT(store.extractedText, store.artworkDescription),
				[...history, { role: 'user', content: text }],
			);
			for await (const chunk of gen) {
				fullText += chunk;
				updateMessage(assistantId, fullText);
			}
			pushHistory({ role: 'assistant', content: fullText });
		} catch {
			markError(assistantId);
		} finally {
			setIsLoading(false);
		}
	};

	const retryMessage = (item: (typeof messages)[0]) => {
		// 직전 유저 메시지 찾기
		const idx = messages.findIndex((m) => m.id === item.id);
		const userMsg = messages.slice(0, idx).findLast((m) => m.role === 'user');
		if (!userMsg) return;
		// 에러 메시지 제거 후 재전송
		useChatStore.setState((s) => ({
			messages: s.messages.filter((m) => m.id !== item.id),
			history: s.history.slice(0, -1), // 마지막 유저 history 제거
		}));
		sendMessage(userMsg.text);
	};

	useEffect(() => {
		if (messages.length > 0) {
			setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
		}
	}, [messages]);

	const renderMessage = ({ item }: { item: (typeof messages)[0] }) => {
		const isUser = item.role === 'user';
		return (
			<View className={`mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
				{!isUser && (
					<View
						className='w-6 h-6 rounded-full items-center justify-center mb-1'
						style={{ backgroundColor: '#1e2d4a' }}
					>
						<Ionicons name='sparkles' size={12} color='#60A5FA' />
					</View>
				)}
				{item.isError ? (
					<TouchableOpacity
						className='flex-row items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-sm'
						style={{ backgroundColor: '#2a1a1a' }}
						onPress={() => retryMessage(item)}
					>
						<Ionicons name='refresh' size={14} color='#e05050' />
						<Text style={{ fontFamily: 'Pretendard-Regular', color: '#e05050', fontSize: 13 }}>
							답변 실패 — 다시 시도
						</Text>
					</TouchableOpacity>
				) : (
					<View
						className={`rounded-2xl px-4 py-3 max-w-[80%] ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
						style={{
							backgroundColor: isUser ? '#3B82F6' : '#1C1917',
							borderWidth: isUser ? 0 : StyleSheet.hairlineWidth,
							borderColor: 'rgba(255,255,255,0.08)',
						}}
					>
						{item.text === '' && !isUser ? (
							<ActivityIndicator size='small' color='#60A5FA' />
						) : (
							<Text
								className='text-sm leading-5'
								style={{
									fontFamily: 'Pretendard-Regular',
									color: isUser ? '#fff' : '#efefef',
								}}
							>
								{item.text}
							</Text>
						)}
					</View>
				)}
			</View>
		);
	};

	return (
		<Screen>
			<ScreenHeader>
				<ScreenHeader.Left>
					<ScreenHeader.Back onPress={() => router.back()} />
				</ScreenHeader.Left>
				<ScreenHeader.Center>
					<Text
						className='text-base text-white'
						style={{ fontFamily: 'Pretendard-SemiBold' }}
					>
						작품에 대해 물어보기
					</Text>
				</ScreenHeader.Center>
				<ScreenHeader.Right />
			</ScreenHeader>

			<KeyboardAvoidingView
				className='flex-1'
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				keyboardVerticalOffset={0}
			>
				<FlatList
					ref={flatListRef}
					data={messages}
					keyExtractor={(item) => item.id}
					renderItem={renderMessage}
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ flexGrow: 1, paddingTop: 16, paddingBottom: 8 }}
					ListEmptyComponent={
						<View className='flex-1 items-center justify-center' style={{ gap: 12 }}>
							<View
								className='w-16 h-16 rounded-full items-center justify-center'
								style={{ backgroundColor: '#1C1917' }}
							>
								<Ionicons name='chatbubble-ellipses-outline' size={28} color='#57534E' />
							</View>
							<Text
								className='text-base text-center'
								style={{ fontFamily: 'Pretendard-SemiBold', color: '#e8e8e8' }}
							>
								작품이 궁금하신가요?
							</Text>
							<Text
								className='text-sm text-center'
								style={{
									fontFamily: 'Pretendard-Regular',
									color: '#78716C',
									lineHeight: 20,
								}}
							>
								{'작가, 시대적 배경, 기법 등\n무엇이든 물어보세요'}
							</Text>
						</View>
					}
				/>

				{/* 입력창 */}
				<View
					className='flex-row items-end gap-2 py-3'
					style={{ borderTopWidth: 1, borderTopColor: '#1C1917' }}
				>
					<TextInput
						className='flex-1 rounded-2xl px-4 text-sm'
						style={{
							backgroundColor: '#1C1917',
							color: '#e8e8e8',
							fontFamily: 'Pretendard-Regular',
							minHeight: 44,
							maxHeight: 120,
							paddingTop: 12,
							paddingBottom: 12,
						}}
						returnKeyType='send'
						value={input}
						onChangeText={(t) => {
							if (t.endsWith('\n')) {
								sendMessage();
							} else {
								setInput(t);
							}
						}}
						placeholder='질문을 입력하세요...'
						placeholderTextColor='#57534E'
						multiline
					/>
					<TouchableOpacity
						className='w-11 h-11 rounded-full items-center justify-center'
						style={{
							backgroundColor: input.trim() && !isLoading ? '#3B82F6' : '#1C1917',
						}}
						onPress={sendMessage}
						disabled={!input.trim() || isLoading}
						accessibilityLabel='전송'
						accessibilityRole='button'
					>
						<Ionicons
							name='arrow-up'
							size={20}
							color={input.trim() && !isLoading ? '#fff' : '#292524'}
						/>
					</TouchableOpacity>
				</View>
			</KeyboardAvoidingView>
		</Screen>
	);
}
