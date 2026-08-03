import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Dimensions,
	GestureResponderEvent,
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
import { DESCRIPTION_PROMPT } from '../../src/constants/prompts';
import { useTTS } from '../../src/hooks/useTTS';
import { store } from '../../src/store';
import { useImmersiveStore } from '../../src/store/immersiveStore';
import { todayKey, useVisitStore } from '../../src/store/visitStore';
import {
	FONT_SIZE_VALUE,
	useSettingsStore,
} from '../../src/store/settingsStore';
import {
	streamDescription,
	streamDescriptionFromImage,
} from '../../src/utils/api';
import { formatTime } from '../../src/utils/text';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { cn } from '@/src/lib/cn';

const CHAR_INTERVAL_MS = 25;

// **bold** 파싱 → Text 컴포넌트 배열
function BoldText({
	text,
	style,
	className,
}: {
	text: string;
	style: object;
	className: string;
}) {
	const parts = text.split(/\*\*(.+?)\*\*/g);
	return (
		<Text style={style} className={className}>
			{parts.map((part, i) =>
				i % 2 === 1 ? (
					<Text key={i} className='font-pretendard-bold'>
						{part}
					</Text>
				) : (
					part
				),
			)}
		</Text>
	);
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function DescriptionScreen() {
	const router = useRouter();
	const navigation = useNavigation();
	const sessionId = useRef(Date.now().toString()).current;
	const isImmersive = useImmersiveStore((s) => s.isImmersiveMode);
	const addToPlaylist = useImmersiveStore((s) => s.addToPlaylist);
	const { fontSize } = useSettingsStore();
	const bodyFontSize = FONT_SIZE_VALUE[fontSize];
	const [displayed, setDisplayed] = useState('');
	const [isStreaming, setIsStreaming] = useState(true);
	const [hasError, setHasError] = useState(false);
	const [retryCount, setRetryCount] = useState(0);
	const [loadingStep, setLoadingStep] = useState(0);

	// 인디케이터 progress bar
	const barTranslate = useSharedValue(-SCREEN_WIDTH);
	// 0: 그림 찾는 중, 1: 그림 분석 중, 2: 해설 생성 중
	const scrollRef = useRef<ScrollView>(null);
	const progressWidth = useRef(0);
	const bufferRef = useRef('');
	const fullTextRef = useRef('');
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const mountedRef = useRef(true);
	const savedToPlaylistRef = useRef(false);
	const savedToVisitRef = useRef(false);
	const recordListened = useVisitStore((s) => s.recordListened);

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

	// 화면을 벗어나는 모든 경로(헤더 버튼, 스와이프 제스처, 하드웨어 back)에서 재생 중인
	// 오디오를 확실히 멈춘다 — 헤더 버튼 onPress에만 stop()을 걸어두면 제스처로 나갈 때 놓친다.
	useEffect(() => {
		const unsubscribe = navigation.addListener('beforeRemove', () => {
			stop();
		});
		return unsubscribe;
	}, [navigation, stop]);

	// 로딩 단계 자동 진행 (5초, 10초)
	useEffect(() => {
		const t1 = setTimeout(() => {
			if (mountedRef.current) setLoadingStep(1);
		}, 5000);
		const t2 = setTimeout(() => {
			if (mountedRef.current) setLoadingStep(2);
		}, 10000);
		return () => {
			clearTimeout(t1);
			clearTimeout(t2);
		};
	}, []);

	useEffect(() => {
		mountedRef.current = true;
		timerRef.current = setInterval(() => {
			if (!mountedRef.current || bufferRef.current.length === 0) return;
			const char = bufferRef.current[0];
			bufferRef.current = bufferRef.current.slice(1);
			setDisplayed((prev) => prev + char);
		}, CHAR_INTERVAL_MS);

		return () => {
			mountedRef.current = false;
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, []);

	useEffect(() => {
		// 재생목록에서 진입한 경우 — store에 미리 채워진 해설 사용 (API 호출 없음)
		if (!fullTextRef.current && store.artworkDescription) {
			fullTextRef.current = store.artworkDescription;
			store.artworkDescription = '';
		}

		if (fullTextRef.current) {
			setDisplayed(fullTextRef.current);
			setIsStreaming(false);
			return;
		}

		setHasError(false);
		setIsStreaming(true);

		let cancelled = false;
		const run = async () => {
			try {
				const gen =
					store.inputMode === 'manual'
						? streamDescription(
								`${DESCRIPTION_PROMPT}작품명: ${store.manualTitle}\n작가명: ${store.manualArtist}`,
							)
						: streamDescriptionFromImage(
								store.imageBase64,
								store.imageMediaType,
								DESCRIPTION_PROMPT,
							);
				for await (const chunk of gen) {
					if (cancelled || !mountedRef.current) break;
					bufferRef.current += chunk;
					fullTextRef.current += chunk;
				}
			} catch (e) {
				if (!cancelled && mountedRef.current) {
					setHasError(true);
				}
			} finally {
				if (!cancelled && mountedRef.current) {
					store.artworkDescription = fullTextRef.current;
					setIsStreaming(false);
				}
			}
		};
		run();
		return () => {
			cancelled = true;
		};
	}, [retryCount]);

	const handleRetry = () => {
		bufferRef.current = '';
		fullTextRef.current = '';
		setDisplayed('');
		setLoadingStep(0);
		setRetryCount((c) => c + 1);
	};

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
	const isTyping = isStreaming || bufferRef.current.length > 0;

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

	useEffect(() => {
		if (!isTyping && fullTextRef.current) {
			preload(fullTextRef.current);
		}
	}, [isTyping]);

	// 스트리밍 완료(성공/실패 무관) 시 재생목록에 저장 (몰입 모드 전용, 중복 방지)
	useEffect(() => {
		if (!isTyping && isImmersive && !savedToPlaylistRef.current) {
			savedToPlaylistRef.current = true;
			addToPlaylist({
				title: store.inputMode === 'manual' ? store.manualTitle : '촬영한 작품',
				imageUrl: store.artworkImageUrl || undefined,
				description: fullTextRef.current || '해설 생성에 실패했어요.',
			});
		}
	}, [isTyping]);

	// 해설 생성 성공 시 관람 다이어리용 들은 기록 저장 (모드 무관, 중복 방지)
	useEffect(() => {
		if (!isTyping && fullTextRef.current && !savedToVisitRef.current) {
			savedToVisitRef.current = true;
			recordListened(todayKey(), {
				title: store.inputMode === 'manual' ? store.manualTitle : '촬영한 작품',
				imageUrl: store.artworkImageUrl || undefined,
				descriptionPreview: fullTextRef.current
					? fullTextRef.current.replace(/\s+/g, ' ').trim().slice(0, 280)
					: undefined,
			});
		}
	}, [isTyping]);

	return (
		<Screen edges={['top', 'bottom']}>
			{!isTyping && (
				<Screen.Header>
					<ScreenHeader.Back
						onPress={() => {
							router.back();
						}}
					/>
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
					<BoldText
						text={displayed}
						className='text-[#e8e8e8] font-pretendard-medium'
						style={{
							fontSize: bodyFontSize,
							lineHeight: bodyFontSize * 1.9,
						}}
					/>
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
								onPress={() => router.push({ pathname: '/chat', params: { sessionId } })}
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
