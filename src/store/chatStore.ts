import { create } from 'zustand';

export type Message = {
	id: string;
	role: 'user' | 'assistant';
	text: string;
	isError?: boolean;
};

type ChatStore = {
	messages: Message[];
	history: { role: 'user' | 'assistant'; content: string }[];
	addMessage: (msg: Message) => void;
	updateMessage: (id: string, text: string) => void;
	markError: (id: string) => void;
	pushHistory: (entry: { role: 'user' | 'assistant'; content: string }) => void;
	clear: () => void;
};

export const useChatStore = create<ChatStore>((set) => ({
	messages: [],
	history: [],
	addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
	updateMessage: (id, text) =>
		set((s) => ({
			messages: s.messages.map((m) => (m.id === id ? { ...m, text, isError: false } : m)),
		})),
	markError: (id) =>
		set((s) => ({
			messages: s.messages.map((m) => (m.id === id ? { ...m, isError: true } : m)),
		})),
	pushHistory: (entry) => set((s) => ({ history: [...s.history, entry] })),
	clear: () => set({ messages: [], history: [] }),
}));
