import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Screen } from '@/src/components/layout/Screen';
import { ArtPreferenceComplete } from '@/src/components/onboarding/ArtPreferenceComplete';
import { ArtPreferenceDeck } from '@/src/components/onboarding/ArtPreferenceDeck';
import { WarmGradientBackdrop } from '@/src/components/common/WarmGradientBackdrop';
import { useArtPreferenceSwipe } from '@/src/hooks/useArtPreferenceSwipe';
import { useAuthStore } from '@/src/store/authStore';
import { supabase } from '@/src/utils/supabase';
import { colors } from '@/src/constants/colors';
import { ART_ITEMS } from '@/src/data/onboardingArtItems';
import { shuffle } from '@/src/utils/shuffle';
import { summarizeArtPreferences } from '@/src/utils/artPreferenceSummary';

export default function PreferencesScreen() {
	const router = useRouter();
	const userId = useAuthStore((s) => s.user?.id);
	const [isLoading, setIsLoading] = useState(true);
	const [currentArtists, setCurrentArtists] = useState<string[]>([]);
	const [saving, setSaving] = useState(false);

	const { cards, setCards, liked, done, handleSwipeLeft, handleSwipeRight } =
		useArtPreferenceSwipe();

	// 기존 취향 표시용으로만 로드 — 카드 덱은 항상 전체 12장 (취소도 가능하도록)
	useEffect(() => {
		async function loadExisting() {
			if (userId) {
				const { data } = await supabase
					.from('profiles')
					.select('preferred_artists')
					.eq('id', userId)
					.single();
				setCurrentArtists(data?.preferred_artists ?? []);
			}
			setCards(shuffle(ART_ITEMS));
			setIsLoading(false);
		}
		void loadExisting();
	}, [userId, setCards]);

	const handleSave = useCallback(async () => {
		if (saving) return;
		setSaving(true);
		if (userId) {
			const { genres, artists } = summarizeArtPreferences(liked);
			await supabase
				.from('profiles')
				.update({ preferred_genres: genres, preferred_artists: artists })
				.eq('id', userId);
		}
		router.back();
	}, [router, userId, liked, saving]);

	return (
		<Screen variant="warm">
			<WarmGradientBackdrop />

			<Screen.Header>
				<Screen.Header.Back onPress={() => router.back()} />
				<Screen.Header.Center>내 취향 수정</Screen.Header.Center>
			</Screen.Header>

			{isLoading ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator color={colors.primary} />
				</View>
			) : done ? (
				<ArtPreferenceComplete
					likedCount={liked.length}
					buttonLabel="저장하기"
					onPress={handleSave}
					disabled={saving}
				/>
			) : (
				<>
					{/* 부제 */}
					<Text className="text-[13px] font-pretendard-regular text-description mb-1">
						마음에 드는 그림을 저장하면 맞춤 전시를 추천해드릴게요
					</Text>

					<ArtPreferenceDeck
						cards={cards}
						totalCount={ART_ITEMS.length}
						onSwipeLeft={handleSwipeLeft}
						onSwipeRight={handleSwipeRight}
						isPreviouslyLiked={(item) => currentArtists.includes(item.artist)}
					/>
				</>
			)}
		</Screen>
	);
}
