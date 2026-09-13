import { create } from 'zustand';

import { fetchTTSBlob } from '@/src/utils/api';
import {
	deleteAllOfflineAudio,
	deleteOfflineAudio,
	saveOfflineAudioFromDataUri,
} from '@/src/utils/offlineAudio';
import { cleanTextForTTS } from '@/src/utils/text';

export type DownloadStatus = 'idle' | 'loading' | 'done' | 'failed';

/**
 * 다운로드/재생/삭제 지점 전부가 동일한 캐시 키를 만들도록 통일한 헬퍼(useTTS.ts와 동일 조합).
 * AC-5·AC-6의 삭제 대상 파일도 이 키로 찾는다.
 */
export function computeCacheKey(text: string, voiceId: string, voiceSpeed: number): string {
	return `${voiceId}\x00${voiceSpeed}\x00${cleanTextForTTS(text)}`;
}

export interface DownloadTarget {
	/** 재생목록 항목의 id, 또는 작가 소개 트랙을 가리키는 고정 id('artist-intro'). */
	id: string;
	/** TTS로 변환할 원문 — 재생목록 항목의 description 또는 작가 소개 text. */
	text: string;
}

interface OfflineDownloadState {
	statuses: Record<string, DownloadStatus>;
	/** 가장 최근 startDownload 호출에서 실제로 처리한(idle이었던) id 목록 — 진행률 N/M 계산용. */
	batchIds: string[];
	/**
	 * 대상 중 idle 상태인 항목만 골라 다운로드를 시작한다(States "Row A '받기'의 대상 범위" —
	 * failed 항목은 개별 재시도로만 처리하며 이 액션의 대상이 아니다).
	 */
	startDownload: (targets: DownloadTarget[], voiceId: string, voiceSpeed: number) => Promise<void>;
	/**
	 * 실패(failed) 항목 1개만 재시도한다(AC-4). 다른 항목의 상태·진행 중인 배치(batchIds)에는
	 * 영향을 주지 않는다 — "다른 항목의 다운로드 진행은 실패와 무관하게 계속된다" 요구.
	 */
	retryDownload: (
		id: string,
		text: string,
		voiceId: string,
		voiceSpeed: number,
	) => Promise<void>;
	/** 항목 1개의 다운로드 파일만 삭제하고 상태를 idle로 되돌린다(AC-6). */
	deleteDownload: (id: string, cacheKey: string) => void;
	/** 다운로드된 오디오 파일 전체를 삭제하고, 대상 id들의 상태를 idle로 되돌린다(AC-5). */
	deleteAllDownloads: (ids: string[]) => void;
	reset: () => void;
}

export const useOfflineDownloadStore = create<OfflineDownloadState>()((set, get) => ({
	statuses: {},
	batchIds: [],

	startDownload: async (targets, voiceId, voiceSpeed) => {
		const idleTargets = targets.filter((t) => (get().statuses[t.id] ?? 'idle') === 'idle');
		if (idleTargets.length === 0) return;

		set((state) => ({
			batchIds: idleTargets.map((t) => t.id),
			statuses: idleTargets.reduce(
				(acc, t) => ({ ...acc, [t.id]: 'loading' as DownloadStatus }),
				{ ...state.statuses },
			),
		}));

		await Promise.all(
			idleTargets.map(async (target) => {
				try {
					const cacheKey = computeCacheKey(target.text, voiceId, voiceSpeed);
					const dataUri = await fetchTTSBlob(voiceId, cleanTextForTTS(target.text), voiceSpeed);
					saveOfflineAudioFromDataUri(cacheKey, dataUri);
					set((state) => ({ statuses: { ...state.statuses, [target.id]: 'done' } }));
				} catch {
					set((state) => ({ statuses: { ...state.statuses, [target.id]: 'failed' } }));
				}
			}),
		);
	},

	retryDownload: async (id, text, voiceId, voiceSpeed) => {
		set((state) => ({ statuses: { ...state.statuses, [id]: 'loading' } }));

		try {
			const cacheKey = computeCacheKey(text, voiceId, voiceSpeed);
			const dataUri = await fetchTTSBlob(voiceId, cleanTextForTTS(text), voiceSpeed);
			saveOfflineAudioFromDataUri(cacheKey, dataUri);
			set((state) => ({ statuses: { ...state.statuses, [id]: 'done' } }));
		} catch {
			set((state) => ({ statuses: { ...state.statuses, [id]: 'failed' } }));
		}
	},

	deleteDownload: (id, cacheKey) => {
		deleteOfflineAudio(cacheKey);
		set((state) => ({ statuses: { ...state.statuses, [id]: 'idle' } }));
	},

	deleteAllDownloads: (ids) => {
		deleteAllOfflineAudio();
		set((state) => ({
			statuses: ids.reduce(
				(acc, id) => ({ ...acc, [id]: 'idle' as DownloadStatus }),
				{ ...state.statuses },
			),
		}));
	},

	reset: () => set({ statuses: {}, batchIds: [] }),
}));

// -- 순수 헬퍼 (Row A 표시 조건 / 버튼 활성화 판단 — 단위 테스트 가능, 컴포넌트에서 선택자로 사용) --

export function getIdleIds(ids: string[], statuses: Record<string, DownloadStatus>): string[] {
	return ids.filter((id) => (statuses[id] ?? 'idle') === 'idle');
}

/** "받기" 버튼 활성화 조건 — idle 항목이 1개 이상 있어야 한다(실패만 있으면 비활성, iteration 4 지적사항). */
export function hasIdle(ids: string[], statuses: Record<string, DownloadStatus>): boolean {
	return getIdleIds(ids, statuses).length > 0;
}

/** Row A 노출 조건(02-design-brief.md States) — idle 또는 failed 항목이 1개 이상이면 노출한다. */
export function hasIdleOrFailed(ids: string[], statuses: Record<string, DownloadStatus>): boolean {
	return ids.some((id) => {
		const status = statuses[id] ?? 'idle';
		return status === 'idle' || status === 'failed';
	});
}

export function getBatchProgress(
	batchIds: string[],
	statuses: Record<string, DownloadStatus>,
): { done: number; total: number } {
	return {
		done: batchIds.filter((id) => statuses[id] === 'done').length,
		total: batchIds.length,
	};
}

export function isAnyLoading(ids: string[], statuses: Record<string, DownloadStatus>): boolean {
	return ids.some((id) => statuses[id] === 'loading');
}
