import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
	Easing,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Exhibition } from '@/src/data/exhibitions';

interface ImmersiveOverlayProps {
	visible: boolean;
	exhibition: Exhibition;
	onStart: () => void;
	onClose: () => void;
}

const SCRIM_DURATION = 900; // 테두리 비네트 + 배경 스크림이 천천히 깔리는 시간
const TITLE_DURATION = 650;
const EDGE_SIZE = 150;

/** explore 상세 화면 위에 라이트하게 덧입는 모달 — 다른 라우트로 이동하지 않고, 화면
 * 테두리만 서서히 어두워지는 비네트 + 옅은 black/5 스크림을 깐 다음 중앙에 전시 제목이
 * 천천히 fade-in 된다. 닫을 때는 역순(제목 fade-out → 비네트/스크림 fade-out). */
export function ImmersiveOverlay({
	visible,
	exhibition,
	onStart,
	onClose,
}: ImmersiveOverlayProps) {
	const insets = useSafeAreaInsets();
	const [mounted, setMounted] = useState(visible);
	const scrimOpacity = useSharedValue(0);
	const titleOpacity = useSharedValue(0);
	const titleY = useSharedValue(10);
	const blackoutOpacity = useSharedValue(0);

	useEffect(() => {
		if (visible) {
			setMounted(true);
			scrimOpacity.value = withTiming(1, {
				duration: SCRIM_DURATION,
				easing: Easing.out(Easing.cubic),
			});
			titleOpacity.value = withDelay(
				SCRIM_DURATION * 0.45,
				withTiming(1, { duration: TITLE_DURATION }),
			);
			titleY.value = withDelay(
				SCRIM_DURATION * 0.45,
				withTiming(0, {
					duration: TITLE_DURATION,
					easing: Easing.out(Easing.cubic),
				}),
			);
		} else {
			titleOpacity.value = withTiming(0, { duration: TITLE_DURATION * 0.5 });
			titleY.value = withTiming(10, { duration: TITLE_DURATION * 0.5 });
			scrimOpacity.value = withDelay(
				TITLE_DURATION * 0.5,
				withTiming(0, { duration: SCRIM_DURATION * 0.6 }, (finished) => {
					if (finished) runOnJS(setMounted)(false);
				}),
			);
		}
	}, [visible]);

	const scrimStyle = useAnimatedStyle(() => ({ opacity: scrimOpacity.value }));
	const titleStyle = useAnimatedStyle(() => ({
		opacity: titleOpacity.value,
		transform: [{ translateY: titleY.value }],
	}));
	const blackoutStyle = useAnimatedStyle(() => ({
		opacity: blackoutOpacity.value,
	}));

	// 시작하기 — 제목/버튼 fade out 후 배경 전체가 검은색으로 fade, 다 어두워지면 라우팅.
	const handleStartPress = () => {
		titleOpacity.value = withTiming(0, { duration: 250 });
		blackoutOpacity.value = withTiming(
			1,
			{ duration: 480, easing: Easing.inOut(Easing.ease) },
			(finished) => {
				if (finished) runOnJS(onStart)();
			},
		);
	};

	if (!mounted) return null;

	return (
		<View
			style={StyleSheet.absoluteFill}
			pointerEvents={visible ? 'auto' : 'none'}
		>
			{/* 배경 전체 — black/60 스크림, explore 화면이 어둡게 비쳐 보인다 */}
			<Animated.View
				style={[
					StyleSheet.absoluteFill,
					{ backgroundColor: 'rgba(0,0,0,0.6)' },
					scrimStyle,
				]}
			/>

			{/* 테두리 비네트 — 네 변만 살짝 더 어둡게 */}
			<Animated.View style={[styles.edgeTop, scrimStyle]} pointerEvents='none'>
				<LinearGradient
					colors={['rgba(0,0,0,0.8)', 'transparent']}
					style={{ flex: 1 }}
				/>
			</Animated.View>
			<Animated.View style={[styles.edgeBottom, scrimStyle]} pointerEvents='none'>
				<LinearGradient
					colors={['transparent', 'rgba(0,0,0,0.8)']}
					style={{ flex: 1 }}
				/>
			</Animated.View>
			<Animated.View style={[styles.edgeLeft, scrimStyle]} pointerEvents='none'>
				<LinearGradient
					colors={['rgba(0,0,0,0.8)', 'transparent']}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 0 }}
					style={{ flex: 1 }}
				/>
			</Animated.View>
			<Animated.View style={[styles.edgeRight, scrimStyle]} pointerEvents='none'>
				<LinearGradient
					colors={['transparent', 'rgba(0,0,0,0.8)']}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 0 }}
					style={{ flex: 1 }}
				/>
			</Animated.View>

			{/* 중앙 전시 제목 + 시작하기 */}
			<View
				className='flex-1 items-center justify-center px-10'
				pointerEvents='box-none'
			>
				<Animated.View style={titleStyle} className='items-center'>
					<Text
						className='text-white font-hahmlet-bold text-center text-[30px] leading-snug'
						numberOfLines={3}
						style={{
							textShadowColor: 'rgba(0,0,0,0.55)',
							textShadowOffset: { width: 0, height: 2 },
							textShadowRadius: 12,
						}}
					>
						{exhibition.title}
					</Text>
					<Pressable
						onPress={handleStartPress}
						className='mt-8 rounded-full px-6 py-3 bg-white/15 border-[1.5px] border-white/35'
						accessibilityRole='button'
						accessibilityLabel='시작하기'
					>
						<Text className='text-white font-pretendard-semibold text-[15px]'>
							셀프 가이드 시작하기
						</Text>
					</Pressable>
				</Animated.View>
			</View>

			{/* 닫기 버튼 */}
			<Animated.View
				style={[
					{ position: 'absolute', left: 20, top: insets.top + 16 },
					titleStyle,
				]}
			>
				<Pressable
					onPress={onClose}
					hitSlop={8}
					className='w-9 h-9 rounded-full items-center justify-center bg-white/10'
					accessibilityRole='button'
					accessibilityLabel='닫기'
				>
					<Ionicons name='close' size={18} color='rgba(255,255,255,0.85)' />
				</Pressable>
			</Animated.View>

			{/* 시작하기 전환 — 배경 전체를 검은색으로 fade */}
			<Animated.View
				style={[
					StyleSheet.absoluteFill,
					{ backgroundColor: '#000' },
					blackoutStyle,
				]}
				pointerEvents='none'
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	edgeTop: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		height: EDGE_SIZE,
	},
	edgeBottom: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		height: EDGE_SIZE,
	},
	edgeLeft: {
		position: 'absolute',
		top: 0,
		bottom: 0,
		left: 0,
		width: EDGE_SIZE,
	},
	edgeRight: {
		position: 'absolute',
		top: 0,
		bottom: 0,
		right: 0,
		width: EDGE_SIZE,
	},
});
