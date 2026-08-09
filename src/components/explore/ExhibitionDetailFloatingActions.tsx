import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface ExhibitionDetailFloatingActionsProps {
	onBack: () => void;
	onShare: () => void;
	onBookmark: () => void;
	isBookmarked: boolean;
	insetTop: number;
}

export function ExhibitionDetailFloatingActions({
	onBack,
	onShare,
	onBookmark,
	isBookmarked,
	insetTop,
}: ExhibitionDetailFloatingActionsProps) {
	const backScale = useSharedValue(1);
	const backAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: backScale.value }],
	}));

	const bookmarkScale = useSharedValue(1);
	const bookmarkAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: bookmarkScale.value }],
	}));

	const shareScale = useSharedValue(1);
	const shareAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: shareScale.value }],
	}));

	return (
		<>
			{/* 뒤로가기 버튼 */}
			<Pressable
				onPressIn={() => {
					backScale.value = withTiming(0.92, { duration: 100 });
				}}
				onPressOut={() => {
					backScale.value = withTiming(1, { duration: 150 });
				}}
				onPress={onBack}
				className='absolute left-5'
				style={{ top: insetTop + 16 }}
				accessibilityLabel='뒤로가기'
				accessibilityRole='button'
				hitSlop={8}
			>
				<Animated.View
					style={backAnimatedStyle}
					className='w-10 h-10 rounded-full bg-white/80 items-center justify-center'
				>
					<Ionicons name='chevron-back' size={22} color='#1a1a1a' />
				</Animated.View>
			</Pressable>

			{/* 우측 상단 버튼 그룹 (공유 + 북마크) */}
			<View
				className='absolute right-5 flex-row gap-2'
				style={{ top: insetTop + 16 }}
			>
				{/* 공유 버튼 */}
				<Pressable
					onPressIn={() => {
						shareScale.value = withTiming(0.92, { duration: 100 });
					}}
					onPressOut={() => {
						shareScale.value = withTiming(1, { duration: 150 });
					}}
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
						onShare();
					}}
					accessibilityLabel='공유하기'
					accessibilityRole='button'
					hitSlop={8}
				>
					<Animated.View
						style={shareAnimatedStyle}
						className='w-10 h-10 rounded-full bg-white/80 items-center justify-center'
					>
						<Ionicons name='share-outline' size={20} color='#1a1a1a' />
					</Animated.View>
				</Pressable>

				{/* 북마크 버튼 */}
				<Pressable
					onPressIn={() => {
						bookmarkScale.value = withTiming(0.92, { duration: 100 });
					}}
					onPressOut={() => {
						bookmarkScale.value = withTiming(1, { duration: 150 });
					}}
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
						onBookmark();
					}}
					accessibilityLabel='북마크'
					accessibilityRole='button'
					hitSlop={8}
				>
					<Animated.View
						style={bookmarkAnimatedStyle}
						className='w-10 h-10 rounded-full bg-white/80 items-center justify-center'
					>
						<Ionicons
							name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
							size={20}
							color={isBookmarked ? '#111827' : '#1a1a1a'}
						/>
					</Animated.View>
				</Pressable>
			</View>
		</>
	);
}
