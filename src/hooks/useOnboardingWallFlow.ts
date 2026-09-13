import { useCallback, useMemo, useState } from 'react';

import { ONBOARDING_WALL_TRAYS, type OnboardingWallPiece } from '@/src/data/onboardingWallTrays';

export type OnboardingWallStep =
	| { kind: 'prologue' }
	| { kind: 'tray'; trayIndex: number }
	| { kind: 'confirm' };

export interface OnboardingWallSelection {
	trayIndex: number;
	piece: OnboardingWallPiece;
}

interface UseOnboardingWallFlowOptions {
	/** 설정 > 내 취향 수정(AC-6)에서는 프롤로그 없이 첫 트레이부터 시작한다 */
	startAtCuration?: boolean;
}

const TRAY_COUNT = ONBOARDING_WALL_TRAYS.length;
const MIN_SELECTIONS_TO_COMPLETE = 3;

/** "나의 첫 전시 벽" 큐레이션 상태 머신 — 온보딩과 설정 재편집이 공유한다 (AC-2, AC-3). */
export function useOnboardingWallFlow(options?: UseOnboardingWallFlowOptions) {
	const [step, setStep] = useState<OnboardingWallStep>(
		options?.startAtCuration ? { kind: 'tray', trayIndex: 0 } : { kind: 'prologue' },
	);
	const [selections, setSelections] = useState<(OnboardingWallSelection | undefined)[]>(
		() => new Array(TRAY_COUNT).fill(undefined),
	);
	// 바꾸기 진입 전 있던 단계 — 새 조각 선택 뒤 이 단계로 복귀한다
	const [resumeStep, setResumeStep] = useState<OnboardingWallStep | null>(null);
	const [lastAnnouncement, setLastAnnouncement] = useState<string | null>(null);
	// null = 새 선택으로 다음 트레이 진입(트레이 패널로 포커스), 숫자 = 바꾸기로 해당 프레임이 변경됨(프레임 칩으로 포커스)
	const [lastChangedTrayIndex, setLastChangedTrayIndex] = useState<number | null>(null);

	const filledCount = useMemo(() => selections.filter(Boolean).length, [selections]);
	const canCompleteEarly = filledCount >= MIN_SELECTIONS_TO_COMPLETE;

	const selectedGenres = useMemo(
		() =>
			selections
				.filter((s): s is OnboardingWallSelection => Boolean(s))
				.map((s) => s.piece.genre),
		[selections],
	);

	const startCuration = useCallback(() => {
		setStep({ kind: 'tray', trayIndex: 0 });
	}, []);

	const selectPiece = useCallback(
		(trayIndex: number, piece: OnboardingWallPiece) => {
			const isChange = selections[trayIndex] !== undefined;

			setSelections((prev) => {
				const next = [...prev];
				next[trayIndex] = { trayIndex, piece };
				return next;
			});

			setLastAnnouncement(
				isChange ? `${piece.genre}로 바꿨어요.` : `${piece.genre}를 벽에 걸었어요. ${filledCount + 1}/5.`,
			);
			setLastChangedTrayIndex(isChange ? trayIndex : null);

			if (resumeStep) {
				setStep(resumeStep);
				setResumeStep(null);
				return;
			}

			const nextTrayIndex = trayIndex + 1;
			if (nextTrayIndex < TRAY_COUNT) {
				setStep({ kind: 'tray', trayIndex: nextTrayIndex });
			} else {
				setStep({ kind: 'confirm' });
			}
		},
		[selections, resumeStep, filledCount],
	);

	const requestChange = useCallback(
		(trayIndex: number) => {
			setResumeStep(step);
			setStep({ kind: 'tray', trayIndex });
		},
		[step],
	);

	const completeEarly = useCallback(() => {
		if (!canCompleteEarly) return;
		setStep({ kind: 'confirm' });
	}, [canCompleteEarly]);

	const restart = useCallback(() => {
		setSelections(new Array(TRAY_COUNT).fill(undefined));
		setResumeStep(null);
		setStep({ kind: 'tray', trayIndex: 0 });
	}, []);

	return {
		step,
		trays: ONBOARDING_WALL_TRAYS,
		selections,
		filledCount,
		canCompleteEarly,
		selectedGenres,
		lastAnnouncement,
		lastChangedTrayIndex,
		startCuration,
		selectPiece,
		requestChange,
		completeEarly,
		restart,
	};
}
