import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { ArtPreferenceComplete } from '@/src/components/onboarding/ArtPreferenceComplete';
import { ArtPreferenceDeck } from '@/src/components/onboarding/ArtPreferenceDeck';
import { Screen } from '@/src/components/layout/Screen';
import { WarmGradientBackdrop } from '@/src/components/common/WarmGradientBackdrop';
import { useArtPreferenceSwipe } from '@/src/hooks/useArtPreferenceSwipe';
import { useAuthStore } from '@/src/store/authStore';
import { supabase } from '@/src/utils/supabase';
import { ART_ITEMS } from '@/src/data/onboardingArtItems';
import { shuffle } from '@/src/utils/shuffle';
import { summarizeArtPreferences } from '@/src/utils/artPreferenceSummary';

export default function OnboardingScreen() {
	const router = useRouter();
	const userId = useAuthStore((s) => s.user?.id);
	const [initialCards] = useState(() => shuffle(ART_ITEMS));

	const { cards, liked, done, handleSwipeLeft, handleSwipeRight } =
		useArtPreferenceSwipe(initialCards);

	// 선호 데이터 저장 후 다음 화면으로 이동 (REQ-UI002-003, REQ-UI002-004, REQ-UI002-006)
	const handleNext = useCallback(() => {
		if (userId) {
			const { genres, artists } = summarizeArtPreferences(liked);
			// 저장 실패 시 온보딩 플로우를 차단하지 않음
			supabase
				.from('profiles')
				.update({ preferred_genres: genres, preferred_artists: artists })
				.eq('id', userId)
				.then(({ error }) => {
					if (error) console.error('[onboarding] preference save failed:', error.message);
				});
		}
		router.push('/onboarding/location');
	}, [router, userId, liked]);

	return (
		<Screen variant="warm">
			<WarmGradientBackdrop />
			{/* 헤더 */}
			<View className="pt-4 pb-2 gap-1">
				<Text className="text-primary text-[26px] font-hahmlet-bold">
					당신의 취향을{'\n'}골라보세요
				</Text>
				<Text className="text-description text-[13px] font-pretendard-regular">
					마음에 드는 그림을 저장하면 맞춤 전시를 추천해드릴게요
				</Text>
			</View>

			{done ? (
				<ArtPreferenceComplete
					likedCount={liked.length}
					buttonLabel="다음으로"
					onPress={handleNext}
				/>
			) : (
				<ArtPreferenceDeck
					cards={cards}
					totalCount={ART_ITEMS.length}
					onSwipeLeft={handleSwipeLeft}
					onSwipeRight={handleSwipeRight}
				/>
			)}
		</Screen>
	);
}
