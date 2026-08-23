import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useAuthStore } from './authStore';
import { supabase } from '../utils/supabase';

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
}

export const useHistoryStore = create<HistoryStore>()(
	persist(
		(set, get) => ({
			items: [],
			add: (item) => {
				const id = Crypto.randomUUID();
				const savedAt = new Date().toISOString();
				set((s) => ({
					items: [{ ...item, id, savedAt }, ...s.items],
				}));

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
				}

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
				}
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
				}
			},
			has: (id) => get().items.some((i) => i.id === id),
			saveChatMessages: (id, messages) => {
				set((s) => ({
					items: s.items.map((i) => (i.id === id ? { ...i, chatMessages: messages } : i)),
				}));
			},
			loadFromRemote: (items) => set({ items }),
		}),
		{
			name: 'audio-history',
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
);
