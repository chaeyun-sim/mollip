import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Dimensions,
	GestureResponderEvent,
	Image,
	LayoutChangeEvent,
	Modal,
	Pressable,
	ScrollView,
	Text,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Easing, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Screen } from '../../src/components/layout/Screen';
import { useTTS } from '../../src/hooks/useTTS';
import {
	useDescriptionStream,
	MAX_DESCRIPTION_RETRIES,
} from '../../src/hooks/useDescriptionStream';
import { useImmersiveStore } from '../../src/store/immersiveStore';
import { getEffectiveFontSize, useSettingsStore } from '../../src/store/settingsStore';
import { formatTime } from '../../src/utils/text';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { IconButton } from '@/src/components/common/IconButton';
import { Result } from '@/src/components/common/Result';
import { useRequireAuth } from '@/src/hooks/useRequireAuth';
import { cn } from '@/src/lib/cn';
import { useHistoryStore } from '@/src/store/historyStore';
import { useBookmarkAudioStore } from '@/src/store/bookmarkAudioStore';
import { useChatStore } from '@/src/store/chatStore';
import { store } from '@/src/store';
import { fetchWikidataImage } from '@/src/utils/wikidataImage';

const SCREEN_WIDTH = Dimensions.get('window').width;

// 해설 첫 문장엔 항상 "누구의 어떤 작품"이 언급되므로, 제목이 따로 없을 때(사진 촬영 흐름) 대신 쓴다.
// "작품 해설" 같은 머리말 한 줄만 있는 경우 등, 실제 작품명이 아닐 가능성이 큰 문장
const GENERIC_FALLBACK_TITLES = new Set(['작품 해설', '해설', '작품 소개', '오디오 가이드']);

// 해설은 항상 "작가의 작품명은/이다" 형태로 시작하지만, 가끔 머리말 한 줄이 먼저 나올 때가 있다.
// 머리말을 건너뛰고 실제 작가·작품이 언급되는 첫 문장을 찾는다.
function extractFallbackTitle(text: string): string {
	const sentences = text
		.split(/[.\n]/)
		.map((s) => s.trim())
		.filter(Boolean);
	const candidate = sentences.find((s) => s.length >= 4 && !GENERIC_FALLBACK_TITLES.has(s));
	if (!candidate) return '촬영한 작품';

	return candidate.length > 40 ? `${candidate.slice(0, 40)}…` : candidate;
}

export default function DescriptionScreen() {
	const router = useRouter();
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const [sessionId] = useState(() => Date.now().toString());
	const isImmersive = useImmersiveStore((s) => s.isImmersiveMode);
	const { fontSize, highContrast } = useSettingsStore();
	const bodyFontSize = getEffectiveFontSize(fontSize, highContrast);

	const addHistory = useHistoryStore((s) => s.add);
	const updateHistory = useHistoryStore((s) => s.update);
	const saveChatMessages = useHistoryStore((s) => s.saveChatMessages);
	const toggleBookmarkAudio = useBookmarkAudioStore((s) => s.toggle);
	const isAudioBookmarked = useBookmarkAudioStore((s) => s.isBookmarked);
	const flushChatSession = useChatStore((s) => s.flushSession);
	const { ensureAuth } = useRequireAuth();
	const [savedId, setSavedId] = useState<string | null>(null);

	const handleToggleBookmarkAudio = () => {
		if (!savedId) return;
		if (!ensureAuth('/(tabs)')) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		toggleBookmarkAudio(savedId);
	};

	const {
		displayed,
		isStreaming,
		hasError,
		isTyping,
		loadingStep,
		retryCount,
		fullTextRef,
		artworkImageUrl,
		handleRetry,
	} = useDescriptionStream();

	const [imageModalVisible, setImageModalVisible] = useState(false);

	const {
		isSpeaking,
		isLoading: isTTSLoading,
		elapsed,
		duration,
		speak,
		pause,
		resume,
		stop,
		preload,
		cancelPreload,
		seekTo,
	} = useTTS();

	// 화면을 벗어나는 모든 경로에서 오디오 정지, 프리로드 취소, 채팅 세션 플러시
	useEffect(() => {
		const unsubscribe = navigation.addListener('beforeRemove', () => {
			stop();
			cancelPreload();
			if (savedId) {
				const msgs = useChatStore.getState().getMessages(sessionId);
				const chatMsgs = msgs
					.filter((m) => !m.isError)
					.map(({ id, role, text }) => ({ id, role, text }));
				if (chatMsgs.length > 0) {
					saveChatMessages(savedId, chatMsgs);
				}
			}
			flushChatSession(sessionId);
		});
		return unsubscribe;
	}, [navigation, stop, cancelPreload, flushChatSession, sessionId, savedId, saveChatMessages]);

	// 인디케이터 progress bar 애니메이션
	const barTranslate = useSharedValue(-SCREEN_WIDTH);
	const scrollRef = useRef<ScrollView>(null);
	const progressWidth = useRef(0);

	useEffect(() => {
		if (isTyping) {
			barTranslate.value = -SCREEN_WIDTH;
			barTranslate.value = withRepeat(
				withTiming(SCREEN_WIDTH, {
					duration: 1400,
					easing: Easing.inOut(Easing.ease),
				}),
				-1,
			);
		} else {
			barTranslate.value = -SCREEN_WIDTH;
		}
	}, [isTyping, barTranslate]);

	// 스트리밍 완료 시 TTS 프리로드
	useEffect(() => {
		if (!isTyping && fullTextRef.current) {
			preload(fullTextRef.current);
		}
	}, [isTyping, fullTextRef, preload]);

	// 스트리밍 완료 시 audio_guides에 자동 저장 (들은 것 전체 기록)
	useEffect(() => {
		if (!isTyping && fullTextRef.current && !savedId) {
			// 사진 촬영 흐름은 manualTitle/extractedText가 비어있다 —
			// 해설 첫 문장에 항상 "누구의 어떤 작품"이 언급되므로 그걸 제목으로 대신 쓴다.
			const title =
				store.manualTitle || store.extractedText || extractFallbackTitle(fullTextRef.current);
			const artist = store.manualArtist || undefined;
			const id = addHistory({
				text: fullTextRef.current,
				title,
				artist,
				imageUrl: artworkImageUrl || undefined,
			});
			setSavedId(id);
			if (!artworkImageUrl) {
				fetchWikidataImage(title, artist, fullTextRef.current).then((url) => {
					if (url) updateHistory(id, { imageUrl: url });
				});
			}
		}
	}, [isTyping, addHistory, artworkImageUrl, fullTextRef, savedId, updateHistory]);

	const handlePlayPause = () => {
		if (isTTSLoading) return;
		if (isSpeaking) pause();
		else if (elapsed > 0) resume();
		else speak(fullTextRef.current);
	};

	const handleProgressTap = (e: GestureResponderEvent) => {
		if (!duration || !progressWidth.current) return;
		const ratio = e.nativeEvent.locationX / progressWidth.current;
		seekTo(ratio * duration);
	};

	const progress = duration > 0 ? elapsed / duration : 0;

	return (
		<Screen edges={['top', 'bottom']} highContrast={highContrast}>
			{!isTyping && (
				<Screen.Header>
					<ScreenHeader.Back onPress={() => router.dismissTo('/playlist')} color="white-90" />
					<Screen.Header.Right>
						<Pressable
							onPress={handleToggleBookmarkAudio}
							hitSlop={8}
							accessibilityLabel={savedId && isAudioBookmarked(savedId) ? '북마크 해제' : '북마크'}
							accessibilityRole="button"
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
						>
							<Ionicons
								name={savedId && isAudioBookmarked(savedId) ? 'heart' : 'heart-outline'}
								size={22}
								className={cn(
									savedId && isAudioBookmarked(savedId) ? 'text-red-400' : 'text-gray600',
								)}
							/>
						</Pressable>
					</Screen.Header.Right>
				</Screen.Header>
			)}

			<ScrollView ref={scrollRef} className="flex-1" contentContainerClassName="pb-[150px] pt-3">
				{hasError ? (
					<Result
						icon="alert-circle-outline"
						tone="danger"
						title={
							retryCount >= MAX_DESCRIPTION_RETRIES
								? '잠시 후 다시 시도해 주세요'
								: '해설 생성에 실패했어요'
						}
						className="flex-none mt-16"
					/>
				) : isStreaming && displayed === '' ? (
					<View className="flex-row items-center mt-5 gap-2.5">
						<ActivityIndicator color="#60A5FA" />
						<Text className="text-[15px] text-gray500">
							{loadingStep === 0 && '그림 찾는 중...'}
							{loadingStep === 1 && '그림 분석 중...'}
							{loadingStep === 2 && '해설 생성 중...'}
						</Text>
					</View>
				) : (
					<>
						<Text
							style={{
								fontSize: bodyFontSize,
								lineHeight: bodyFontSize * 1.9,
							}}
							className={cn('font-pretendard-medium', highContrast ? 'text-black' : 'text-on-dark')}
						>
							{displayed.split(/\*\*(.+?)\*\*/g).map((part, i) =>
								i % 2 === 1 ? (
									<Text key={i} className="font-pretendard-semibold">
										{part}
									</Text>
								) : (
									part
								),
							)}
						</Text>
						{!isTyping && artworkImageUrl && (
							<Pressable
								onPress={() => setImageModalVisible(true)}
								accessibilityLabel="작품 이미지 확대"
								accessibilityRole="button"
							>
								<Image
									source={{ uri: artworkImageUrl }}
									className="w-full rounded-xl mt-8"
									style={{ aspectRatio: 1, resizeMode: 'contain' }}
									accessibilityLabel="작품 이미지"
								/>
							</Pressable>
						)}
					</>
				)}
			</ScrollView>

			{/* 플레이어 항상 표시, 타이핑 중엔 비활성 */}
			<Screen.BottomAbsolute
				className={cn('bottom-9 pt-6 px-6', highContrast ? 'bg-white' : 'bg-bg-dark')}
			>
				<Pressable
					className="h-1 rounded-sm overflow-hidden bg-divider-dark"
					hitSlop={{ top: 16, bottom: 16 }}
					onLayout={(e: LayoutChangeEvent) => {
						progressWidth.current = e.nativeEvent.layout.width;
					}}
					onPress={handleProgressTap}
				>
					<View
						className="h-full rounded-sm bg-[#60A5FA]"
						style={{ width: `${progress * 100}%` }}
					/>
				</Pressable>

				<View className="flex-row justify-between mt-1 mb-2">
					<Text className="text-[11px] text-gray600">{formatTime(elapsed)}</Text>
					<Text className="text-[11px] text-gray600">
						{duration > 0 ? formatTime(duration) : '--:--'}
					</Text>
				</View>

				<View className="flex-row items-center justify-between py-1 w-full">
					<View className="w-9 items-center">
						{isImmersive && !isTyping && (
							<IconButton
								variant="bare"
								icon="chatbubble"
								accessibilityLabel="작품에 대해 질문하기"
								onPress={() => router.push({ pathname: '/chat', params: { sessionId } })}
							/>
						)}
					</View>

					<IconButton
						size="lg"
						icon={isSpeaking ? 'pause' : 'play'}
						loading={isTTSLoading}
						disabled={isTTSLoading || isTyping || !displayed}
						haptic="medium"
						accessibilityLabel={isSpeaking ? '일시정지' : '재생'}
						onPress={handlePlayPause}
					/>

					<View className="w-9 items-center" />
				</View>
			</Screen.BottomAbsolute>

			{/* 플레이어 위 재시도 버튼 — 오류 상태에서만 표시 */}
			{hasError && retryCount < MAX_DESCRIPTION_RETRIES && (
				<View
					className="absolute left-0 right-0 items-center z-[10]"
					pointerEvents="box-none"
					style={{ bottom: insets.bottom + 196 }}
				>
					<Pressable
						onPress={handleRetry}
						className="items-center gap-1.5"
						accessibilityLabel={`재시도 ${retryCount + 1}/${MAX_DESCRIPTION_RETRIES}`}
						accessibilityRole="button"
						style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
					>
						<View className="w-12 h-12 rounded-full bg-primary border border-white/10 items-center justify-center">
							<Ionicons name="refresh" size={20} color="#60A5FA" />
						</View>
						<Text className="text-[11px] text-gray600 font-pretendard-regular">
							{retryCount + 1}/{MAX_DESCRIPTION_RETRIES}
						</Text>
					</Pressable>
				</View>
			)}

			{/* 이미지 전체화면 뷰어 */}
			<Modal
				visible={imageModalVisible}
				transparent
				statusBarTranslucent
				animationType="fade"
				onRequestClose={() => setImageModalVisible(false)}
			>
				<View style={{ flex: 1, backgroundColor: 'black' }}>
					<Pressable
						onPress={() => setImageModalVisible(false)}
						hitSlop={12}
						accessibilityLabel="닫기"
						accessibilityRole="button"
						className="absolute top-[56px] right-5 z-[10]"
						style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
					>
						<Ionicons name="close" size={28} color="white" />
					</Pressable>
					<ScrollView
						contentContainerClassName="flex-1 justify-center items-center"
						maximumZoomScale={4}
						minimumZoomScale={1}
						showsVerticalScrollIndicator={false}
						showsHorizontalScrollIndicator={false}
						centerContent
					>
						<Image
							source={{ uri: artworkImageUrl ?? '' }}
							style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
							resizeMode="contain"
							accessibilityLabel="작품 이미지 전체화면"
						/>
					</ScrollView>
				</View>
			</Modal>
		</Screen>
	);
}
