import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { migrateEssayIntoMemo } from '../utils/migrateEssayIntoMemo';
import {
	deleteLocalVisit,
	loadAllLocalVisits,
	migrateVisitsFromAsyncStorage,
	persistAllLocalVisits,
	upsertLocalVisit,
} from '../utils/localVisitDb';
import { supabase } from '../utils/supabase';
import { deleteManagedVisitPhotos, persistLocalVisitPhoto } from '../utils/visitPhotoFiles';
import {
	dateKeyFrom,
	dateKeyOf,
	localVisitKeyFromRemote,
	makeVisitKey,
	todayKey,
	visitIdentityOf,
} from '../utils/visitKey';

export { dateKeyFrom, dateKeyOf, localVisitKeyFromRemote, makeVisitKey, todayKey, visitIdentityOf };

export interface ListenedItem {
	title: string;
	imageUrl?: string;
	/** 생성된 해설 앞부분 — 아카이브에서 다시 읽기용 */
	descriptionPreview?: string;
}

// 관람 기록 한 건: 어떤 전시를 언제 관람했는지 + 들은 해설 목록 + 사용자 메모
export interface DayVisit {
	exhibitionId: string | null;
	exhibitionTitle?: string;
	venue?: string;
	thumbnail?: string;
	/** 티켓 인증 때 올린 전시장·현장 사진 */
	venuePhotos?: string[];
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

/** 티켓 인증으로 남긴 관람 — 직접 올린 티켓 사진이 있으면 몰입 기록과 구분한다 */
export const isTicketVisit = (visit: DayVisit): boolean => {
	return Boolean(visit.thumbnail) || (visit.venuePhotos?.length ?? 0) > 0;
};

interface VisitStore {
	// "날짜::전시식별자" 키별 관람 기록 (makeVisitKey 참고)
	visits: Record<string, DayVisit>;
	recordExhibition: (
		dateKey: string,
		exhibitionId: string | null,
		meta?: { title?: string; venue?: string; thumbnail?: string; venuePhotos?: string[] },
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
	/** 티켓 인증 후 티켓/현장 사진을 다시 올려 교체 */
	updateVisitPhotos: (
		visitKey: string,
		patch: { thumbnail?: string; venuePhotos?: string[] },
	) => void;
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
	/** 게스트 SQLite에서 관람 기록을 읽어 메모리에 올린다 */
	hydrateFromLocalDb: () => Promise<void>;
}

const PENDING_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const VISIT_CONFLICT = 'user_id,visit_key,date';

const persistVisit = (key: string, visit: DayVisit | undefined): void => {
	if (!visit) return;
	upsertLocalVisit(key, visit, Boolean(useAuthStore.getState().session));
};

const remoteExhibitionId = (exhibitionId: string | null | undefined): number | null => {
	return exhibitionId ? Number(exhibitionId) || null : null;
};

/** 관람일(date) + 전시 식별(visit_key)로 upsert — 티켓은 고른 관람일, 몰입은 가이드 당일 */
export const upsertRemoteVisit = (
	userId: string,
	visitKey: string,
	patch: {
		exhibition_id?: number | null;
		exhibition_title?: string | null;
		venue?: string | null;
		memo?: string | null;
		ticket_photo_url?: string | null;
		venue_photo_urls?: string[];
	},
): void => {
	void supabase
		.from('visits')
		.upsert(
			{
				user_id: userId,
				visit_key: visitIdentityOf(visitKey),
				date: dateKeyOf(visitKey),
				...patch,
			},
			{ onConflict: VISIT_CONFLICT },
		)
		.then(({ error }) => {
			if (error) console.warn('[visit] upsert failed:', error.message);
		});
};

export const useVisitStore = create<VisitStore>()((set, get) => ({
	visits: {},
	recordExhibition: (dateKey, exhibitionId, meta) => {
		const key = makeVisitKey(dateKey, exhibitionId, meta?.title);
		const thumbnail = meta?.thumbnail
			? (persistLocalVisitPhoto(meta.thumbnail) ?? undefined)
			: undefined;
		const venuePhotos = meta?.venuePhotos
			?.map((uri) => persistLocalVisitPhoto(uri))
			.filter((uri): uri is string => Boolean(uri));
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
						thumbnail: thumbnail ?? prev?.thumbnail,
						venuePhotos: venuePhotos ?? prev?.venuePhotos,
						listened: prev?.listened ?? [],
						// 완전히 새 기록일 때만 in_progress로 시작 — 이어듣기(같은 키)면 기존 상태 유지
						status: prev?.status ?? 'in_progress',
					},
				},
			};
		});

		const userId = useAuthStore.getState().user?.id;
		if (userId) {
			upsertRemoteVisit(userId, key, {
				exhibition_id: remoteExhibitionId(exhibitionId),
				exhibition_title: meta?.title ?? null,
				venue: meta?.venue ?? null,
				...(meta?.thumbnail ? { ticket_photo_url: meta.thumbnail } : {}),
				...(meta?.venuePhotos ? { venue_photo_urls: meta.venuePhotos } : {}),
			});
		}
		persistVisit(key, get().visits[key]);
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
		persistVisit(key, get().visits[key]);
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
			upsertRemoteVisit(userId, visitKey, { memo });
		}
		persistVisit(visitKey, get().visits[visitKey]);
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
		persistVisit(visitKey, get().visits[visitKey]);
	},
	updateVisitPhotos: (visitKey, patch) => {
		const thumbnail =
			patch.thumbnail !== undefined
				? (persistLocalVisitPhoto(patch.thumbnail) ?? undefined)
				: undefined;
		const venuePhotos = patch.venuePhotos
			?.map((uri) => persistLocalVisitPhoto(uri))
			.filter((uri): uri is string => Boolean(uri));

		set((state) => {
			const prev = state.visits[visitKey];
			if (!prev) return state;
			return {
				visits: {
					...state.visits,
					[visitKey]: {
						...prev,
						thumbnail: thumbnail ?? prev.thumbnail,
						venuePhotos: venuePhotos ?? prev.venuePhotos,
					},
				},
			};
		});

		const userId = useAuthStore.getState().user?.id;
		if (userId) {
			upsertRemoteVisit(userId, visitKey, {
				...(thumbnail ? { ticket_photo_url: thumbnail } : {}),
				...(venuePhotos ? { venue_photo_urls: venuePhotos } : {}),
			});
		}
		persistVisit(visitKey, get().visits[visitKey]);
	},
	deleteVisit: async (visitKey) => {
		deleteManagedVisitPhotos(get().visits[visitKey]);
		deleteLocalVisit(visitKey);
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
				.eq('visit_key', visitIdentityOf(visitKey))
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
		persistVisit(visitKey, get().visits[visitKey]);

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
			if (userId) upsertRemoteVisit(userId, visitKey, { memo });
		}
		persistVisit(visitKey, get().visits[visitKey]);
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
		get()._migrateLegacyStatus();
		get()._migrateEssayToMemo();
		persistAllLocalVisits(get().visits, true);
	},
	hydrateFromLocalDb: async () => {
		if (useAuthStore.getState().session) return;
		await migrateVisitsFromAsyncStorage();
		set({ visits: loadAllLocalVisits() });
		get()._migrateLegacyStatus();
		get()._migrateEssayToMemo();
	},
}));
