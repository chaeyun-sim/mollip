import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/src/components/layout/Screen';
import { PreferredTastePicker } from '@/src/components/onboarding/PreferredTastePicker';
import { preferencesQueryKey, usePreferences } from '@/src/hooks/queries/usePreferences';
import type { Preferences } from '@/src/hooks/queries/usePreferences';
import { useAuthStore } from '@/src/store/authStore';
import { EMPTY_PREFERRED_TASTE, type PreferredTasteDetails } from '@/src/utils/preferredTaste';
import { supabase } from '@/src/utils/supabase';

export default function PreferencesChipsScreen() {
	const router = useRouter();
	const { from } = useLocalSearchParams<{ from?: string }>();
	const queryClient = useQueryClient();
	const userId = useAuthStore((state) => state.user?.id);
	const preferences = usePreferences(userId);
	const [value, setValue] = useState<PreferredTasteDetails>(EMPTY_PREFERRED_TASTE);
	const [artists, setArtists] = useState<string[]>([]);
	const [saving, setSaving] = useState(false);

	const isFromOnboarding = from === 'onboarding';

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
		Alert.alert(
			'추가 취향 초기화',
			'그림 분위기, 전시장 규모, 미술사조와 관심 작가를 지울까요? 벽에서 고른 장르는 유지돼요.',
			[
				{ text: '취소', style: 'cancel' },
				{
					text: '초기화',
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
							Alert.alert('초기화하지 못했어요', '네트워크를 확인한 뒤 다시 시도해 주세요.');
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
			],
		);
	}, [userId, saving, queryClient]);

	const handleSave = useCallback(async () => {
		if (!userId || saving) return;
		setSaving(true);
		const { error } = await supabase
			.from('profiles')
			.update({ preferred_taste_details: value, preferred_artists: artists })
			.eq('id', userId);

		if (error) {
			console.error('[preferences-taste] save failed:', error.message);
			setSaving(false);
			Alert.alert('저장하지 못했어요', '네트워크를 확인한 뒤 다시 시도해 주세요.');
			return;
		}

		queryClient.setQueryData(preferencesQueryKey(userId), (current: Preferences | undefined) => ({
			preferredGenres: current?.preferredGenres ?? [],
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
		router.back();
	}, [userId, saving, value, artists, queryClient, router, isFromOnboarding]);

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
				<Screen.Header.Center>취향 강화하기</Screen.Header.Center>
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
