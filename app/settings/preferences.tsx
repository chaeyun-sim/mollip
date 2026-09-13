import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

import { Screen } from '@/src/components/layout/Screen';
import { CardRow, SettingsCard } from '@/src/components/mypage';
import { OnboardingArtworkTray } from '@/src/components/onboarding/OnboardingArtworkTray';
import { OnboardingSaveErrorBar } from '@/src/components/onboarding/OnboardingSaveErrorBar';
import { OnboardingWallConfirm } from '@/src/components/onboarding/OnboardingWallConfirm';
import { OnboardingWallProgress } from '@/src/components/onboarding/OnboardingWallProgress';
import { useOnboardingWallFlow } from '@/src/hooks/useOnboardingWallFlow';
import { useAuthStore } from '@/src/store/authStore';
import { toValidGenres } from '@/src/utils/onboardingWallGenres';
import { supabase } from '@/src/utils/supabase';

type ScreenMode = 'list' | 'curating';

export default function PreferencesScreen() {
	const router = useRouter();
	const userId = useAuthStore((s) => s.user?.id);
	const [mode, setMode] = useState<ScreenMode>('list');
	const [saving, setSaving] = useState(false);
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
		selectPiece,
		requestChange,
		completeEarly,
		restart,
	} = useOnboardingWallFlow({ startAtCuration: true });

	// AC-6: 다시 꾸미기·지우기 모두 preferred_genres만 교체한다 — onboarding_completed/preferred_artists는 건드리지 않음
	const handleConfirm = useCallback(async () => {
		if (!userId || saving) return;
		setSaving(true);

		const genres = toValidGenres(selectedGenres);
		const { error } = await supabase.from('profiles').update({ preferred_genres: genres }).eq('id', userId);

		if (error) {
			console.error('[preferences] save failed:', error.message);
			setSaving(false);
			setErrorCount((n) => n + 1);
			return;
		}

		setSaving(false);
		router.back();
	}, [userId, saving, selectedGenres, router]);

	const handleSkipWithoutSave = useCallback(() => {
		// 설정 재편집에는 사용자별 로컬 pending이 필요 없다 — 이미 온보딩을 마친 사용자이므로 저장 없이 목록으로 돌아간다
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
						.update({ preferred_genres: [] })
						.eq('id', userId);
					if (error) {
						console.error('[preferences] clear failed:', error.message);
						Alert.alert('지우기 실패', '잠시 후 다시 시도해 주세요.');
					}
				},
			},
		]);
	}, [userId]);

	function renderList() {
		return (
			<View className="pt-4 gap-3">
				<SettingsCard>
					<CardRow
						label="전시 벽 다시 꾸미기"
						onPress={() => {
							restart();
							setMode('curating');
						}}
					/>
				</SettingsCard>
				<SettingsCard>
					<CardRow label="내 취향 지우기" onPress={handleClearPreferences} />
				</SettingsCard>
			</View>
		);
	}

	function renderCuration() {
		if (step.kind === 'confirm') {
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

		// step.kind === 'tray' — 프롤로그 없이 첫 트레이부터 시작한다 (AC-6)
		const tray = trays[step.kind === 'tray' ? step.trayIndex : 0];
		return (
			<View className="flex-1 pt-2">
				<View style={{ maxHeight: '45%' }}>
					<OnboardingWallProgress
						selections={selections}
						canCompleteEarly={canCompleteEarly}
						onCompleteEarly={completeEarly}
						onRequestChange={requestChange}
						changeAnnouncement={lastChangedTrayIndex !== null ? lastAnnouncement : null}
						changedTrayIndex={lastChangedTrayIndex}
					/>
				</View>
				<View className="flex-1 pt-2">
					<OnboardingArtworkTray
						tray={tray}
						onSelect={(piece) => step.kind === 'tray' && selectPiece(step.trayIndex, piece)}
						announcement={lastChangedTrayIndex === null ? lastAnnouncement : null}
					/>
				</View>
			</View>
		);
	}

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back onPress={mode === 'list' ? () => router.back() : () => setMode('list')} />
				<Screen.Header.Center>내 취향 수정</Screen.Header.Center>
			</Screen.Header>

			{mode === 'list' ? renderList() : renderCuration()}
		</Screen>
	);
}
