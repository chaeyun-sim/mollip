import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
	Pressable,
	ActivityIndicator,
	FlatList,
	Image,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native';
import { Screen } from '../../src/components/layout/Screen';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { CHAT_SYSTEM_PROMPT } from '../../src/constants/prompts';
import { store } from '../../src/store';
import { useChatStore } from '../../src/store/chatStore';
import { streamChat } from '../../src/utils/api';
import { cn } from '@/src/lib/cn';

const DOCENT_AVATAR = require('../../assets/images/marker/gogh.png');

export default function ChatScreen() {
	const router = useRouter();
	const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
	const sid = sessionId ?? 'default';

	const {
		getMessages,
		getHistory,
		addMessage,
		updateMessage,
		markError,
		pushHistory,
		removeMessage,
		popHistory,
	} = useChatStore();

	const messages = getMessages(sid);
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const flatListRef = useRef<FlatList>(null);

	const sendMessage = async (overrideText?: string) => {
		const text = overrideText ?? input.trim();
		if (!text || isLoading) return;
		Keyboard.dismiss();

		const userMsg = { id: Date.now().toString(), role: 'user' as const, text };
		if (!overrideText) {
			addMessage(sid, userMsg);
			setInput('');
		}
		setIsLoading(true);

		pushHistory(sid, { role: 'user', content: text });

		const assistantId = (Date.now() + 1).toString();
		addMessage(sid, { id: assistantId, role: 'assistant', text: '' });

		let fullText = '';
		try {
			const currentHistory = getHistory(sid);
			const gen = streamChat(
				CHAT_SYSTEM_PROMPT(store.extractedText, store.artworkDescription),
				[...currentHistory, { role: 'user', content: text }],
			);
			for await (const chunk of gen) {
				fullText += chunk;
				updateMessage(sid, assistantId, fullText);
			}
			pushHistory(sid, { role: 'assistant', content: fullText });
		} catch {
			markError(sid, assistantId);
		} finally {
			setIsLoading(false);
		}
	};

	const retryMessage = (item: ReturnType<typeof getMessages>[0]) => {
		const idx = messages.findIndex((m) => m.id === item.id);
		const userMsg = messages.slice(0, idx).findLast((m) => m.role === 'user');
		if (!userMsg) return;
		removeMessage(sid, item.id);
		popHistory(sid);
		sendMessage(userMsg.text);
	};

	useEffect(() => {
		if (messages.length > 0) {
			setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
		}
	}, [messages]);

	const renderMessage = ({
		item,
	}: {
		item: ReturnType<typeof getMessages>[0];
	}) => {
		const isUser = item.role === 'user';
		return (
			<View className={`mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
				{!isUser && (
					<Image
						source={DOCENT_AVATAR}
						style={{ width: 28, height: 28, marginBottom: 4 }}
					/>
				)}
				{item.isError ? (
					<Pressable
						className='flex-row items-center gap-2 px-4 py-3 rounded-2xl rounded-tl-sm bg-[#2a1a1a]'
						onPress={() => retryMessage(item)}
						style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
					>
						<Ionicons name='refresh' size={14} color='#e05050' />
						<Text className='font-pretendard-regular text-[#e05050] text-[13px]'>
							답변 실패 — 다시 시도
						</Text>
					</Pressable>
				) : (
					<View
						className={cn(
							'rounded-2xl px-4 py-3 max-w-[80%]',
							isUser
								? 'rounded-tr-sm bg-[#3B82F6]'
								: 'rounded-tl-sm bg-[#1C1917] border-white/[0.08]',
						)}
						style={{ borderWidth: isUser ? 0 : StyleSheet.hairlineWidth }}
					>
						{item.text === '' && !isUser ? (
							<ActivityIndicator size='small' color='#60A5FA' />
						) : (
							<Text
								className={cn(
									'text-sm leading-5',
									isUser ? 'text-white' : 'text-[#e8e8e8]',
								)}
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
					<Text className='text-base text-white font-pretendard-semibold'>
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
						<View className='flex-1 items-center justify-center gap-3'>
							<View className='w-16 h-16 rounded-full items-center justify-center bg-[#1C1917]'>
								<Ionicons
									name='chatbubble-ellipses-outline'
									size={28}
									color='#57534E'
								/>
							</View>
							<Text className='text-base text-center font-pretendard-bold text-[#e8e8e8]'>
								작품이 궁금하신가요?
							</Text>
							<Text className='text-sm text-center text-[#78716C] leading-5'>
								{'작가, 시대적 배경, 기법 등\n무엇이든 물어보세요'}
							</Text>
						</View>
					}
				/>

				{/* 입력창 */}
				<View className='mb-10 flex-row items-end gap-2 py-3 border-t-[1px] border-t-[#1C1917]'>
					<TextInput
						className='flex-1 rounded-2xl px-4 pt-3 pb-3 text-sm font-pretendard-regular bg-[#1C1917] text-[#e8e8e8] min-h-[44px] max-h-[120px]'
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
					<Pressable
						className={cn(
							'w-11 h-11 rounded-full items-center justify-center',
							input.trim() && !isLoading ? 'bg-[#3B82F6]' : 'bg-[#1C1917]',
						)}
						onPress={() => sendMessage()}
						disabled={!input.trim() || isLoading}
						accessibilityLabel='전송'
						accessibilityRole='button'
						style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
					>
						<Ionicons
							name='arrow-up'
							size={20}
							color={input.trim() && !isLoading ? '#fff' : '#292524'}
						/>
					</Pressable>
				</View>
			</KeyboardAvoidingView>
		</Screen>
	);
}
