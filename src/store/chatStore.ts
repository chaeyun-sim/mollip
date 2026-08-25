import { create } from 'zustand';

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

type ChatStore = {
	sessions: Record<string, ChatSession>;
	getMessages: (sessionId: string) => Message[];
	getHistory: (sessionId: string) => HistoryEntry[];
	addMessage: (sessionId: string, msg: Message) => void;
	updateMessage: (sessionId: string, id: string, text: string) => void;
	markError: (sessionId: string, id: string) => void;
	pushHistory: (sessionId: string, entry: HistoryEntry) => void;
	removeMessage: (sessionId: string, id: string) => void;
	popHistory: (sessionId: string) => void;
	/** 해설 화면 언마운트 시 해당 세션 데이터를 메모리에서 제거 */
	flushSession: (sessionId: string) => void;
	/** @deprecated 세션별 관리로 전환됨 — 각 해설은 고유 sessionId를 사용하므로 호출 불필요 */
	clear: () => void;
};

const empty = (): ChatSession => ({ messages: [], history: [] });

const patch = (
	sessions: Record<string, ChatSession>,
	sessionId: string,
	updater: (s: ChatSession) => Partial<ChatSession>,
) => {
	const current = sessions[sessionId] ?? empty();
	return { sessions: { ...sessions, [sessionId]: { ...current, ...updater(current) } } };
};

export const useChatStore = create<ChatStore>((set, get) => ({
	sessions: {},
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
	flushSession: (sessionId) =>
		set((s) => {
			const sessions = { ...s.sessions };
			delete sessions[sessionId];
			return { sessions };
		}),
	clear: () => {},
}));
