import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import { Screen } from '@/src/components/layout/Screen';
import { OnboardingGalleryWall } from '@/src/components/onboarding/OnboardingGalleryWall';
import { OnboardingSaveErrorBar } from '@/src/components/onboarding/OnboardingSaveErrorBar';
import { useOnboardingWallPlacement } from '@/src/hooks/useOnboardingWallPlacement';
import { useOnboardingWallPreferences } from '@/src/hooks/useOnboardingWallPreferences';
import { useAuthStore } from '@/src/store/authStore';
import { toValidGenres } from '@/src/utils/onboardingWallGenres';
import { supabase } from '@/src/utils/supabase';

export default function PreferencesScreen() {
	const router = useRouter();
	const userId = useAuthStore((s) => s.user?.id);
	const [saving, setSaving] = useState(false);
	const [errorCount, setErrorCount] = useState(0);
	const hasError = errorCount > 0;

	const wall = useOnboardingWallPlacement();
	const preferences = useOnboardingWallPreferences(userId, wall.initialize);
	const selectedGenres = wall.genres;
	const initializeWall = wall.initialize;
	const loadPreferences = preferences.load;

	useEffect(() => {
		void loadPreferences();
	}, [loadPreferences]);

	// AC-6: 다시 꾸미기·지우기 모두 preferred_genres만 교체한다 — onboarding_completed/preferred_artists는 건드리지 않음
	const handleConfirm = useCallback(async () => {
		if (!userId || saving) return;
		setSaving(true);

		const genres = toValidGenres(selectedGenres);
		const { error } = await supabase
			.from('profiles')
			.update({ preferred_genres: genres, preferred_wall_piece_ids: wall.pieceIds })
			.eq('id', userId);

		if (error) {
			console.error('[preferences] save failed:', error.message);
			setSaving(false);
			setErrorCount((n) => n + 1);
			return;
		}

		setSaving(false);
		router.back();
	}, [userId, saving, selectedGenres, wall.pieceIds, router]);

	const handleSkipWithoutSave = useCallback(() => {
		router.back();
	}, [router]);

	const handleClearPreferences = useCallback(() => {
		Alert.alert('내 취향 지우기', '저장된 취향 장르를 모두 지울까요?', [
			{ text: '취소', style: 'cancel' },
			{
				text: '지우기',
				style: 'destructive',
				onPress: async () => {
					if (!userId) return;
					const { error } = await supabase
						.from('profiles')
						.update({ preferred_genres: [], preferred_wall_piece_ids: [] })
						.eq('id', userId);
					if (error) {
						console.error('[preferences] clear failed:', error.message);
						Alert.alert('지우기 실패', '잠시 후 다시 시도해 주세요.');
						return;
					}
					initializeWall([]);
				},
			},
		]);
	}, [userId, initializeWall]);

	if (preferences.status === 'error') {
		return (
			<Screen variant="warm">
				<Screen.Header>
					<Screen.Header.Back />
					<Screen.Header.Center>내 취향 수정</Screen.Header.Center>
				</Screen.Header>

				<View className="flex-1 items-center justify-center gap-3">
					<Text className="font-pretendard-regular text-base text-gray900">
						취향을 불러오지 못했어요
					</Text>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="취향 다시 불러오기"
						onPress={loadPreferences}
						className="min-h-11 justify-center px-4"
					>
						<Text className="font-pretendard-semibold text-base text-primary-dark">다시 시도</Text>
					</Pressable>
				</View>
			</Screen>
		);
	}

	if (preferences.status !== 'ready') {
		return (
			<Screen variant="warm">
				<Screen.Header>
					<Screen.Header.Back />
					<Screen.Header.Center>내 취향 수정</Screen.Header.Center>
				</Screen.Header>

				<View className="flex-1 items-center justify-center gap-3">
					<ActivityIndicator accessibilityRole="progressbar" />
					<Text className="font-pretendard-regular text-base text-gray700">
						나의 취향을 불러오고 있어요
					</Text>
				</View>
			</Screen>
		);
	}

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back />
				<Screen.Header.Center>내 취향 수정</Screen.Header.Center>
				{preferences.status === 'ready' && (
					<Screen.Header.Right>
						<Pressable
							onPress={handleClearPreferences}
							hitSlop={8}
							accessibilityRole="button"
							accessibilityLabel="내 취향 초기화하기"
							className="min-h-11 justify-center"
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
						>
							<Text className="text-[15px] font-pretendard-regular text-error">초기화</Text>
						</Pressable>
					</Screen.Header.Right>
				)}
			</Screen.Header>

			<View className="flex-1">
				<OnboardingGalleryWall wall={wall} busy={saving || hasError} onConfirm={handleConfirm} />
				{hasError && (
					<OnboardingSaveErrorBar
						key={errorCount}
						onRetry={handleConfirm}
						onSkipSave={handleSkipWithoutSave}
						busy={saving}
					/>
				)}
			</View>
		</Screen>
	);
}
