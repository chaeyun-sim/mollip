import type { Json } from '../types/database.types';
import type { HistoryItem } from './historyStore';

export const buildAudioGuideInsert = (
	id: string,
	userId: string,
	item: Pick<HistoryItem, 'title' | 'artist' | 'imageUrl' | 'text' | 'savedAt' | 'chatMessages'>,
) => ({
	id,
	user_id: userId,
	title: item.title,
	artist: item.artist ?? null,
	image_url: item.imageUrl ?? null,
	full_text: item.text,
	created_at: item.savedAt,
	chat_messages: (item.chatMessages ?? null) as unknown as Json,
});
