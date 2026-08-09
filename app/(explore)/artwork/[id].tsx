import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import {
	SafeAreaView,
	useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { getArtwork } from '@/src/data/exhibitions';
import { store } from '@/src/store';
import { useChatStore } from '@/src/store/chatStore';
import { Screen } from '@/src/components/layout/Screen';
import { EmptyImagePlaceholder } from '@/src/components/common/EmptyImagePlaceholder';

export default function ArtworkDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const insets = useSafeAreaInsets();

	const result = getArtwork(id);

	const backScale = useSharedValue(1);
	const backAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: backScale.value }],
	}));

	const ctaScale = useSharedValue(1);
	const ctaAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: ctaScale.value }],
	}));

	// 꾹 누르기 — 작품 원본 보기
	const previewProgress = useSharedValue(0);

	const coverImageStyle = useAnimatedStyle(() => ({
		opacity: 1 - previewProgress.value,
	}));

	const containImageStyle = useAnimatedStyle(() => ({
		opacity: previewProgress.value,
	}));

	const uiStyle = useAnimatedStyle(() => ({
		opacity: 1 - previewProgress.value,
	}));

	const handleLongPress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		previewProgress.value = withTiming(1, { duration: 300 });
	};

	const handleRelease = () => {
		previewProgress.value = withTiming(0, { duration: 200 });
	};

	if (!result) {
		return (
			<Screen className='flex-1 items-center justify-center bg-black'>
				<Text className='text-white/50 text-base font-pretendard-regular mb-4'>
					작품을 찾을 수 없어요
				</Text>
				<Pressable onPress={() => router.back()}>
					<Text className='text-white text-sm font-pretendard-medium underline'>
						돌아가기
					</Text>
				</Pressable>
			</Screen>
		);
	}

	const { artwork } = result;

	const handleStartGuide = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		store.inputMode = 'manual';
		store.manualTitle = artwork.title;
		store.manualArtist = artwork.artist;
		store.extractedText = `작품명: ${artwork.title}\n작가명: ${artwork.artist}`;
		store.artworkDescription = '';
		useChatStore.getState().clear();
		router.push('/(guide)/description');
	};

	return (
		<Pressable
			className='flex-1 bg-black'
			onLongPress={handleLongPress}
			onPressOut={handleRelease}
			delayLongPress={400}
		>
			{artwork.imageSource ? (
				<>
					{/* Cover 이미지 (기본) */}
					<Animated.View className='absolute w-full h-full' style={coverImageStyle}>
						<Image
							source={artwork.imageSource}
							className='w-full h-full'
							resizeMode='cover'
						/>
					</Animated.View>

					{/* Contain 이미지 (꾹 누를 때) */}
					<Animated.View
						className='absolute w-full h-full'
						style={containImageStyle}
					>
						<Image
							source={artwork.imageSource}
							className='w-full h-full'
							resizeMode='contain'
						/>
					</Animated.View>
				</>
			) : (
				<EmptyImagePlaceholder
					className='absolute w-full h-full items-center justify-center bg-[#E5E1D8]'
					iconSize={160}
				/>
			)}

			{/* 다크 오버레이 + 텍스트 UI */}
			<Animated.View className='absolute w-full h-full' style={uiStyle}>
				<View className='absolute w-full h-full bg-black/42' />

				{/* 작품 정보 — 하단 오버레이 */}
				<View className='absolute left-7 right-7 bottom-[120px]'>
					{/* 소장처 뱃지 */}
					{artwork.collection && (
						<View className='self-start flex-row items-center gap-1.5 rounded-full px-3 py-1 mb-3.5 bg-white/15'>
							<Ionicons
								name='location-outline'
								size={12}
								color='rgba(255,255,255,0.7)'
							/>
							<Text className='text-[11px] text-white/70 font-pretendard-medium tracking-wide'>
								{artwork.collection}
								{artwork.collectionCity ? `  ·  ${artwork.collectionCity}` : ''}
							</Text>
						</View>
					)}

					{/* 작품 제목 */}
					<Text className='text-white text-[32px] leading-[40px] mb-2 font-hahmlet-bold'>
						{artwork.title}
					</Text>

					{/* 작가 · 연도 · 재료 */}
					<View className='flex-row items-center flex-wrap gap-1.5'>
						<Text className='text-white/65 text-[15px] font-pretendard-regular'>
							{artwork.artist}
						</Text>
						{artwork.year && (
							<>
								<Text className='text-white/30 text-[14px]'>·</Text>
								<Text className='text-white/50 text-[14px] font-pretendard-light'>
									{artwork.year}
								</Text>
							</>
						)}
						{artwork.medium && (
							<>
								<Text className='text-white/30 text-[14px]'>·</Text>
								<Text className='text-white/45 text-[13px] font-pretendard-light'>
									{artwork.medium}
								</Text>
							</>
						)}
					</View>

					{/* 구분선 */}
					<View className='flex-row items-center gap-2.5 mt-5'>
						<View className='flex-1 h-[0.5px] bg-white/20' />
						<Ionicons name='sparkles' size={11} color='rgba(255,255,255,0.35)' />
						<View className='flex-1 h-[0.5px] bg-white/20' />
					</View>
				</View>
			</Animated.View>

			{/* 뒤로가기 버튼 (항상 표시) */}
			<Pressable
				onPressIn={() => {
					backScale.value = withTiming(0.92, { duration: 100 });
				}}
				onPressOut={() => {
					backScale.value = withTiming(1, { duration: 150 });
				}}
				onPress={() => router.back()}
				className='absolute left-5'
				style={{ top: insets.top + 16 }}
				accessibilityLabel='뒤로가기'
				accessibilityRole='button'
				hitSlop={8}
			>
				<Animated.View
					className='w-10 h-10 rounded-full items-center justify-center bg-white/15'
					style={backAnimatedStyle}
				>
					<Ionicons name='chevron-back' size={22} color='rgba(255,255,255,0.9)' />
				</Animated.View>
			</Pressable>

			{/* 하단 CTA */}
			<Screen.BottomAbsolute className='-bottom-5'>
				<SafeAreaView edges={['bottom']}>
					<Pressable
						onPressIn={() => {
							ctaScale.value = withTiming(0.97, { duration: 100 });
						}}
						onPressOut={() => {
							ctaScale.value = withTiming(1, { duration: 150 });
						}}
						onPress={handleStartGuide}
						accessibilityLabel='이 작품 해설 듣기'
						accessibilityRole='button'
					>
						<Animated.View
							className='flex-row items-center justify-center mx-5 my-3 rounded-[18px] py-[18px] gap-2.5 bg-white/15 border-[0.5px] border-white/25'
							style={[ctaAnimatedStyle, uiStyle]}
						>
							<Ionicons name='headset-outline' size={20} color='white' />
							<Text className='text-white text-[16px] font-pretendard-semibold'>
								이 작품 해설 듣기
							</Text>
						</Animated.View>
					</Pressable>
				</SafeAreaView>
			</Screen.BottomAbsolute>
		</Pressable>
	);
}
