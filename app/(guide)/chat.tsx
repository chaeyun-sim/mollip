import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
	Pressable,
	FlatList,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	Text,
	TextInput,
	View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Screen } from '../../src/components/layout/Screen';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { ChatMessage } from '@/src/components/guide/ChatMessage';
import { CHAT_SYSTEM_PROMPT } from '../../src/constants/prompts';
import { store } from '../../src/store';
import { useChatStore } from '../../src/store/chatStore';
import { useSettingsStore } from '@/src/store/settingsStore';
import { streamChat } from '../../src/utils/api';
import { cn } from '@/src/lib/cn';
import { colors } from '@/src/constants/colors';

const MAX_EXCHANGES = 6;
const HIGH_CONTRAST_COLOR = '#F0EFED';

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

	const highContrast = useSettingsStore((s) => s.highContrast);
	const messages = getMessages(sid);

	const openArtworkSearch = () => {
		const title =
			store.manualTitle || store.extractedText.split('\n')[0]?.replace('작품명: ', '') || '';
		const artist = store.manualArtist || '';
		const query = encodeURIComponent([title, artist].filter(Boolean).join(' '));
		WebBrowser.openBrowserAsync(`https://www.google.com/search?q=${query}&tbm=isch`);
	};
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const flatListRef = useRef<FlatList>(null);

	// 사용자 메시지(질문) 수 — 재시도는 기존 메시지를 교체하므로 카운트 증가 없음
	const exchangeCount = messages.filter((m) => m.role === 'user').length;
	const isAtLimit = exchangeCount >= MAX_EXCHANGES;

	const sendMessage = async (overrideText?: string) => {
		const text = overrideText ?? input.trim();
		if (!text || isLoading) return;
		// 재시도(overrideText)는 한도 체크 제외 — 실패한 답변을 교체하는 것이므로 새 교환이 아님
		if (!overrideText && isAtLimit) return;
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
			const gen = streamChat(CHAT_SYSTEM_PROMPT(store.extractedText, store.artworkDescription), [
				...currentHistory,
				{ role: 'user', content: text },
			]);
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

	useEffect(() => {
		const sub = Keyboard.addListener('keyboardDidShow', () => {
			setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
		});
		return () => sub.remove();
	}, []);

	const renderMessage = ({ item }: { item: ReturnType<typeof getMessages>[0] }) => (
		<ChatMessage item={item} onRetry={retryMessage} />
	);

	return (
		<Screen highContrast={highContrast}>
			<ScreenHeader>
				<ScreenHeader.Left>
					<ScreenHeader.Back
						onPress={() => router.back()}
						color={highContrast ? 'default' : 'muted'}
					/>
				</ScreenHeader.Left>
				<ScreenHeader.Center>
					<Text
						className={cn(
							'text-base font-pretendard-semibold',
							highContrast ? 'text-gray900' : 'text-white',
						)}
					>
						작품에 대해 물어보기
					</Text>
				</ScreenHeader.Center>
				<ScreenHeader.Right>
					<Pressable
						onPress={openArtworkSearch}
						hitSlop={8}
						accessibilityLabel="작품 이미지 검색"
						accessibilityRole="button"
						style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
					>
						<Ionicons
							name="globe-outline"
							size={22}
							className={cn(highContrast ? 'text-gray900' : 'text-white/90')}
						/>
					</Pressable>
				</ScreenHeader.Right>
			</ScreenHeader>

			<KeyboardAvoidingView
				className="flex-1"
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
						<View className="flex-1 items-center justify-center gap-3">
							<View
								className="w-16 h-16 rounded-full items-center justify-center"
								style={{ backgroundColor: highContrast ? HIGH_CONTRAST_COLOR : colors.gray900 }}
							>
								<Ionicons name="chatbubble-ellipses-outline" size={28} className="text-gray700" />
							</View>
							<Text
								className="text-base text-center font-pretendard-bold"
								style={{ color: highContrast ? colors.gray900 : colors.onDark }}
							>
								작품이 궁금하신가요?
							</Text>
							<Text className="text-sm text-center text-gray600 leading-5">
								{'작가, 시대적 배경, 기법 등\n무엇이든 물어보세요'}
							</Text>
						</View>
					}
				/>

				{/* 입력창 */}
				{isAtLimit ? (
					<View
						className={cn(
							'mb-10 py-4 border-t-[1px] items-center',
							highContrast ? 'border-t-divider' : 'border-t-gray900',
						)}
					>
						<Text className="text-gray700 text-[13px] font-pretendard-regular">
							대화는 최대 {MAX_EXCHANGES}번까지 가능해요
						</Text>
					</View>
				) : (
					<View
						className={cn(
							'mb-10 flex-row items-end gap-2 py-3 border-t-[1px]',
							highContrast ? 'border-t-divider' : 'border-t-gray900',
						)}
					>
						<TextInput
							className={cn(
								'flex-1 rounded-2xl px-4 pt-3 pb-3 text-[14px] font-pretendard-regular min-h-[48px] max-h-[120px]',
								highContrast ? 'text-gray900' : 'text-on-dark',
							)}
							style={{ backgroundColor: highContrast ? HIGH_CONTRAST_COLOR : colors.gray900 }}
							returnKeyType="send"
							value={input}
							onChangeText={(t) => {
								if (t.endsWith('\n')) {
									sendMessage();
								} else {
									setInput(t);
								}
							}}
							placeholder="질문을 입력하세요..."
							placeholderTextColor={colors.gray700}
							keyboardAppearance={highContrast ? 'light' : 'dark'}
							multiline
						/>
						<Pressable
							className="w-11 h-11 rounded-full items-center justify-center"
							onPress={() => sendMessage()}
							disabled={!input.trim() || isLoading}
							accessibilityLabel="전송"
							accessibilityRole="button"
							style={({ pressed }) => ({
								opacity: pressed ? 0.7 : 1,
								backgroundColor:
									input.trim() && !isLoading
										? colors.primary
										: highContrast
											? HIGH_CONTRAST_COLOR
											: colors.gray900,
							})}
						>
							<Ionicons
								name="arrow-up"
								size={20}
								className={input.trim() && !isLoading ? 'text-white' : 'text-gray400'}
							/>
						</Pressable>
					</View>
				)}
			</KeyboardAvoidingView>
		</Screen>
	);
}
