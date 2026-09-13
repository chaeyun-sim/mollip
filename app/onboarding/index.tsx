import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { Screen } from '@/src/components/layout/Screen';
import { OnboardingArtworkTray } from '@/src/components/onboarding/OnboardingArtworkTray';
import { OnboardingSaveErrorBar } from '@/src/components/onboarding/OnboardingSaveErrorBar';
import { OnboardingWallConfirm } from '@/src/components/onboarding/OnboardingWallConfirm';
import { OnboardingWallPrologue } from '@/src/components/onboarding/OnboardingWallPrologue';
import { OnboardingWallProgress } from '@/src/components/onboarding/OnboardingWallProgress';
import { useOnboardingWallFlow } from '@/src/hooks/useOnboardingWallFlow';
import { useAuthStore } from '@/src/store/authStore';
import { setLocalOnboardingCompleted, setPendingGenres } from '@/src/utils/onboardingLocalStorage';
import { toValidGenres } from '@/src/utils/onboardingWallGenres';
import { supabase } from '@/src/utils/supabase';

export default function OnboardingScreen() {
	const router = useRouter();
	const userId = useAuthStore((s) => s.user?.id);
	const setOnboardingCompleted = useAuthStore((s) => s.setOnboardingCompleted);
	const [saving, setSaving] = useState(false);
	// 오류 바는 실패 이후 재시도가 끝날 때까지(성공 또는 무저장 시작 전까지) 화면에 남는다 (AC-5)
	// 0 = 오류 없음, 그 외에는 실패 횟수 — key로 써서 재실패마다 알림을 다시 발화한다 (AC-7)
	const [errorCount, setErrorCount] = useState(0);
	const hasError = errorCount > 0;

	const {
		step,
		trays,
		selections,
		canCompleteEarly,
		selectedGenres,
		lastAnnouncement,
		lastChangedTrayIndex,
		startCuration,
		selectPiece,
		requestChange,
		completeEarly,
		restart,
	} = useOnboardingWallFlow();

	const handleSkip = useCallback(() => {
		// 스킵은 preferred_genres를 바꾸지 않고 완료 상태만 남긴다 (AC-1, AC-5)
		if (userId) {
			void setLocalOnboardingCompleted(userId, true);
			void supabase.from('profiles').update({ onboarding_completed: true }).eq('id', userId);
		}
		setOnboardingCompleted(true);
		router.replace('/(tabs)');
	}, [userId, router, setOnboardingCompleted]);

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

	function renderContent() {
		if (step.kind === 'prologue') {
			return <OnboardingWallPrologue onStart={startCuration} onSkip={handleSkip} />;
		}

		if (step.kind === 'tray') {
			const tray = trays[step.trayIndex];
			return (
				<View className="flex-1 pt-2">
					<View style={{ maxHeight: '45%' }}>
						<OnboardingWallProgress
							selections={selections}
							canCompleteEarly={canCompleteEarly}
							onCompleteEarly={completeEarly}
							onRequestChange={requestChange}
							onSkip={handleSkip}
							changeAnnouncement={lastChangedTrayIndex !== null ? lastAnnouncement : null}
							changedTrayIndex={lastChangedTrayIndex}
						/>
					</View>
					<View className="flex-1 pt-2">
						<OnboardingArtworkTray
							tray={tray}
							onSelect={(piece) => selectPiece(step.trayIndex, piece)}
							announcement={lastChangedTrayIndex === null ? lastAnnouncement : null}
						/>
					</View>
				</View>
			);
		}

		// step.kind === 'confirm'
		return (
			<OnboardingWallConfirm
				selections={selections}
				onRequestChange={requestChange}
				onRestart={restart}
				onConfirm={handleConfirm}
				confirmDisabled={saving || hasError}
				changeAnnouncement={lastChangedTrayIndex !== null ? lastAnnouncement : null}
				changedTrayIndex={lastChangedTrayIndex}
				errorSlot={
					hasError ? (
						<OnboardingSaveErrorBar
							key={errorCount}
							onRetry={handleConfirm}
							onSkipSave={handleSkipWithoutSave}
							busy={saving}
						/>
					) : undefined
				}
			/>
		);
	}

	return <Screen variant="warm">{renderContent()}</Screen>;
}
