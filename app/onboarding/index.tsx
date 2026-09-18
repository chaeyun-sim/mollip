import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { Screen } from '@/src/components/layout/Screen';
import { OnboardingGalleryWall } from '@/src/components/onboarding/OnboardingGalleryWall';
import { OnboardingSaveErrorBar } from '@/src/components/onboarding/OnboardingSaveErrorBar';
import { OnboardingSkipAction } from '@/src/components/onboarding/OnboardingSkipAction';
import { OnboardingWallPrologue } from '@/src/components/onboarding/OnboardingWallPrologue';
import { useOnboardingWallPlacement } from '@/src/hooks/useOnboardingWallPlacement';
import { useAuthStore } from '@/src/store/authStore';
import { setLocalOnboardingCompleted, setPendingGenres } from '@/src/utils/onboardingLocalStorage';
import { toValidGenres } from '@/src/utils/onboardingWallGenres';
import { supabase } from '@/src/utils/supabase';

export default function OnboardingScreen() {
	const router = useRouter();
	const { userId, setOnboardingCompleted } = useAuthStore(
		useShallow((s) => ({ userId: s.user?.id, setOnboardingCompleted: s.setOnboardingCompleted })),
	);
	const [step, setStep] = useState<'prologue' | 'wall'>('prologue');
	const [saving, setSaving] = useState(false);
	// 오류 바는 실패 이후 재시도가 끝날 때까지(성공 또는 무저장 시작 전까지) 화면에 남는다 (AC-5)
	// 0 = 오류 없음, 그 외에는 실패 횟수 — key로 써서 재실패마다 알림을 다시 발화한다 (AC-7)
	const [errorCount, setErrorCount] = useState(0);
	const hasError = errorCount > 0;

	const wall = useOnboardingWallPlacement();
	const selectedGenres = wall.genres;

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
		Alert.alert(
			'지금 건너뛸까요?',
			'취향을 고르지 않으면 취향에 맞는 전시를 추천해드리기 어려워요.',
			[
				{ text: '취소', style: 'cancel' },
				{ text: '건너뛰기', style: 'destructive', onPress: performSkip },
			],
		);
	}, [performSkip]);

	// AC-4: taxonomy 검증 후 preferred_genres만 명시적으로 저장한다 (preferred_artists는 건드리지 않음)
	// AC-5: 실패 시 선택 결과를 화면과 사용자별 로컬 pending 레코드에 남기고 재시도/무저장 시작을 제공한다
	const handleConfirm = useCallback(async () => {
		if (!userId || saving) return;
		setSaving(true);

		const genres = toValidGenres(selectedGenres);
		const { error } = await supabase
			.from('profiles')
			.update({ preferred_genres: genres, onboarding_completed: true })
			.eq('id', userId);

		if (error) {
			console.error('[onboarding] save failed:', error.message);
			await setPendingGenres(userId, genres);
			setSaving(false);
			setErrorCount((n) => n + 1);
			return;
		}

		await setLocalOnboardingCompleted(userId, true);
		setOnboardingCompleted(true);
		router.replace('/(tabs)');
	}, [userId, saving, selectedGenres, setOnboardingCompleted, router]);

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
				<OnboardingWallPrologue onStart={() => setStep('wall')} onSkip={handleSkip} />
			</Screen>
		);
	}

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back onPress={() => setStep('prologue')} />
				<Screen.Header.Center>내 전시 벽 만들기</Screen.Header.Center>
				<Screen.Header.Right className="-mr-2">
					<OnboardingSkipAction onPress={handleSkip} />
				</Screen.Header.Right>
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
