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
	Share,
	Text,
	View,
} from 'react-native';
import { shareFeedTemplate } from '@react-native-kakao/share';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
	Easing,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';
import { Screen } from '../../src/components/layout/Screen';
import { useTTS } from '../../src/hooks/useTTS';
import { useDescriptionStream, MAX_DESCRIPTION_RETRIES } from '../../src/hooks/useDescriptionStream';
import { useImmersiveStore } from '../../src/store/immersiveStore';
import {
	FONT_SIZE_VALUE,
	getEffectiveFontSize,
	useSettingsStore,
} from '../../src/store/settingsStore';
import { formatTime } from '../../src/utils/text';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { MarkdownBoldText } from '@/src/components/common/MarkdownBoldText';
import { cn } from '@/src/lib/cn';
import { useHistoryStore } from '@/src/store/historyStore';
import { useBookmarkAudioStore } from '@/src/store/bookmarkAudioStore';
import { useChatStore } from '@/src/store/chatStore';
import { store } from '@/src/store';
import { fetchWikidataImage } from '@/src/utils/wikidataImage';
import { colors } from '@/src/constants/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function DescriptionScreen() {
	const router = useRouter();
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const sessionId = useRef(Date.now().toString()).current;
	const isImmersive = useImmersiveStore((s) => s.isImmersiveMode);
	const { fontSize, highContrast } = useSettingsStore();
	const bodyFontSize = getEffectiveFontSize(fontSize, highContrast);

	const addHistory = useHistoryStore((s) => s.add);
	const updateHistory = useHistoryStore((s) => s.update);
	const saveChatMessages = useHistoryStore((s) => s.saveChatMessages);
	const toggleBookmarkAudio = useBookmarkAudioStore((s) => s.toggle);
	const isAudioBookmarked = useBookmarkAudioStore((s) => s.isBookmarked);
	const flushChatSession = useChatStore((s) => s.flushSession);
	const [savedId, setSavedId] = useState<string | null>(null);

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
	}, [isTyping]);

	// 스트리밍 완료 시 TTS 프리로드
	useEffect(() => {
		if (!isTyping && fullTextRef.current) {
			preload(fullTextRef.current);
		}
	}, [isTyping]);

	// 스트리밍 완료 시 audio_guides에 자동 저장 (들은 것 전체 기록)
	useEffect(() => {
		if (!isTyping && fullTextRef.current && !savedId) {
			const title = store.manualTitle || store.extractedText || '작품 해설';
			const artist = store.manualArtist || undefined;
			const id = addHistory({
				text: fullTextRef.current,
				title,
				artist,
				imageUrl: artworkImageUrl || undefined,
			});
			setSavedId(id);
			if (!artworkImageUrl && title !== '작품 해설') {
				fetchWikidataImage(title, artist).then((url) => {
					if (url) updateHistory(id, { imageUrl: url });
				});
			}
		}
	}, [isTyping]);

	const handlePlayPause = () => {
		if (isTTSLoading) return;
		if (isSpeaking) pause();
		else if (elapsed > 0) resume();
		else speak(fullTextRef.current);
	};

	const handleShare = async () => {
		const title = store.manualTitle || store.extractedText || '작품';
		const fullText = fullTextRef.current ?? '';
		const firstSentence = fullText.split(/[.\n]/)[0]?.trim() ?? '';
		const description =
			(firstSentence.length > 80 ? firstSentence.slice(0, 80) + '…' : firstSentence) +
			'\nmollip에서 감상했어요 🎨';

		const link = { mobileWebUrl: 'https://mollip.app', webUrl: 'https://mollip.app' };

		try {
			await shareFeedTemplate({
				template: {
					content: {
						title,
						description,
						imageUrl: artworkImageUrl ?? '',
						link,
					},
					buttons: [{ title: '해설 들으러 가기', link }],
				},
			});
		} catch {
			await Share.share({
				message: `${title}\n${firstSentence}\nmollip에서 감상했어요 🎨`,
				title,
			});
		}
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
					<ScreenHeader.Back
						onPress={() => {
							router.back();
						}}
						color='rgba(255,255,255,0.9)'
					/>
					<Screen.Header.Right>
						<Pressable
							onPress={() => {
								if (!savedId) return;
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
								toggleBookmarkAudio(savedId);
							}}
							hitSlop={8}
							accessibilityLabel={savedId && isAudioBookmarked(savedId) ? '북마크 해제' : '북마크'}
							accessibilityRole='button'
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
						>
							<Ionicons
								name={savedId && isAudioBookmarked(savedId) ? 'heart' : 'heart-outline'}
								size={22}
								color={savedId && isAudioBookmarked(savedId) ? '#F87171' : colors.tertiary}
							/>
						</Pressable>
					</Screen.Header.Right>
				</Screen.Header>
			)}

			<ScrollView
				ref={scrollRef}
				className='flex-1'
				contentContainerStyle={{ paddingBottom: 150, paddingTop: 12 }}
			>
				{hasError ? (
					<View className='items-center mt-16 gap-3'>
						<Ionicons name='alert-circle-outline' size={40} color={colors.tertiary} />
						<Text className='text-tertiary text-[15px]'>
							{retryCount >= MAX_DESCRIPTION_RETRIES
								? '잠시 후 다시 시도해 주세요'
								: '해설 생성에 실패했어요'}
						</Text>
					</View>
				) : isStreaming && displayed === '' ? (
					<View className='flex-row items-center mt-5 gap-2.5'>
						<ActivityIndicator color='#60A5FA' />
						<Text className='text-[15px] text-muted'>
							{loadingStep === 0 && '그림 찾는 중...'}
							{loadingStep === 1 && '그림 분석 중...'}
							{loadingStep === 2 && '해설 생성 중...'}
						</Text>
					</View>
				) : (
					<>
						<MarkdownBoldText
							text={displayed}
							className={cn(
								'font-pretendard-medium',
								highContrast ? 'text-black' : 'text-[#e8e8e8]',
							)}
							style={{
								fontSize: bodyFontSize,
								lineHeight: bodyFontSize * 1.9,
							}}
						/>
						{!isTyping && artworkImageUrl ? (
							<Pressable
								onPress={() => setImageModalVisible(true)}
								accessibilityLabel='작품 이미지 확대'
								accessibilityRole='button'
							>
								<Image
									source={{ uri: artworkImageUrl }}
									className='w-full rounded-xl mt-8'
									style={{ aspectRatio: 1, resizeMode: 'contain' }}
									accessibilityLabel='작품 이미지'
								/>
							</Pressable>
						) : null}
					</>
				)}
			</ScrollView>

			{/* 플레이어 항상 표시, 타이핑 중엔 비활성 */}
			<Screen.BottomAbsolute className={cn('bottom-9 pt-6 px-6', highContrast ? 'bg-white' : 'bg-bg-dark')}>
				<Pressable
					className='h-1 rounded-sm overflow-hidden bg-divider-dark'
					hitSlop={{ top: 16, bottom: 16 }}
					onLayout={(e: LayoutChangeEvent) => {
						progressWidth.current = e.nativeEvent.layout.width;
					}}
					onPress={handleProgressTap}
				>
					<View
						className='h-full rounded-sm bg-[#60A5FA]'
						style={{ width: `${progress * 100}%` }}
					/>
				</Pressable>

				<View className='flex-row justify-between mt-1 mb-2'>
					<Text className='text-[11px] text-tertiary'>{formatTime(elapsed)}</Text>
					<Text className='text-[11px] text-tertiary'>
						{duration > 0 ? formatTime(duration) : '--:--'}
					</Text>
				</View>

				<View className='flex-row items-center justify-between py-1 w-full'>
					{/* 채팅 버튼 — 해설 완료 후 표시 */}
					<View className='w-9 items-center'>
						{!isTyping && (
							<Pressable
								onPress={() =>
									router.push({ pathname: '/chat', params: { sessionId } })
								}
								hitSlop={8}
								accessibilityLabel='작품에 대해 질문하기'
								accessibilityRole='button'
								style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
							>
								<Ionicons name='chatbubble' size={26} color={colors.tertiary} />
							</Pressable>
						)}
					</View>

					{/* 플레이 버튼 */}
					<Pressable
						className={cn(
							'w-16 h-16 rounded-[32px] items-center justify-center',
							isTTSLoading || isTyping || !displayed ? 'bg-divider-dark' : 'bg-accent',
						)}
						style={({ pressed }) => ({
							transform: [
								{ scale: pressed && !(isTTSLoading || isTyping || !displayed) ? 0.93 : 1 },
							],
						})}
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
							handlePlayPause();
						}}
						disabled={isTTSLoading || isTyping || !displayed}
						accessibilityLabel={isSpeaking ? '일시정지' : '재생'}
						accessibilityRole='button'
					>
						{isTTSLoading ? (
							<ActivityIndicator color='#fff' size='small' />
						) : (
							<Ionicons name={isSpeaking ? 'pause' : 'play'} size={30} color='#fff' />
						)}
					</Pressable>

					{/* 우측: 몰입 모드 → 재생목록, 일반 모드 → 공유 */}
					<View className='w-9 items-center'>
						{!isTyping && isImmersive && (
							<Pressable
								onPress={() => router.push('/playlist')}
								hitSlop={8}
								accessibilityLabel='재생목록 보기'
								accessibilityRole='button'
								style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
							>
								<Ionicons name='list' size={28} color={colors.tertiary} />
							</Pressable>
						)}
						{!isTyping && !isImmersive && (
							<Pressable
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
									void handleShare();
								}}
								hitSlop={8}
								accessibilityLabel='작품 감상 공유'
								accessibilityRole='button'
								style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
							>
								<Ionicons name='share-outline' size={26} color={colors.tertiary} />
							</Pressable>
						)}
					</View>
				</View>
			</Screen.BottomAbsolute>

			{/* 플레이어 위 재시도 버튼 — 오류 상태에서만 표시 */}
			{hasError && retryCount < MAX_DESCRIPTION_RETRIES && (
				<View
					className='absolute left-0 right-0 items-center'
					pointerEvents='box-none'
					style={{ bottom: insets.bottom + 196, zIndex: 10 }}
				>
					<Pressable
						onPress={handleRetry}
						className='items-center gap-1.5'
						accessibilityLabel={`재시도 ${retryCount + 1}/${MAX_DESCRIPTION_RETRIES}`}
						accessibilityRole='button'
						style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
					>
						<View className='w-12 h-12 rounded-full bg-primary border border-white/10 items-center justify-center'>
							<Ionicons name='refresh' size={20} color='#60A5FA' />
						</View>
						<Text className='text-[11px] text-tertiary font-pretendard-regular'>
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
				animationType='fade'
				onRequestClose={() => setImageModalVisible(false)}
			>
				<View style={{ flex: 1, backgroundColor: 'black' }}>
					<Pressable
						onPress={() => setImageModalVisible(false)}
						hitSlop={12}
						accessibilityLabel='닫기'
						accessibilityRole='button'
						style={({ pressed }) => ({
							position: 'absolute',
							top: 56,
							right: 20,
							zIndex: 10,
							opacity: pressed ? 0.6 : 1,
						})}
					>
						<Ionicons name='close' size={28} color='white' />
					</Pressable>
					<ScrollView
						contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
						maximumZoomScale={4}
						minimumZoomScale={1}
						showsVerticalScrollIndicator={false}
						showsHorizontalScrollIndicator={false}
						centerContent
					>
						<Image
							source={{ uri: artworkImageUrl ?? '' }}
							style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
							resizeMode='contain'
							accessibilityLabel='작품 이미지 전체화면'
						/>
					</ScrollView>
				</View>
			</Modal>
		</Screen>
	);
}
