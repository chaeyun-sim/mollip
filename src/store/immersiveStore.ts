import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useArtistIntroStore } from './artistIntroStore';
import { useChatStore } from './chatStore';
import { useHistoryStore } from './historyStore';
import { makeVisitKey, todayKey, useVisitStore } from './visitStore';
import { createAuthAwareStorage } from '../utils/authAwareStorage';

export interface PlaylistItem {
	id: string;
	title: string;
	artist?: string;
	year?: string;
	imageUrl?: string;
	description: string;
	addedAt: number;
}

interface ImmersiveStore {
	_hasHydrated: boolean;
	setHasHydrated: (value: boolean) => void;
	isImmersiveMode: boolean;
	exhibitionId: string | null;
	exhibitionTitle: string | null;
	/** 몰입모드 진입 시각(ms epoch) — 종료 시 관람 시간 계산용 */
	enteredAt: number | null;
	/** "이 전시에 대해 묻기" 채팅 세션 id — 진입 시 한 번 발급, 종료 시 이 id로 대화 내용을 저장 */
	chatSessionId: string | null;
	playlist: PlaylistItem[];
	enter: (exhibitionId: string | null, exhibitionTitle?: string) => void;
	exit: () => void;
	addToPlaylist: (item: Omit<PlaylistItem, 'id' | 'addedAt'>) => void;
}

export const useImmersiveStore = create<ImmersiveStore>()(
	persist(
		(set, get) => ({
			_hasHydrated: false,
			setHasHydrated: (value) => set({ _hasHydrated: value }),
			isImmersiveMode: false,
			exhibitionId: null,
			exhibitionTitle: null,
			enteredAt: null,
			chatSessionId: null,
			playlist: [],
			enter: (exhibitionId, exhibitionTitle) => {
				set({
					isImmersiveMode: true,
					exhibitionId,
					exhibitionTitle: exhibitionTitle ?? null,
					enteredAt: Date.now(),
					chatSessionId: `exhibition-chat-${Date.now()}`,
					playlist: [],
				});
				// 몰입 시작은 항상 작가 소개 준비를 함께 트리거한다. artist가 없거나 id가 없으면
				// artistIntroStore.prepare가 내부에서 조용히 스킵한다.
				useArtistIntroStore.getState().prepare(exhibitionId, exhibitionTitle);
			},
			exit: () => {
				// 관람 종료 시 오늘 기록을 미확정(pending) 상태로 전환 — 다이어리 탭에서 모아서 확정한다.
				const { enteredAt, exhibitionId, exhibitionTitle, chatSessionId } = get();
				if (enteredAt) {
					const visitKey = makeVisitKey(todayKey(), exhibitionId, exhibitionTitle ?? undefined);
					useVisitStore.getState().markPending(visitKey, {
						start: new Date(enteredAt).toISOString(),
						end: new Date().toISOString(),
					});
				}

				// "이 전시에 대해 묻기" 채팅 — 대화가 있었으면 historyStore에 저장해둔다.
				// 여기(종료 시점)에서 딱 한 번 저장하는 게 재생목록 화면 focus 시점에 의존하는
				// 것보다 확실하다 — 채팅 화면에서 바로 다른 경로로 나가도 유실되지 않는다.
				if (chatSessionId) {
					const msgs = useChatStore.getState().getMessages(chatSessionId);
					const chatMsgs = msgs
						.filter((m) => !m.isError)
						.map(({ id, role, text }) => ({ id, role, text }));
					if (chatMsgs.length > 0) {
						useHistoryStore.getState().add({
							title: exhibitionTitle || '전시 채팅',
							text: '',
							chatMessages: chatMsgs,
						});
					}
				}

				// 관람 종료 시 작가 소개 세션 상태도 함께 비운다 — 다음 전시에 이전 트랙이 남지 않도록.
				// (전역 캐시 테이블 데이터는 유지된다)
				useArtistIntroStore.getState().reset();
				set({
					isImmersiveMode: false,
					exhibitionId: null,
					exhibitionTitle: null,
					enteredAt: null,
					chatSessionId: null,
					playlist: [],
				});
			},
			addToPlaylist: (item) => {
				const exists = get().playlist.some((p) => p.title === item.title);
				if (exists) return;
				set((state) => ({
					playlist: [
						...state.playlist,
						{ ...item, id: `${Date.now()}-${Math.random()}`, addedAt: Date.now() },
					],
				}));
			},
		}),
		{
			name: 'immersive-store',
			storage: createJSONStorage(createAuthAwareStorage),
			partialize: (state) => ({
				isImmersiveMode: state.isImmersiveMode,
				exhibitionId: state.exhibitionId,
				exhibitionTitle: state.exhibitionTitle,
				enteredAt: state.enteredAt,
				chatSessionId: state.chatSessionId,
			}),
			onRehydrateStorage: () => (state, error) => {
				if (error) console.warn('[immersive] rehydrate failed:', error);
				useImmersiveStore.getState().setHasHydrated(true);
			},
		},
	),
);
