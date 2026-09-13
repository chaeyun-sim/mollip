import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';
import { migrateEssayIntoMemo } from '../utils/migrateEssayIntoMemo';
import { supabase } from '../utils/supabase';

export interface ListenedItem {
	title: string;
	imageUrl?: string;
	/** 생성된 해설 앞부분 — 아카이브에서 다시 읽기용 */
	descriptionPreview?: string;
}

/** 관람 기록 오늘 날짜 키(YYYY-MM-DD) — visitStore 소비처 공용 */
export function todayKey(): string {
	return new Date().toISOString().slice(0, 10);
}

/**
 * visits의 키 = "날짜::전시식별자" — 하루에 전시를 여러 개 봐도 서로 안 겹치게 한다.
 * 같은 전시(id 같음, 또는 id 없이 같은 제목)를 같은 날 또 들으면 같은 키로 합쳐진다.
 * exhibitionId가 있으면 id로, 검색 없이 직접 입력한 경우(id 없음)는 제목으로 식별한다.
 */
export function makeVisitKey(dateKey: string, exhibitionId: string | null, title?: string): string {
	const idPart = exhibitionId ? `id:${exhibitionId}` : title ? `t:${title}` : 'manual';
	return `${dateKey}::${idPart}`;
}

/** visits 키에서 날짜 부분만 뽑아낸다 — 캘린더/그룹핑용 */
export function dateKeyOf(visitKey: string): string {
	return visitKey.split('::')[0];
}

// 관람 기록 한 건: 어떤 전시를 언제 관람했는지 + 들은 해설 목록 + 사용자 메모
export interface DayVisit {
	exhibitionId: string | null;
	exhibitionTitle?: string;
	venue?: string;
	thumbnail?: string;
	listened: ListenedItem[];
	/** 사용자가 직접 적는 관람 메모 (티켓 뒷면) */
	memo?: string;
	/**
	 * 관람 확정 상태.
	 * - 'in_progress': 몰입모드 진행 중, 아직 종료 안 함(다이어리에 노출 안 됨)
	 * - 'pending': 오디오가이드 종료 후 서명 확정 전(다이어리에 노출 안 됨, 배너로만 안내)
	 * - 'confirmed': 서명 확정 완료(캘린더/그리드에 우표로 노출)
	 * - undefined: 이 필드가 생기기 전(레거시) 데이터 — 하이드레이션 시 1회성으로 'confirmed'로 마이그레이션된다.
	 *   'in_progress'는 명시적인 값이라 이 마이그레이션 대상이 아니다 — undefined와 혼동되지 않는다.
	 */
	status?: 'in_progress' | 'pending' | 'confirmed';
	/** pending으로 전환된 시각(ISO) — 7일 만료 계산 기준 */
	pendingSince?: string;
	/** 손그림 서명 SVG 마크업 (react-native-svg SvgXml로 재생) */
	signatureSvg?: string;
	/** 관람 시작~종료 시각(ISO) — 몰입모드 진입~종료 기준 */
	visitedAt?: { start: string; end: string };
	/** 확정 큐에서 매긴 별점(1~5) — Supabase에 컬럼이 없어 로컬 전용 */
	rating?: number;
	/**
	 * rev1에서 한줄평과 분리 저장하던 감상문. rev2부터는 `memo`로 이관하고 이 필드는 쓰지 않는다.
	 * persist된 옛 기록을 읽은 뒤에만 잠시 존재하며, `migrateEssayIntoMemo`가 제거한다.
	 */
	essay?: string;
}

interface VisitStore {
	// "날짜::전시식별자" 키별 관람 기록 (makeVisitKey 참고)
	visits: Record<string, DayVisit>;
	recordExhibition: (
		dateKey: string,
		exhibitionId: string | null,
		meta?: { title?: string; venue?: string; thumbnail?: string },
	) => void;
	recordListened: (
		dateKey: string,
		exhibitionId: string | null,
		title: string | undefined,
		item: ListenedItem,
	) => void;
	setVisitMemo: (visitKey: string, memo: string) => void;
	/** 별점(1~5) 수정 — Supabase에 컬럼이 없어 로컬 전용 */
	setVisitRating: (visitKey: string, rating: number) => void;
	deleteVisit: (visitKey: string) => Promise<void>;
	/** 오디오가이드 종료 시 해당 기록을 미확정(pending) 상태로 전환 */
	markPending: (visitKey: string, meta: { start: string; end: string }) => void;
	/** 확정 큐에서 별점/감상평/서명 후 관람 기록을 확정(confirmed) 상태로 전환 */
	confirmVisit: (
		visitKey: string,
		meta: { signatureSvg: string; rating?: number; memo?: string },
	) => void;
	/** pending 상태로 7일이 지난 기록을 자동 삭제 */
	pruneExpiredPending: () => Promise<void>;
	/** 레거시(status 필드 없는) 기록을 confirmed로 일괄 마이그레이션 — 하이드레이션 1회용 */
	_migrateLegacyStatus: () => void;
	/** persist된 rev1 `essay` 필드를 `memo`로 이관 — 하이드레이션 1회용 */
	_migrateEssayToMemo: () => void;
	/** 로그인 후 원격 visits로 로컬 상태를 교체 */
	loadFromRemote: (visits: Record<string, DayVisit>) => void;
}

const PENDING_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export const useVisitStore = create<VisitStore>()(
	persist(
		(set, get) => ({
			visits: {},
			recordExhibition: (dateKey, exhibitionId, meta) => {
				const key = makeVisitKey(dateKey, exhibitionId, meta?.title);
				set((state) => {
					const prev = state.visits[key];
					return {
						visits: {
							...state.visits,
							[key]: {
								...prev,
								exhibitionId,
								exhibitionTitle: meta?.title ?? prev?.exhibitionTitle,
								venue: meta?.venue ?? prev?.venue,
								thumbnail: meta?.thumbnail ?? prev?.thumbnail,
								listened: prev?.listened ?? [],
								// 완전히 새 기록일 때만 in_progress로 시작 — 이어듣기(같은 키)면 기존 상태 유지
								status: prev?.status ?? 'in_progress',
							},
						},
					};
				});

				if (!exhibitionId) return;

				const userId = useAuthStore.getState().user?.id;
				if (userId) {
					// Supabase `visits`는 아직 (user_id, date) 단일 행 전제라 하루 중 마지막 전시만
					// 원격에 반영된다 — 로컬은 makeVisitKey로 여러 개를 보존하지만 원격 동기화는
					// 스키마 마이그레이션 전까지 이 한계가 남는다(01-spec.md Risks 참고).
					supabase
						.from('visits')
						.upsert({
							user_id: userId,
							date: dateKey,
							exhibition_id: Number(exhibitionId) || null,
							exhibition_title: meta?.title ?? null,
							venue: meta?.venue ?? null,
						})
						.then(({ error }) => {
							if (error) console.warn('[visit] upsert failed:', error.message);
						});
				}
			},
			recordListened: (dateKey, exhibitionId, title, item) => {
				const key = makeVisitKey(dateKey, exhibitionId, title);
				set((state) => {
					const prev = state.visits[key] ?? { exhibitionId, exhibitionTitle: title, listened: [] };
					// 같은 제목은 하루에 한 번만 기록
					if (prev.listened.some((l) => l.title === item.title)) return state;
					return {
						visits: {
							...state.visits,
							[key]: { ...prev, listened: [...prev.listened, item] },
						},
					};
				});
			},
			setVisitMemo: (visitKey, memo) => {
				set((state) => {
					const prev = state.visits[visitKey] ?? { exhibitionId: null, listened: [] };
					return {
						visits: {
							...state.visits,
							[visitKey]: { ...prev, memo },
						},
					};
				});

				const userId = useAuthStore.getState().user?.id;
				if (userId) {
					supabase
						.from('visits')
						.upsert({ user_id: userId, date: dateKeyOf(visitKey), memo })
						.then(({ error }) => {
							if (error) console.warn('[visit] memo upsert failed:', error.message);
						});
				}
			},
			setVisitRating: (visitKey, rating) => {
				set((state) => {
					const prev = state.visits[visitKey] ?? { exhibitionId: null, listened: [] };
					return {
						visits: {
							...state.visits,
							[visitKey]: { ...prev, rating },
						},
					};
				});
			},
			deleteVisit: async (visitKey) => {
				set((state) => {
					const next = { ...state.visits };
					delete next[visitKey];
					return { visits: next };
				});

				const userId = useAuthStore.getState().user?.id;
				if (userId) {
					const { error } = await supabase
						.from('visits')
						.delete()
						.eq('user_id', userId)
						.eq('date', dateKeyOf(visitKey));
					if (error) console.warn('[visit] delete failed:', error.message);
				}
			},
			markPending: (visitKey, meta) => {
				set((state) => {
					const prev = state.visits[visitKey];
					if (!prev || prev.status === 'confirmed') return state;
					return {
						visits: {
							...state.visits,
							[visitKey]: {
								...prev,
								status: 'pending',
								pendingSince: new Date().toISOString(),
								visitedAt: meta,
							},
						},
					};
				});

				// Supabase `visits` 테이블에 status/visit_started_at/visit_ended_at 컬럼이 아직 없음
				// (01-spec.md Risks 참고) — 마이그레이션 전까지 로컬 저장만 수행
			},
			confirmVisit: (visitKey, meta) => {
				set((state) => {
					const prev = state.visits[visitKey];
					if (!prev) return state;
					const next = {
						...prev,
						status: 'confirmed' as const,
						signatureSvg: meta.signatureSvg,
						rating: meta.rating ?? prev.rating,
						memo: meta.memo !== undefined ? meta.memo : prev.memo,
					};
					delete next.essay;
					delete next.pendingSince;
					return { visits: { ...state.visits, [visitKey]: next } };
				});

				// 위와 동일한 이유로 원격 동기화는 마이그레이션 이후로 보류
				const memo = meta.memo;
				if (memo) {
					const userId = useAuthStore.getState().user?.id;
					if (userId) {
						supabase
							.from('visits')
							.upsert({ user_id: userId, date: dateKeyOf(visitKey), memo })
							.then(({ error }) => {
								if (error) console.warn('[visit] memo upsert failed:', error.message);
							});
					}
				}
			},
			pruneExpiredPending: async () => {
				const now = Date.now();
				const expiredKeys = Object.entries(get().visits)
					.filter(
						([, v]) =>
							v.status === 'pending' &&
							v.pendingSince &&
							now - new Date(v.pendingSince).getTime() > PENDING_EXPIRY_MS,
					)
					.map(([k]) => k);
				await Promise.all(expiredKeys.map((k) => get().deleteVisit(k)));
			},
			_migrateLegacyStatus: () => {
				set((state) => {
					let changed = false;
					const next = { ...state.visits };
					for (const [k, v] of Object.entries(next)) {
						// exhibitionTitle 유무로 판단 — exhibitionId는 검색 제안을 선택했을 때만
						// 채워지므로, 직접 입력한 레거시 기록(exhibitionId: null)도 놓치지 않는다.
						if (v.exhibitionTitle && !v.status) {
							next[k] = { ...v, status: 'confirmed' };
							changed = true;
						}
					}
					return changed ? { visits: next } : state;
				});
			},
			_migrateEssayToMemo: () => {
				set((state) => {
					let changed = false;
					const next = { ...state.visits };
					for (const [k, v] of Object.entries(next)) {
						if (v.essay === undefined) continue;
						next[k] = migrateEssayIntoMemo(v);
						changed = true;
					}
					return changed ? { visits: next } : state;
				});
			},
			loadFromRemote: (visits) => {
				set({ visits });
				// 원격 데이터에도 status 컬럼이 없으므로 하이드레이션과 동일한 마이그레이션을 적용
				get()._migrateLegacyStatus();
				get()._migrateEssayToMemo();
			},
		}),
		{
			name: 'visits',
			// authAwareStorage(로그인 시 AsyncStorage read/write 스킵, DB를 단일 소스로 취급)를 쓰지 않는다.
			// status/pendingSince/signatureSvg/visitedAt은 아직 Supabase 컬럼이 없어서 DB로 대체될 수
			// 없는데, 로그인 상태에서 로컬 저장까지 건너뛰면 리로드마다 이 필드들이 통째로 사라져서
			// pending/in_progress가 undefined로 되돌아가고 레거시 마이그레이션이 confirmed로 잘못
			// 승격시켰다 — 로그인 여부와 무관하게 항상 로컬에 저장해서 막는다. exhibitionId/title/venue/
			// memo 같은 DB 동기화 필드는 useVisitSync가 매 마운트마다 원격 값으로 덮어써서 계속 맞는다.
			storage: createJSONStorage(() => AsyncStorage),
			onRehydrateStorage: () => (state) => {
				state?._migrateLegacyStatus();
				state?._migrateEssayToMemo();
			},
		},
	),
);
