import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
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
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';
import { Screen } from '../src/components/layout/Screen';
import { DESCRIPTION_PROMPT } from '../src/constants/prompts';
import { useTTS } from '../src/hooks/useTTS';
import { store } from '../src/store';
import { FONT_SIZE_VALUE, useSettingsStore } from '../src/store/settingsStore';
import {
	streamDescription,
	streamDescriptionFromImage,
} from '../src/utils/api';
import { formatTime } from '../src/utils/text';
import { ScreenHeader } from '../src/components/layout/ScreenHeader';
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
	const { fontSize } = useSettingsStore();
	const bodyFontSize = FONT_SIZE_VALUE[fontSize];
	const [displayed, setDisplayed] = useState('');
	const [isStreaming, setIsStreaming] = useState(true);
	const [hasError, setHasError] = useState(false);
	const [retryCount, setRetryCount] = useState(0);
	const [loadingStep, setLoadingStep] = useState(0);

	// 인디케이터 progress bar
	const barTranslate = useSharedValue(-SCREEN_WIDTH);
	const barAnimStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: barTranslate.value }],
	}));
	// 0: 그림 찾는 중, 1: 그림 분석 중, 2: 해설 생성 중
	const scrollRef = useRef<ScrollView>(null);
	const progressWidth = useRef(0);
	const bufferRef = useRef('');
	const fullTextRef = useRef('');
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const mountedRef = useRef(true);

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
					console.log(e);
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

	return (
		<Screen>
			{!isTyping && (
				<Screen.Header>
					<ScreenHeader.Back
						onPress={() => {
							stop();
							router.back();
						}}
					/>
					<ScreenHeader.Right className='mt-1'>
						<Pressable
							onPress={() => router.push('/chat')}
							hitSlop={8}
							accessibilityLabel='작품에 대해 질문하기'
							accessibilityRole='button'
							style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
						>
							<Ionicons name='chatbox' size={20} color='#60A5FA' />
						</Pressable>
					</ScreenHeader.Right>
				</Screen.Header>
			)}

			<ScrollView
				ref={scrollRef}
				className='flex-1'
				contentContainerStyle={{ paddingBottom: 40, paddingTop: 12 }}
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
					<View className='flex-row items-center mt-5 gap-[10px]'>
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
			<Screen.Bottom>
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

				<View className='flex-row items-center justify-center py-1'>
					<Pressable
						style={({ pressed }) => ({
							width: 64,
							height: 64,
							borderRadius: 32,
							alignItems: 'center',
							justifyContent: 'center',
							backgroundColor: isTTSLoading || isTyping ? '#292524' : '#3B82F6',
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
				</View>
			</Screen.Bottom>
		</Screen>
	);
}
