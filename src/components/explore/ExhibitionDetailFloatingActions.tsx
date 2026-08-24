import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { FloatingBackButton } from '@/src/components/common/FloatingBackButton';

interface ExhibitionDetailFloatingActionsProps {
  onBack: () => void;
  onShare: () => void;
  onBookmark: () => void;
  onRoute: () => void;
  isBookmarked: boolean;
  insetTop: number;
}

export function ExhibitionDetailFloatingActions({
  onBack,
  onShare,
  onBookmark,
  onRoute,
  isBookmarked,
  insetTop,
}: ExhibitionDetailFloatingActionsProps) {
  const bookmarkScale = useSharedValue(1);
  const bookmarkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bookmarkScale.value }],
  }));

  const routeScale = useSharedValue(1);
  const routeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: routeScale.value }],
  }));

  const shareScale = useSharedValue(1);
  const shareAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shareScale.value }],
  }));

  return (
    <View
      className='absolute flex-row justify-between w-full items-center px-5'
      style={{ top: insetTop + 16 }}
    >
      {/* 뒤로가기 버튼 */}
      <FloatingBackButton
        onPress={onBack}
        backgroundClassName='bg-white/80'
        iconColor='#1a1a1a'
        animatePress
        className=''
      />

      {/* 우측 상단 버튼 그룹 (공유 + 북마크) */}
      <View className='flex-row gap-2'>
        {/* 관람 루트 버튼 */}
        <Pressable
          onPressIn={() => {
            routeScale.value = withTiming(0.92, { duration: 100 });
          }}
          onPressOut={() => {
            routeScale.value = withTiming(1, { duration: 150 });
          }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onRoute();
          }}
          accessibilityLabel='관람 루트 보기'
          accessibilityRole='button'
          hitSlop={8}
        >
          <Animated.View
            style={routeAnimatedStyle}
            className='w-10 h-10 rounded-full bg-white/80 items-center justify-center'
          >
            <MaterialCommunityIcons
              name='map-marker-path'
              size={20}
              color='#1a1a1a'
            />
          </Animated.View>
        </Pressable>

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
            <Ionicons
              name='share-outline'
              size={20}
              color='#1a1a1a'
            />
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
    </View>
  );
}
