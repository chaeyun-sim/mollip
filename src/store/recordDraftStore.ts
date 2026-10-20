import { create } from 'zustand';
import type { FlowStep } from '@/src/utils/recordWriteFlow';
import type { Companion } from '@/src/utils/visitRecord';

/** 기록하기 3단계(입장 → 감상 → 캡션)가 함께 쓰는 작성 중 상태 — 저장하거나 나가면 비운다 */
export interface RecordDraft {
	exhibitionId: string | null;
	title: string;
	venue?: string;
	/** 전시 포스터(검색 전시) 또는 직접 기록에서 올린 포스터 로컬 uri */
	poster?: string | null;
	/** 직접 기록에서 사용자가 올린 포스터인지 — 저장 시 업로드 대상 */
	isPosterUploaded?: boolean;
	startDate?: string | null;
	endDate?: string | null;
	/** 도슨트로 남은 미확정 관람이면 방문일이 정해져 있다 (YYYY-MM-DD) */
	fixedDateKey?: string;
	/** 도슨트로 들은 작품 — 영감 한 줄 대상 칩 */
	listenedTitles?: string[];
	dateKey?: string;
	companion?: Companion;
	/** 이 전시를 다시 찾았는지 — 감상 단계의 예/아니요 선택(미선택이면 undefined), 로컬 전용 */
	isRevisit?: boolean;
	/** 지금 보여줄 단계(전시 고르기 포함) — 캡션에서 돌아와도 그 자리로 복원한다 (저장하지 않는 화면 상태) */
	writeStep?: FlowStep;
	/** 전시 고르기를 이 화면 안에서 거쳐 왔는지 — 첫 질문에서 뒤로 가면 화면을 나가지 않고 고르기로 돌아간다 */
	fromPicker?: boolean;
	/** 감상 단계에서 입력한 값 — 캡션 단계로 넘어가도 유지된다 */
	rating?: number;
	photos?: string[];
	memo?: string;
}

interface RecordDraftStore {
	draft: RecordDraft | null;
	start: (draft: RecordDraft) => void;
	patch: (patch: Partial<RecordDraft>) => void;
	reset: () => void;
}

export const useRecordDraftStore = create<RecordDraftStore>()((set) => ({
	draft: null,
	start: (draft) => set({ draft }),
	patch: (patch) => set((state) => (state.draft ? { draft: { ...state.draft, ...patch } } : state)),
	reset: () => set({ draft: null }),
}));
