import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { Screen } from '@/src/components/layout/Screen';
import { OnboardingGalleryWall } from '@/src/components/onboarding/OnboardingGalleryWall';
import { OnboardingGenrePicker } from '@/src/components/onboarding/OnboardingGenrePicker';
import { OnboardingSaveErrorBar } from '@/src/components/onboarding/OnboardingSaveErrorBar';
import { OnboardingSkipAction } from '@/src/components/onboarding/OnboardingSkipAction';
import { OnboardingWallPrologue } from '@/src/components/onboarding/OnboardingWallPrologue';
import { useMarkInteractive } from '@/src/hooks/useMarkInteractive';
import { useOnboardingWallPlacement } from '@/src/hooks/useOnboardingWallPlacement';
import { useAuthStore } from '@/src/store/authStore';
import { setLocalOnboardingCompleted, setPendingGenres } from '@/src/utils/onboardingLocalStorage';
import { toValidGenres } from '@/src/utils/onboardingWallGenres';
import { supabase } from '@/src/utils/supabase';

interface PreferenceSelection {
	genres: string[];
	pieceIds: string[];
}

export default function OnboardingScreen() {
	const { t } = useTranslation();

	useMarkInteractive();
	const router = useRouter();
	const { userId, setOnboardingCompleted } = useAuthStore(
		useShallow((s) => ({ userId: s.user?.id, setOnboardingCompleted: s.setOnboardingCompleted })),
	);
	const [step, setStep] = useState<'prologue' | 'wall' | 'chips'>('prologue');
	const [chipGenres, setChipGenres] = useState<string[]>([]);
	const [saving, setSaving] = useState(false);
	// 오류 바는 실패 이후 재시도가 끝날 때까지(성공 또는 무저장 시작 전까지) 화면에 남는다 (AC-5)
	// 0 = 오류 없음, 그 외에는 실패 횟수 — key로 써서 재실패마다 알림을 다시 발화한다 (AC-7)
	const [errorCount, setErrorCount] = useState(0);
	const [retrySelection, setRetrySelection] = useState<PreferenceSelection | null>(null);
	const hasError = errorCount > 0;

	const wall = useOnboardingWallPlacement();
	const selectedGenres = wall.genres;
	const selectedPieceIds = wall.pieceIds;

	// 스킵은 preferred_genres를 바꾸지 않고 완료 상태만 남긴다 (AC-1, AC-5)
	const performSkip = useCallback(() => {
		if (userId) {
			void setLocalOnboardingCompleted(userId, true);
			void supabase.from('profiles').update({ onboarding_completed: true }).eq('id', userId);
		}
		setOnboardingCompleted(true);
		router.replace('/(tabs)');
	}, [userId, router, setOnboardingCompleted]);

	const handleSkip = useCallback(() => {
		Alert.alert(t('onboarding.skip_confirm'), t('onboarding.skip_confirm_description'), [
			{ text: t('common.cancel'), style: 'cancel' },
			{ text: t('onboarding.skip_action'), style: 'destructive', onPress: performSkip },
		]);
	}, [performSkip, t]);

	// 벽/칩 경로 모두 같은 taxonomy 검증·저장·재시도 흐름을 사용한다.
	const handleSaveSelection = useCallback(
		async (selection: PreferenceSelection) => {
			if (!userId || saving) return;
			setSaving(true);

			const genres = toValidGenres(selection.genres);
			const pieceIds = selection.pieceIds;
			setRetrySelection({ genres, pieceIds });
			const { error } = await supabase
				.from('profiles')
				.update({
					preferred_genres: genres,
					preferred_wall_piece_ids: pieceIds,
					onboarding_completed: true,
				})
				.eq('id', userId);

			if (error) {
				console.error('[onboarding] save failed:', error.message);
				await setPendingGenres(userId, genres, pieceIds);
				setSaving(false);
				setErrorCount((n) => n + 1);
				return;
			}

			await setLocalOnboardingCompleted(userId, true);
			setOnboardingCompleted(true);
			// 신규 가입자는 장르 저장 후 바로 시작하지 않고 취향 강화하기로 이어간다
			router.replace({ pathname: '/settings/preferences-chips', params: { from: 'onboarding' } });
		},
		[userId, saving, setOnboardingCompleted, router],
	);

	const handleConfirmWall = useCallback(() => {
		void handleSaveSelection({ genres: selectedGenres, pieceIds: selectedPieceIds });
	}, [handleSaveSelection, selectedGenres, selectedPieceIds]);

	const handleConfirmChips = useCallback(() => {
		void handleSaveSelection({ genres: chipGenres, pieceIds: [] });
	}, [handleSaveSelection, chipGenres]);

	const handleRetry = useCallback(() => {
		if (retrySelection) void handleSaveSelection(retrySelection);
	}, [handleSaveSelection, retrySelection]);

	const handleToggleChipGenre = useCallback((genre: string) => {
		setChipGenres((current) =>
			current.includes(genre) ? current.filter((item) => item !== genre) : [...current, genre],
		);
	}, []);

	// AC-5: 취향 저장 없이 시작 — pending 레코드는 남겨 다음 인증 가능 시점에 재동기화된다
	const handleSkipWithoutSave = useCallback(async () => {
		if (!userId) return;
		await setLocalOnboardingCompleted(userId, true);
		setOnboardingCompleted(true);
		router.replace('/(tabs)');
	}, [userId, setOnboardingCompleted, router]);

	if (step === 'prologue') {
		return (
			<Screen variant="warm">
				<OnboardingWallPrologue
					onStartWall={() => setStep('wall')}
					onStartChips={() => setStep('chips')}
					onSkip={handleSkip}
				/>
			</Screen>
		);
	}

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back onPress={() => setStep('prologue')} />
				<Screen.Header.Center>
					{step === 'wall' ? t('onboarding.create_wall_title') : t('onboarding.select_genre_title')}
				</Screen.Header.Center>
				<Screen.Header.Right className="-mr-2">
					<OnboardingSkipAction onPress={handleSkip} />
				</Screen.Header.Right>
			</Screen.Header>

			<View className="flex-1">
				{step === 'wall' ? (
					<OnboardingGalleryWall
						wall={wall}
						busy={saving || hasError}
						onConfirm={handleConfirmWall}
					/>
				) : (
					<OnboardingGenrePicker
						selectedGenres={chipGenres}
						busy={saving || hasError}
						onToggleGenre={handleToggleChipGenre}
						onConfirm={handleConfirmChips}
					/>
				)}
				{hasError && (
					<OnboardingSaveErrorBar
						key={errorCount}
						onRetry={handleRetry}
						onSkipSave={handleSkipWithoutSave}
						busy={saving}
					/>
				)}
			</View>
		</Screen>
	);
}
