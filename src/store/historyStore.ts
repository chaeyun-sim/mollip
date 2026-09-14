import * as Crypto from 'expo-crypto';
import { create } from 'zustand';

import { useAuthStore } from './authStore';
import { supabase } from '../utils/supabase';
import type { Json } from '../types/database.types';
import {
	deleteGuestHistory,
	insertGuestHistory,
	loadAllGuestHistory,
	migrateGuestHistoryFromAsyncStorage,
	saveGuestHistoryChat,
	updateGuestHistory,
} from '../utils/guestHistoryDb';

export interface StoredChatMessage {
	id: string;
	role: 'user' | 'assistant';
	text: string;
}

export interface HistoryItem {
	id: string;
	text: string;
	title: string;
	artist?: string;
	imageUrl?: string;
	savedAt: string;
	chatMessages?: StoredChatMessage[];
}

interface HistoryStore {
	items: HistoryItem[];
	add: (item: Omit<HistoryItem, 'id' | 'savedAt'>) => string;
	remove: (id: string) => void;
	update: (id: string, patch: Partial<Omit<HistoryItem, 'id' | 'savedAt'>>) => void;
	has: (id: string) => boolean;
	saveChatMessages: (id: string, messages: StoredChatMessage[]) => void;
	/** 로그인 후 원격 오디오 가이드로 로컬 상태를 교체 */
	loadFromRemote: (items: HistoryItem[]) => void;
	/** 게스트 SQLite에서 해설·채팅을 한 번 읽어 메모리에 올린다 */
	hydrateFromGuestDb: () => Promise<void>;
	/** blind 매칭 시절 저장된 신뢰할 수 없는 위키 이미지를 일괄 제거 */
	clearUntrustedWikiImages: () => void;
}

const isGuest = (): boolean => {
	return !useAuthStore.getState().session;
};

export const useHistoryStore = create<HistoryStore>()((set, get) => ({
	items: [],
	add: (item) => {
		const id = Crypto.randomUUID();
		const savedAt = new Date().toISOString();
		const next: HistoryItem = { ...item, id, savedAt };
		set((s) => ({ items: [next, ...s.items] }));

		const userId = useAuthStore.getState().user?.id;
		if (userId) {
			supabase
				.from('audio_guides')
				.insert({
					id,
					user_id: userId,
					title: item.title,
					artist: item.artist ?? null,
					image_url: item.imageUrl ?? null,
					full_text: item.text,
					created_at: savedAt,
				})
				.then(({ error }) => {
					if (error) console.warn('[history] insert failed:', error.message);
				});
			return id;
		}

		insertGuestHistory(next);
		return id;
	},
	remove: (id) => {
		set((s) => ({ items: s.items.filter((i) => i.id !== id) }));

		const userId = useAuthStore.getState().user?.id;
		if (userId) {
			supabase
				.from('audio_guides')
				.delete()
				.match({ id, user_id: userId })
				.then(({ error }) => {
					if (error) console.warn('[history] delete failed:', error.message);
				});
			return;
		}

		deleteGuestHistory(id);
	},
	update: (id, patch) => {
		set((s) => ({
			items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
		}));

		const userId = useAuthStore.getState().user?.id;
		if (userId && patch.imageUrl !== undefined) {
			supabase
				.from('audio_guides')
				.update({ image_url: patch.imageUrl ?? null })
				.match({ id, user_id: userId })
				.then(({ error }) => {
					if (error) console.warn('[history] update failed:', error.message);
				});
			return;
		}

		if (isGuest()) {
			const item = get().items.find((i) => i.id === id);
			if (item) updateGuestHistory(item);
		}
	},
	has: (id) => get().items.some((i) => i.id === id),
	saveChatMessages: (id, messages) => {
		set((s) => ({
			items: s.items.map((i) => (i.id === id ? { ...i, chatMessages: messages } : i)),
		}));

		const userId = useAuthStore.getState().user?.id;
		if (userId) {
			supabase
				.from('audio_guides')
				.update({ chat_messages: messages as unknown as Json })
				.match({ id, user_id: userId })
				.then(({ error }) => {
					if (error) console.warn('[history] saveChatMessages failed:', error.message);
				});
			return;
		}

		saveGuestHistoryChat(id, messages);
	},
	loadFromRemote: (items) => set({ items }),
	hydrateFromGuestDb: async () => {
		if (!isGuest()) return;
		await migrateGuestHistoryFromAsyncStorage();
		set({ items: loadAllGuestHistory() });
	},
	// wikidataImage.ts가 작가명 검증 없이 blind 매칭하던 시절 저장된, 신뢰할 수 없는 위키 이미지 정리
	clearUntrustedWikiImages: () => {
		const targets = get().items.filter((i) => i.imageUrl?.includes('wikipedia.org'));
		if (targets.length === 0) return;

		set((s) => ({
			items: s.items.map((i) =>
				i.imageUrl?.includes('wikipedia.org') ? { ...i, imageUrl: undefined } : i,
			),
		}));

		const userId = useAuthStore.getState().user?.id;
		if (userId) {
			for (const item of targets) {
				supabase
					.from('audio_guides')
					.update({ image_url: null })
					.match({ id: item.id, user_id: userId })
					.then(({ error }) => {
						if (error) console.warn('[history] wiki image cleanup failed:', error.message);
					});
			}
			return;
		}

		for (const item of get().items.filter((i) => targets.some((t) => t.id === i.id))) {
			updateGuestHistory(item);
		}
	},
}));
