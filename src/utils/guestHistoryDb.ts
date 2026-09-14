import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

import type { HistoryItem, StoredChatMessage } from '@/src/store/historyStore';

export const GUEST_HISTORY_ASYNC_KEY = 'audio-history';

interface HistoryRow {
	id: string;
	title: string;
	artist: string | null;
	image_url: string | null;
	full_text: string;
	saved_at: string;
}

interface ChatRow {
	history_id: string;
	id: string;
	role: string;
	text: string;
	sort_order: number;
}

let db: SQLite.SQLiteDatabase | null = null;
let migrated = false;

const getDb = (): SQLite.SQLiteDatabase | null => {
	if (db) return db;
	try {
		db = SQLite.openDatabaseSync('guest-history.db');
		db.execSync(`
			PRAGMA journal_mode = WAL;
			CREATE TABLE IF NOT EXISTS guest_history (
				id TEXT PRIMARY KEY NOT NULL,
				title TEXT NOT NULL,
				artist TEXT,
				image_url TEXT,
				full_text TEXT NOT NULL,
				saved_at TEXT NOT NULL
			);
			CREATE TABLE IF NOT EXISTS guest_history_chat (
				history_id TEXT NOT NULL,
				id TEXT NOT NULL,
				role TEXT NOT NULL,
				text TEXT NOT NULL,
				sort_order INTEGER NOT NULL,
				PRIMARY KEY (history_id, id)
			);
		`);
		return db;
	} catch (error) {
		console.warn('[history] sqlite unavailable:', error);
		return null;
	}
};

const replaceChat = (
	database: SQLite.SQLiteDatabase,
	historyId: string,
	messages?: StoredChatMessage[],
): void => {
	database.runSync('DELETE FROM guest_history_chat WHERE history_id = ?', historyId);
	(messages ?? []).forEach((message, index) => {
		database.runSync(
			'INSERT INTO guest_history_chat (history_id, id, role, text, sort_order) VALUES (?, ?, ?, ?, ?)',
			historyId,
			message.id,
			message.role,
			message.text,
			index,
		);
	});
};

const upsertItem = (database: SQLite.SQLiteDatabase, item: HistoryItem): void => {
	database.runSync(
		`INSERT OR REPLACE INTO guest_history (id, title, artist, image_url, full_text, saved_at)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		item.id,
		item.title,
		item.artist ?? null,
		item.imageUrl ?? null,
		item.text,
		item.savedAt,
	);
	replaceChat(database, item.id, item.chatMessages);
};

export const loadAllGuestHistory = (): HistoryItem[] => {
	const database = getDb();
	if (!database) return [];

	const rows = database.getAllSync<HistoryRow>(
		'SELECT id, title, artist, image_url, full_text, saved_at FROM guest_history ORDER BY saved_at DESC',
	);
	const chats = database.getAllSync<ChatRow>(
		'SELECT history_id, id, role, text, sort_order FROM guest_history_chat ORDER BY sort_order ASC',
	);

	const chatByHistory = new Map<string, StoredChatMessage[]>();
	for (const row of chats) {
		const list = chatByHistory.get(row.history_id) ?? [];
		if (row.role === 'user' || row.role === 'assistant') {
			list.push({ id: row.id, role: row.role, text: row.text });
			chatByHistory.set(row.history_id, list);
		}
	}

	return rows.map((row) => ({
		id: row.id,
		title: row.title,
		artist: row.artist ?? undefined,
		imageUrl: row.image_url ?? undefined,
		text: row.full_text,
		savedAt: row.saved_at,
		chatMessages: chatByHistory.get(row.id),
	}));
};

export const insertGuestHistory = (item: HistoryItem): void => {
	const database = getDb();
	if (!database) return;
	upsertItem(database, item);
};

export const updateGuestHistory = (item: HistoryItem): void => {
	insertGuestHistory(item);
};

export const deleteGuestHistory = (id: string): void => {
	const database = getDb();
	if (!database) return;
	database.runSync('DELETE FROM guest_history_chat WHERE history_id = ?', id);
	database.runSync('DELETE FROM guest_history WHERE id = ?', id);
};

export const saveGuestHistoryChat = (id: string, messages: StoredChatMessage[]): void => {
	const database = getDb();
	if (!database) return;
	replaceChat(database, id, messages);
};

export const migrateGuestHistoryFromAsyncStorage = async (): Promise<void> => {
	if (migrated) return;
	migrated = true;

	const raw = await AsyncStorage.getItem(GUEST_HISTORY_ASYNC_KEY);
	if (!raw) return;

	try {
		const parsed = JSON.parse(raw) as { state?: { items?: HistoryItem[] } };
		const items = parsed.state?.items;
		const database = getDb();
		if (database && Array.isArray(items) && items.length > 0) {
			database.withTransactionSync(() => {
				for (const item of items) upsertItem(database, item);
			});
		}
	} catch (error) {
		console.warn('[history] migrate async history failed:', error);
	} finally {
		await AsyncStorage.removeItem(GUEST_HISTORY_ASYNC_KEY);
	}
};
