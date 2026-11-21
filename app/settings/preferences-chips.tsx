import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/src/components/layout/Screen';
import { PreferredTastePicker } from '@/src/components/onboarding/PreferredTastePicker';
import { preferencesQueryKey, usePreferences } from '@/src/hooks/queries/usePreferences';
import type { Preferences } from '@/src/hooks/queries/usePreferences';
import { useAuthStore } from '@/src/store/authStore';
import { parseStringArrayParam } from '@/src/utils/parseStringArrayParam';
import { EMPTY_PREFERRED_TASTE, type PreferredTasteDetails } from '@/src/utils/preferredTaste';
import { supabase } from '@/src/utils/supabase';

export default function PreferencesChipsScreen() {
	const { t } = useTranslation();

	const router = useRouter();
	const params = useLocalSearchParams<{ from?: string; genres?: string; pieceIds?: string }>();
	const queryClient = useQueryClient();
	const userId = useAuthStore((state) => state.user?.id);
	const preferences = usePreferences(userId);
	const [value, setValue] = useState<PreferredTasteDetails>(EMPTY_PREFERRED_TASTE);
	const [artists, setArtists] = useState<string[]>([]);
	const [saving, setSaving] = useState(false);

	const isFromOnboarding = params.from === 'onboarding';
	// 설정 1단계(벽)에서 넘어온 값 — 2단계 저장 때 함께 저장한다
	const wallGenres = useMemo(() => parseStringArrayParam(params.genres), [params.genres]);
	const wallPieceIds = useMemo(() => parseStringArrayParam(params.pieceIds), [params.pieceIds]);

	useEffect(() => {
		setValue(preferences.preferredTasteDetails);
		setArtists(preferences.preferredArtists);
	}, [preferences.preferredTasteDetails, preferences.preferredArtists]);

	const handleToggle = useCallback((group: keyof PreferredTasteDetails, option: string) => {
		setValue((current) => ({
			...current,
			[group]: current[group].includes(option)
				? current[group].filter((item) => item !== option)
				: [...current[group], option],
		}));
	}, []);

	const handleAddArtist = useCallback((artist: string) => {
		setArtists((current) =>
			current.some((item) => item.toLocaleLowerCase() === artist.toLocaleLowerCase())
				? current
				: [...current, artist],
		);
	}, []);

	const handleRemoveArtist = useCallback((artist: string) => {
		setArtists((current) => current.filter((item) => item !== artist));
	}, []);

	const handleReset = useCallback(() => {
		Alert.alert(t('preferences.reset_title'), t('preferences.reset_body'), [
			{ text: t('common.cancel'), style: 'cancel' },
			{
				text: t('onboarding.reset'),
				style: 'destructive',
				onPress: async () => {
					if (!userId || saving) return;
					setSaving(true);
					const { error } = await supabase
						.from('profiles')
						.update({ preferred_taste_details: EMPTY_PREFERRED_TASTE, preferred_artists: [] })
						.eq('id', userId);

					if (error) {
						console.error('[preferences-taste] reset failed:', error.message);
						setSaving(false);
						Alert.alert(t('preferences.reset_failed_title'), t('preferences.network_retry'));
						return;
					}

					setValue(EMPTY_PREFERRED_TASTE);
					setArtists([]);
					queryClient.setQueryData(
						preferencesQueryKey(userId),
						(current: Preferences | undefined) => ({
							preferredGenres: current?.preferredGenres ?? [],
							preferredArtists: [],
							preferredTasteDetails: EMPTY_PREFERRED_TASTE,
						}),
					);
					void queryClient.invalidateQueries({ queryKey: ['exhibitions', 'recommended'] });
					setSaving(false);
				},
			},
		]);
	}, [userId, saving, queryClient, t]);

	const handleSave = useCallback(async () => {
		if (!userId || saving) return;
		setSaving(true);
		const { error } = await supabase
			.from('profiles')
			.update({
				preferred_taste_details: value,
				preferred_artists: artists,
				...(wallGenres && { preferred_genres: wallGenres }),
				...(wallPieceIds && { preferred_wall_piece_ids: wallPieceIds }),
			})
			.eq('id', userId);

		if (error) {
			console.error('[preferences-taste] save failed:', error.message);
			setSaving(false);
			Alert.alert(t('preferences.save_failed_title'), t('preferences.network_retry'));
			return;
		}

		queryClient.setQueryData(preferencesQueryKey(userId), (current: Preferences | undefined) => ({
			preferredGenres: wallGenres ?? current?.preferredGenres ?? [],
			preferredArtists: artists,
			preferredTasteDetails: value,
		}));
		void queryClient.invalidateQueries({ queryKey: ['exhibitions', 'recommended'] });
		if (isFromOnboarding) {
			// 온보딩에서 방금 저장한 장르가 캐시에 없을 수 있어 서버 값으로 다시 불러온다
			void queryClient.invalidateQueries({ queryKey: preferencesQueryKey(userId) });
			router.replace('/(tabs)');
			return;
		}
		// 설정에서는 1단계(벽) → 2단계(강화) 흐름이므로 저장 후 설정 탭까지 한 번에 돌아간다
		router.dismissTo('/(tabs)/settings');
	}, [
		userId,
		saving,
		value,
		artists,
		wallGenres,
		wallPieceIds,
		queryClient,
		router,
		isFromOnboarding,
		t,
	]);

	const handleBack = useCallback(() => {
		if (isFromOnboarding) {
			router.replace('/(tabs)');
			return;
		}
		router.back();
	}, [isFromOnboarding, router]);

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Left>
					<Screen.Header.Back onPress={handleBack} />
				</Screen.Header.Left>
				<Screen.Header.Center>{t('preferences.refine_title')}</Screen.Header.Center>
			</Screen.Header>
			<PreferredTastePicker
				value={value}
				artists={artists}
				busy={saving || preferences.isLoading}
				onToggle={handleToggle}
				onAddArtist={handleAddArtist}
				onRemoveArtist={handleRemoveArtist}
				onConfirm={() => void handleSave()}
				onReset={handleReset}
			/>
		</Screen>
	);
}
