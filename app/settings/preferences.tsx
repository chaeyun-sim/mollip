import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/src/components/layout/Screen';
import { OnboardingGalleryWall } from '@/src/components/onboarding/OnboardingGalleryWall';
import { useOnboardingWallPlacement } from '@/src/hooks/useOnboardingWallPlacement';
import { useOnboardingWallPreferences } from '@/src/hooks/useOnboardingWallPreferences';
import { preferencesQueryKey } from '@/src/hooks/queries/usePreferences';
import type { Preferences } from '@/src/hooks/queries/usePreferences';
import { useAuthStore } from '@/src/store/authStore';
import { toValidGenres } from '@/src/utils/onboardingWallGenres';
import { EMPTY_PREFERRED_TASTE } from '@/src/utils/preferredTaste';
import { supabase } from '@/src/utils/supabase';

export default function PreferencesScreen() {
	const { t } = useTranslation();

	const router = useRouter();
	const queryClient = useQueryClient();
	const userId = useAuthStore((s) => s.user?.id);

	const wall = useOnboardingWallPlacement();
	const preferences = useOnboardingWallPreferences(userId, wall.initialize);
	const selectedGenres = wall.genres;
	const initializeWall = wall.initialize;
	const loadPreferences = preferences.load;

	useEffect(() => {
		void loadPreferences();
	}, [loadPreferences]);

	// 1단계: 벽(장르·작품 배치)은 저장하지 않고 2단계로 넘긴다.
	// 2단계에서 Save를 누를 때 벽과 취향 강화를 한 번에 저장한다.
	const handleConfirm = useCallback(() => {
		router.push({
			pathname: '/settings/preferences-chips',
			params: {
				genres: JSON.stringify(toValidGenres(selectedGenres)),
				pieceIds: JSON.stringify(wall.pieceIds),
			},
		});
	}, [selectedGenres, wall.pieceIds, router]);

	const handleClearPreferences = useCallback(() => {
		Alert.alert(t('preferences.clear_title'), t('preferences.clear_body'), [
			{ text: t('common.cancel'), style: 'cancel' },
			{
				text: t('preferences.clear_confirm'),
				style: 'destructive',
				onPress: async () => {
					if (!userId) return;
					const { error } = await supabase
						.from('profiles')
						.update({
							preferred_genres: [],
							preferred_artists: [],
							preferred_wall_piece_ids: [],
						})
						.eq('id', userId);
					if (error) {
						console.error('[preferences] clear failed:', error.message);
						Alert.alert(t('preferences.clear_failed_title'), t('preferences.retry_later'));
						return;
					}
					const { error: tasteError } = await supabase
						.from('profiles')
						.update({ preferred_taste_details: EMPTY_PREFERRED_TASTE })
						.eq('id', userId);
					const tasteColumnMissing =
						tasteError?.code === '42703' || tasteError?.code === 'PGRST204';
					if (tasteError && !tasteColumnMissing) {
						console.error('[preferences] detailed taste clear failed:', tasteError.message);
						Alert.alert(t('preferences.partial_clear_title'), t('preferences.partial_clear_body'));
					}
					queryClient.setQueryData(
						preferencesQueryKey(userId),
						(current: Preferences | undefined) => ({
							preferredGenres: [],
							preferredArtists: [],
							preferredTasteDetails: EMPTY_PREFERRED_TASTE,
						}),
					);
					void queryClient.invalidateQueries({ queryKey: ['exhibitions', 'recommended'] });
					initializeWall([]);
				},
			},
		]);
	}, [userId, initializeWall, queryClient, t]);

	if (preferences.status === 'error') {
		return (
			<Screen variant="warm">
				<Screen.Header>
					<Screen.Header.Back />
					<Screen.Header.Center>{t('preferences.title')}</Screen.Header.Center>
				</Screen.Header>

				<View className="flex-1 items-center justify-center gap-3">
					<Text className="font-pretendard-regular text-base text-gray900">
						{t('preferences.load_failed')}
					</Text>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel={t('preferences.reload_a11y')}
						onPress={loadPreferences}
						className="min-h-11 justify-center px-4"
					>
						<Text className="font-pretendard-semibold text-base text-brand">
							{t('common.retry')}
						</Text>
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
					<Screen.Header.Center>{t('preferences.title')}</Screen.Header.Center>
				</Screen.Header>

				<View className="flex-1 items-center justify-center gap-3">
					<ActivityIndicator accessibilityRole="progressbar" />
					<Text className="font-pretendard-regular text-base text-gray700">
						{t('preferences.loading')}
					</Text>
				</View>
			</Screen>
		);
	}

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back />
				<Screen.Header.Center>{t('preferences.title')}</Screen.Header.Center>
			</Screen.Header>

			<View className="flex-1">
				<OnboardingGalleryWall
					wall={wall}
					busy={false}
					onConfirm={handleConfirm}
					onResetPreferences={handleClearPreferences}
				/>
			</View>
		</Screen>
	);
}
