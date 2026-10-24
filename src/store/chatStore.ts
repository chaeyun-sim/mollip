import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Message = {
	id: string;
	role: 'user' | 'assistant';
	text: string;
	isError?: boolean;
};

type HistoryEntry = { role: 'user' | 'assistant'; content: string };

type ChatSession = {
	messages: Message[];
	history: HistoryEntry[];
};

export type ChatDraft = {
	text: string;
	expiresAt: number;
};

type ChatStore = {
	sessions: Record<string, ChatSession>;
	drafts: Record<string, ChatDraft>;
	getMessages: (sessionId: string) => Message[];
	getHistory: (sessionId: string) => HistoryEntry[];
	addMessage: (sessionId: string, msg: Message) => void;
	updateMessage: (sessionId: string, id: string, text: string) => void;
	markError: (sessionId: string, id: string) => void;
	pushHistory: (sessionId: string, entry: HistoryEntry) => void;
	removeMessage: (sessionId: string, id: string) => void;
	popHistory: (sessionId: string) => void;
	setDraft: (sessionId: string, text: string) => void;
	getDraft: (sessionId: string) => string;
	clearDraft: (sessionId: string) => void;
	/** 저장돼 있던 메시지를 세션에 다시 채워넣는다 (재생목록에서 작품 재진입 시 대화 복원용) */
	seedMessages: (sessionId: string, messages: Message[]) => void;
	/** 해설 화면 언마운트 시 해당 세션 데이터를 메모리에서 제거 */
	flushSession: (sessionId: string) => void;
	flushExhibitionSessions: () => void;
	/** @deprecated 세션별 관리로 전환됨 — 각 해설은 고유 sessionId를 사용하므로 호출 불필요 */
	clear: () => void;
};

const empty = (): ChatSession => ({ messages: [], history: [] });

export const EXHIBITION_CHAT_PREFIX = 'exhibition-chat-';
export const CHAT_DRAFT_TTL_MS = 12 * 60 * 60 * 1000;

export const isExhibitionChatSession = (sessionId: string): boolean =>
	sessionId.startsWith(EXHIBITION_CHAT_PREFIX);

export const pickPersistedChatSessions = (
	sessions: Record<string, ChatSession>,
): Record<string, ChatSession> =>
	Object.fromEntries(Object.entries(sessions).filter(([id]) => isExhibitionChatSession(id)));

export const pruneExpiredDrafts = (
	drafts: Record<string, ChatDraft>,
	now = Date.now(),
): Record<string, ChatDraft> =>
	Object.fromEntries(
		Object.entries(drafts).filter(
			([, draft]) => draft.expiresAt > now && draft.text.trim().length > 0,
		),
	);

const patch = (
	sessions: Record<string, ChatSession>,
	sessionId: string,
	updater: (s: ChatSession) => Partial<ChatSession>,
) => {
	const current = sessions[sessionId] ?? empty();
	return { sessions: { ...sessions, [sessionId]: { ...current, ...updater(current) } } };
};

export const useChatStore = create<ChatStore>()(
	persist(
		(set, get) => ({
			sessions: {},
			drafts: {},
			getMessages: (sessionId) => get().sessions[sessionId]?.messages ?? [],
			getHistory: (sessionId) => get().sessions[sessionId]?.history ?? [],
			addMessage: (sessionId, msg) =>
				set((s) => patch(s.sessions, sessionId, (c) => ({ messages: [...c.messages, msg] }))),
			updateMessage: (sessionId, id, text) =>
				set((s) =>
					patch(s.sessions, sessionId, (c) => ({
						messages: c.messages.map((m) => (m.id === id ? { ...m, text, isError: false } : m)),
					})),
				),
			markError: (sessionId, id) =>
				set((s) =>
					patch(s.sessions, sessionId, (c) => ({
						messages: c.messages.map((m) => (m.id === id ? { ...m, isError: true } : m)),
					})),
				),
			pushHistory: (sessionId, entry) =>
				set((s) => patch(s.sessions, sessionId, (c) => ({ history: [...c.history, entry] }))),
			removeMessage: (sessionId, id) =>
				set((s) =>
					patch(s.sessions, sessionId, (c) => ({
						messages: c.messages.filter((m) => m.id !== id),
					})),
				),
			popHistory: (sessionId) =>
				set((s) => patch(s.sessions, sessionId, (c) => ({ history: c.history.slice(0, -1) }))),
			seedMessages: (sessionId, messages) =>
				set((s) =>
					patch(s.sessions, sessionId, () => ({
						messages,
						history: messages
							.filter((m) => !m.isError)
							.map(({ role, text }) => ({ role, content: text })),
					})),
				),
			setDraft: (sessionId, text) => {
				if (!isExhibitionChatSession(sessionId)) return;
				set((s) => {
					const drafts = { ...s.drafts };
					const trimmed = text.trim();
					if (!trimmed) {
						delete drafts[sessionId];
						return { drafts };
					}
					drafts[sessionId] = { text, expiresAt: Date.now() + CHAT_DRAFT_TTL_MS };
					return { drafts };
				});
			},
			getDraft: (sessionId) => {
				const draft = get().drafts[sessionId];
				if (!draft || draft.expiresAt <= Date.now()) return '';
				return draft.text;
			},
			clearDraft: (sessionId) =>
				set((s) => {
					if (!s.drafts[sessionId]) return s;
					const drafts = { ...s.drafts };
					delete drafts[sessionId];
					return { drafts };
				}),
			flushSession: (sessionId) =>
				set((s) => {
					const sessions = { ...s.sessions };
					delete sessions[sessionId];
					const drafts = { ...s.drafts };
					delete drafts[sessionId];
					return { sessions, drafts };
				}),
			flushExhibitionSessions: () =>
				set((s) => ({
					sessions: Object.fromEntries(
						Object.entries(s.sessions).filter(([id]) => !isExhibitionChatSession(id)),
					),
					drafts: Object.fromEntries(
						Object.entries(s.drafts).filter(([id]) => !isExhibitionChatSession(id)),
					),
				})),
			clear: () => {},
		}),
		{
			name: 'chat-store',
			storage: createJSONStorage(() => AsyncStorage),
			partialize: (state) => ({
				sessions: pickPersistedChatSessions(state.sessions),
				drafts: pruneExpiredDrafts(state.drafts),
			}),
			onRehydrateStorage: () => (state, error) => {
				if (error) console.warn('[chat] rehydrate failed:', error);
				if (!state) return;
				useChatStore.setState({
					sessions: pickPersistedChatSessions(state.sessions),
					drafts: pruneExpiredDrafts(state.drafts),
				});
			},
		},
	),
);
