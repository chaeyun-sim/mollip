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
	Pressable,
	ScrollView,
	Text,
	View,
} from 'react-native';
import {
	Easing,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';
import { Screen } from '../../src/components/layout/Screen';
import { useTTS } from '../../src/hooks/useTTS';
import { useDescriptionStream } from '../../src/hooks/useDescriptionStream';
import { useImmersiveStore } from '../../src/store/immersiveStore';
import {
	FONT_SIZE_VALUE,
	useSettingsStore,
} from '../../src/store/settingsStore';
import { formatTime } from '../../src/utils/text';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { MarkdownBoldText } from '@/src/components/common/MarkdownBoldText';
import { cn } from '@/src/lib/cn';
import { useHistoryStore } from '@/src/store/historyStore';
import { store } from '@/src/store';
import { fetchWikidataImage } from '@/src/utils/wikidataImage';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function DescriptionScreen() {
	const router = useRouter();
	const navigation = useNavigation();
	const sessionId = useRef(Date.now().toString()).current;
	const isImmersive = useImmersiveStore((s) => s.isImmersiveMode);
	const { fontSize } = useSettingsStore();
	const bodyFontSize = FONT_SIZE_VALUE[fontSize];

	const addHistory = useHistoryStore((s) => s.add);
	const removeHistory = useHistoryStore((s) => s.remove);
	const updateHistory = useHistoryStore((s) => s.update);
	const [savedId, setSavedId] = useState<string | null>(null);

	const {
		displayed,
		isStreaming,
		hasError,
		isTyping,
		loadingStep,
		fullTextRef,
		artworkImageUrl,
		handleRetry,
	} = useDescriptionStream();

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
		seekTo,
	} = useTTS();

	// 화면을 벗어나는 모든 경로에서 재생 중인 오디오를 확실히 멈춘다
	useEffect(() => {
		const unsubscribe = navigation.addListener('beforeRemove', () => {
			stop();
		});
		return unsubscribe;
	}, [navigation, stop]);

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

	const handlePlayPause = () => {
		if (isTTSLoading || isTyping) return;
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
		<Screen edges={['top', 'bottom']}>
			{!isTyping && (
				<Screen.Header>
					<ScreenHeader.Back
						onPress={() => {
							router.back();
						}}
					/>
					<Screen.Header.Right>
						<Pressable
							onPress={() => {
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
								if (savedId) {
									removeHistory(savedId);
									setSavedId(null);
								} else {
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
							}}
							hitSlop={8}
							accessibilityLabel={savedId ? '히스토리에서 제거' : '히스토리에 저장'}
							accessibilityRole='button'
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
						>
							<Ionicons
								name={savedId ? 'heart' : 'heart-outline'}
								size={22}
								color={savedId ? '#F87171' : '#78716C'}
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
					<View className='items-center mt-16 gap-4'>
						<Ionicons name='alert-circle-outline' size={40} color='#78716C' />
						<Text className='text-[#78716C] text-[15px]'>해설 생성에 실패했어요</Text>
						<Pressable
							className='px-6 py-3 rounded-xl bg-[#1C1917]'
							onPress={handleRetry}
							style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
						>
							<Text className='font-pretendard-semibold text-[#60A5FA] text-[14px]'>
								다시 시도
							</Text>
						</Pressable>
					</View>
				) : isStreaming && displayed === '' ? (
					<View className='flex-row items-center mt-5 gap-2.5'>
						<ActivityIndicator color='#60A5FA' />
						<Text className='text-[15px] text-[#A8A29E]'>
							{loadingStep === 0 && '그림 찾는 중...'}
							{loadingStep === 1 && '그림 분석 중...'}
							{loadingStep === 2 && '해설 생성 중...'}
						</Text>
					</View>
				) : (
					<>
						<MarkdownBoldText
							text={displayed}
							className='text-[#e8e8e8] font-pretendard-medium'
							style={{
								fontSize: bodyFontSize,
								lineHeight: bodyFontSize * 1.9,
							}}
						/>
						{!isTyping && artworkImageUrl ? (
							<Image
								source={{ uri: artworkImageUrl }}
								className='w-full rounded-xl mt-8'
								style={{ aspectRatio: 1, resizeMode: 'contain' }}
								accessibilityLabel='작품 이미지'
							/>
						) : null}
					</>
				)}
			</ScrollView>

			{/* 플레이어 항상 표시, 타이핑 중엔 비활성 */}
			<Screen.BottomAbsolute className='bottom-9 pt-6 px-6 bg-[#171412]'>
				<Pressable
					className='h-1 rounded-sm overflow-hidden bg-[#292524]'
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
					<Text className='text-[11px] text-[#78716C]'>{formatTime(elapsed)}</Text>
					<Text className='text-[11px] text-[#78716C]'>
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
								<Ionicons name='chatbubble' size={26} color='#78716C' />
							</Pressable>
						)}
					</View>

					{/* 플레이 버튼 */}
					<Pressable
						className={cn(
							'w-16 h-16 rounded-[32px] items-center justify-center',
							isTTSLoading || isTyping ? 'bg-[#292524]' : 'bg-[#3B82F6]',
						)}
						style={({ pressed }) => ({
							transform: [
								{ scale: pressed && !(isTTSLoading || isTyping) ? 0.93 : 1 },
							],
						})}
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
							handlePlayPause();
						}}
						disabled={isTTSLoading || isTyping}
						accessibilityLabel={isSpeaking ? '일시정지' : '재생'}
						accessibilityRole='button'
					>
						{isTTSLoading ? (
							<ActivityIndicator color='#fff' size='small' />
						) : (
							<Ionicons name={isSpeaking ? 'pause' : 'play'} size={30} color='#fff' />
						)}
					</Pressable>

					{/* 재생목록 버튼 — 몰입 모드 전용 */}
					<View className='w-9 items-center'>
						{!isTyping && isImmersive && (
							<Pressable
								onPress={() => router.push('/playlist')}
								hitSlop={8}
								accessibilityLabel='재생목록 보기'
								accessibilityRole='button'
								style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
							>
								<Ionicons name='list' size={28} color='#78716C' />
							</Pressable>
						)}
					</View>
				</View>
			</Screen.BottomAbsolute>
		</Screen>
	);
}
