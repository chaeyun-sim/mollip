import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/src/components/layout/Screen';
import { OnboardingGalleryWall } from '@/src/components/onboarding/OnboardingGalleryWall';
import { OnboardingSaveErrorBar } from '@/src/components/onboarding/OnboardingSaveErrorBar';
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
	const [saving, setSaving] = useState(false);
	const [errorCount, setErrorCount] = useState(0);
	const hasError = errorCount > 0;

	const wall = useOnboardingWallPlacement();
	const preferences = useOnboardingWallPreferences(userId, wall.initialize);
	const selectedGenres = wall.genres;
	const initializeWall = wall.initialize;
	const loadPreferences = preferences.load;
	const handleStrengthenPreferences = useCallback(() => {
		router.push({
			pathname: '/settings/preferences-chips',
		});
	}, [router]);

	useEffect(() => {
		void loadPreferences();
	}, [loadPreferences]);

	// 벽 저장은 장르와 작품 배치만 갱신한다. 추가 취향은 취향 강화하기 화면에서 별도로 저장한다.
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

		queryClient.setQueryData(preferencesQueryKey(userId), (current: Preferences | undefined) => ({
			preferredGenres: genres,
			preferredArtists: current?.preferredArtists ?? [],
			preferredTasteDetails: current?.preferredTasteDetails ?? EMPTY_PREFERRED_TASTE,
		}));
		void queryClient.invalidateQueries({ queryKey: ['exhibitions', 'recommended'] });
		setSaving(false);
		router.back();
	}, [userId, saving, selectedGenres, wall.pieceIds, queryClient, router]);

	const handleSkipWithoutSave = useCallback(() => {
		router.back();
	}, [router]);

	const handleClearPreferences = useCallback(() => {
		Alert.alert('내 취향 지우기', '저장된 취향을 모두 지울까요?', [
			{ text: t('common.cancel'), style: 'cancel' },
			{
				text: '지우기',
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
						Alert.alert('지우기 실패', '잠시 후 다시 시도해 주세요.');
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
						Alert.alert('일부 취향만 초기화했어요', '잠시 후 상세 취향을 다시 초기화해 주세요.');
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
							onPress={handleStrengthenPreferences}
							hitSlop={8}
							accessibilityRole="button"
							accessibilityLabel="취향 강화하기"
							className="min-h-11 justify-center"
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
						>
							<Text className="text-[15px] font-pretendard-regular text-brand">취향 강화</Text>
						</Pressable>
					</Screen.Header.Right>
				)}
			</Screen.Header>

			<View className="flex-1">
				<OnboardingGalleryWall
					wall={wall}
					busy={saving || hasError}
					onConfirm={handleConfirm}
					onResetPreferences={handleClearPreferences}
				/>
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
