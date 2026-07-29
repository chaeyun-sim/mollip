import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withSpring,
	withTiming,
} from 'react-native-reanimated';

import type { Exhibition } from '@/src/data/exhibitions';

interface ImmersiveEntryProps {
	exhibition: Exhibition;
	onStart: () => void;
	onClose: () => void;
}

// ─── Aurora Overlay ───────────────────────────────────────────────────────────

function AuroraOverlay() {
	const a1 = useSharedValue(0);
	const a2 = useSharedValue(0);
	const a3 = useSharedValue(0);
	const a4 = useSharedValue(0);
	const a5 = useSharedValue(0);

	useEffect(() => {
		// 각 레이어마다 다른 속도 + 시작 딜레이로 완전히 비동기 느낌
		a1.value = withRepeat(
			withTiming(1, { duration: 11000, easing: Easing.inOut(Easing.ease) }),
			-1,
			true,
		);
		a2.value = withDelay(
			800,
			withRepeat(
				withTiming(1, { duration: 8500, easing: Easing.inOut(Easing.ease) }),
				-1,
				true,
			),
		);
		a3.value = withDelay(
			1600,
			withRepeat(
				withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.ease) }),
				-1,
				true,
			),
		);
		a4.value = withDelay(
			400,
			withRepeat(
				withTiming(1, { duration: 7500, easing: Easing.inOut(Easing.ease) }),
				-1,
				true,
			),
		);
		a5.value = withDelay(
			1200,
			withRepeat(
				withTiming(1, { duration: 12500, easing: Easing.inOut(Easing.ease) }),
				-1,
				true,
			),
		);
	}, []);

	// 네온 바이올렛 — 좌상에서 우하로 대각선 횡단
	const g1Style = useAnimatedStyle(() => ({
		opacity: 0.2 + a1.value * 0.12,
		transform: [
			{ translateX: -120 + a1.value * 220 },
			{ translateY: -80 + a1.value * 140 },
		],
	}));
	// 일렉트릭 시안 — 우측에서 좌하로
	const g2Style = useAnimatedStyle(() => ({
		opacity: 0.18 + a2.value * 0.14,
		transform: [
			{ translateX: 140 + a2.value * -240 },
			{ translateY: 60 + a2.value * -120 },
		],
	}));
	// 네온 핑크 — 하단에서 상단으로 솟구침
	const g3Style = useAnimatedStyle(() => ({
		opacity: 0.16 + a3.value * 0.13,
		transform: [
			{ translateX: -60 + a3.value * 130 },
			{ translateY: 160 + a3.value * -260 },
		],
	}));
	// 골드 앰버 — 우하에서 좌상으로
	const g4Style = useAnimatedStyle(() => ({
		opacity: 0.14 + a4.value * 0.1,
		transform: [
			{ translateX: 80 + a4.value * -160 },
			{ translateY: 100 + a4.value * -180 },
		],
	}));
	// 라임 그린 — 좌하에서 우상으로
	const g5Style = useAnimatedStyle(() => ({
		opacity: 0.13 + a5.value * 0.11,
		transform: [
			{ translateX: -100 + a5.value * 180 },
			{ translateY: 120 + a5.value * -200 },
		],
	}));

	return (
		<View style={StyleSheet.absoluteFill}>
			{/* 베이스 블랙 */}
			<View
				style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.84)' }]}
			/>

			{/* 바이올렛 blob — 좌상단 */}
			<Animated.View
				style={[
					{
						position: 'absolute',
						width: 520,
						height: 420,
						borderRadius: 260,
						overflow: 'hidden',
						left: -120,
						top: -60,
					},
					g1Style,
				]}
			>
				<LinearGradient
					colors={['transparent', '#8B00FF', '#5B00D4', 'transparent']}
					start={{ x: 0.1, y: 0.1 }}
					end={{ x: 0.9, y: 0.9 }}
					style={{ flex: 1 }}
				/>
			</Animated.View>

			{/* 시안 blob — 우측 */}
			<Animated.View
				style={[
					{
						position: 'absolute',
						width: 400,
						height: 520,
						borderRadius: 260,
						overflow: 'hidden',
						right: -80,
						top: 80,
					},
					g2Style,
				]}
			>
				<LinearGradient
					colors={['transparent', '#00E5FF', '#00C896', 'transparent']}
					start={{ x: 0.8, y: 0.1 }}
					end={{ x: 0.1, y: 0.9 }}
					style={{ flex: 1 }}
				/>
			</Animated.View>

			{/* 핑크 blob — 하단 */}
			<Animated.View
				style={[
					{
						position: 'absolute',
						width: 460,
						height: 380,
						borderRadius: 230,
						overflow: 'hidden',
						left: -20,
						bottom: -60,
					},
					g3Style,
				]}
			>
				<LinearGradient
					colors={['transparent', '#FF0090', '#CC00CC', 'transparent']}
					start={{ x: 0.2, y: 0.9 }}
					end={{ x: 0.8, y: 0.1 }}
					style={{ flex: 1 }}
				/>
			</Animated.View>

			{/* 골드 blob — 우상단 */}
			<Animated.View
				style={[
					{
						position: 'absolute',
						width: 380,
						height: 400,
						borderRadius: 200,
						overflow: 'hidden',
						right: -40,
						top: -80,
					},
					g4Style,
				]}
			>
				<LinearGradient
					colors={['transparent', '#FFD000', '#FF6B00', 'transparent']}
					start={{ x: 0.8, y: 0.2 }}
					end={{ x: 0.2, y: 0.8 }}
					style={{ flex: 1 }}
				/>
			</Animated.View>

			{/* 라임 blob — 좌하단 */}
			<Animated.View
				style={[
					{
						position: 'absolute',
						width: 420,
						height: 360,
						borderRadius: 210,
						overflow: 'hidden',
						left: -80,
						bottom: 60,
					},
					g5Style,
				]}
			>
				<LinearGradient
					colors={['transparent', '#A8FF00', '#00FFB0', 'transparent']}
					start={{ x: 0.1, y: 0.8 }}
					end={{ x: 0.9, y: 0.2 }}
					style={{ flex: 1 }}
				/>
			</Animated.View>
		</View>
	);
}

// ─── Immersive Entry ────────────────────────────────────────────────────────
// 몰입 진입 화면 콘텐츠 — 전용 라우트(app/(guide)/immersive/[id].tsx)와 explore 상세
// 화면의 인앱 오버레이(src/components/explore/ImmersiveOverlay.tsx) 양쪽에서 공유한다.

export function ImmersiveEntry({ exhibition, onStart, onClose }: ImmersiveEntryProps) {
	const titleOpacity = useSharedValue(0);
	const titleY = useSharedValue(28);
	const ctaOpacity = useSharedValue(0);
	const closeBtnOpacity = useSharedValue(0);

	useEffect(() => {
		titleOpacity.value = withTiming(1, { duration: 500 });
		titleY.value = withSpring(0, { damping: 15, stiffness: 100 });
		ctaOpacity.value = withDelay(280, withTiming(1, { duration: 400 }));
		closeBtnOpacity.value = withDelay(150, withTiming(1, { duration: 300 }));
	}, []);

	const titleStyle = useAnimatedStyle(() => ({
		opacity: titleOpacity.value,
		transform: [{ translateY: titleY.value }],
	}));
	const ctaStyle = useAnimatedStyle(() => ({ opacity: ctaOpacity.value }));
	const closeBtnStyle = useAnimatedStyle(() => ({
		opacity: closeBtnOpacity.value,
	}));

	return (
		<View className='flex-1' style={{ backgroundColor: exhibition.posterColor }}>
			<AuroraOverlay />

			{/* 닫기 버튼 */}
			<Animated.View
				style={closeBtnStyle}
				className='absolute top-[58px] left-6 z-10'
			>
				<Pressable
					onPress={() =>
						Alert.alert('전시 관람 종료', '재생목록이 초기화됩니다.', [
							{ text: '취소', style: 'cancel' },
							{ text: '종료', style: 'destructive', onPress: onClose },
						])
					}
					className='w-10 h-10 rounded-full items-center justify-center bg-white/10 border border-[rgba(255,255,255,0.18)]'
					hitSlop={8}
				>
					<Ionicons name='close' size={18} color='rgba(255,255,255,0.75)' />
				</Pressable>
			</Animated.View>

			{/* 중앙 콘텐츠 */}
			<View className='flex-1 items-center justify-center px-8'>
				<Animated.View style={titleStyle} className='items-center'>
					<Text className='text-white/40 font-pretendard-bold tracking-widest uppercase mb-6 text-md'>
						셀프 오디오 투어
					</Text>
					<Text className='font-hahmlet-bold text-white text-center mb-3 text-[40px] leading-[42px]'>
						{exhibition.title}
					</Text>
					<Text className='text-white/45 font-pretendard-regular text-center text-sm mt-3'>
						{exhibition.venue}
						{'  ·  '}
						{exhibition.startDate} – {exhibition.endDate}
					</Text>
				</Animated.View>
			</View>

			{/* 하단 CTA */}
			<Animated.View style={ctaStyle} className='pb-[54px] px-8'>
				<Pressable
					onPress={onStart}
					className='rounded-2xl items-center py-4 bg-white/[0.13] border-white/20 border-[1.5px]'
				>
					<Text className='text-white font-pretendard-semibold text-[17px]'>
						시작하기
					</Text>
				</Pressable>
			</Animated.View>
		</View>
	);
}
