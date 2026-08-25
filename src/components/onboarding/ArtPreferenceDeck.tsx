import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import {
	OnboardingSwipeCard,
	ONBOARDING_CARD_HEIGHT,
	type OnboardingArtItem,
} from '@/src/components/onboarding/OnboardingSwipeCard';
import { colors } from '@/src/constants/colors';
import { cn } from '@/src/lib/cn';

interface ArtPreferenceDeckProps {
	cards: OnboardingArtItem[];
	totalCount: number;
	onSwipeLeft: () => void;
	onSwipeRight: () => void;
	isPreviouslyLiked?: (item: OnboardingArtItem) => boolean;
}

/** 진행 상태 바 + 스와이프 카드 스택 + 패스/선택 버튼. 온보딩과 취향 재설정 화면이 공유한다. */
export function ArtPreferenceDeck({
	cards,
	totalCount,
	onSwipeLeft,
	onSwipeRight,
	isPreviouslyLiked,
}: ArtPreferenceDeckProps) {
	const totalSwiped = totalCount - cards.length;

	return (
		<>
			{/* 진행 상태 */}
			<View className='flex-row gap-1.5 px-6 py-3'>
				{Array.from({ length: totalCount }).map((_, i) => (
					<View
						key={i}
						className={cn('h-1 flex-1 rounded-full', i < totalSwiped ? 'bg-primary' : 'bg-divider')}
					/>
				))}
			</View>

			{/* 카드 스택 */}
			<View className='flex-1 items-center pt-6 px-6'>
				<View className='w-full' style={{ height: ONBOARDING_CARD_HEIGHT }}>
					{cards
						.slice(0, 3)
						.reverse()
						.map((item, reversedIndex) => {
							const index = Math.min(cards.slice(0, 3).length - 1 - reversedIndex, 2);
							return (
								<OnboardingSwipeCard
									key={item.id}
									item={item}
									index={index}
									isTop={index === 0}
									onSwipeLeft={onSwipeLeft}
									onSwipeRight={onSwipeRight}
									isPreviouslyLiked={isPreviouslyLiked?.(item)}
								/>
							);
						})}
				</View>
			</View>

			{/* 하단 버튼 */}
			<View className='flex-row justify-center items-center gap-6 pb-10 pt-2'>
				<Pressable
					onPress={onSwipeLeft}
					accessibilityRole='button'
					accessibilityLabel='패스'
					className='items-center gap-1.5'
				>
					<View
						className='w-16 h-16 rounded-full bg-white items-center justify-center'
						style={{
							shadowColor: colors.errorAlt,
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.2,
							shadowRadius: 12,
							elevation: 6,
						}}
					>
						<Ionicons name='close' size={28} className='text-error-alt' />
					</View>
					<Text className='text-description text-xs font-pretendard-regular'>패스</Text>
				</Pressable>

				<Pressable
					onPress={onSwipeRight}
					accessibilityRole='button'
					accessibilityLabel='선택'
					className='items-center gap-1.5'
				>
					<View
						className='w-16 h-16 rounded-full bg-white items-center justify-center'
						style={{
							shadowColor: colors.success,
							shadowOffset: { width: 0, height: 4 },
							shadowOpacity: 0.08,
							shadowRadius: 12,
							elevation: 4,
						}}
					>
						<Ionicons name='heart' size={30} className='text-success' />
					</View>
					<Text className='text-description text-xs font-pretendard-regular'>선택!</Text>
				</Pressable>
			</View>
		</>
	);
}
