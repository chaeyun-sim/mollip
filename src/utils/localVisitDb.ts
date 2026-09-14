import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

import type { DayVisit, ListenedItem } from '@/src/store/visitStore';
import { persistVisitPhotoFields } from '@/src/utils/visitPhotoFiles';

export const VISITS_ASYNC_KEY = 'visits';

interface VisitRow {
	visit_key: string;
	date_key: string;
	exhibition_id: string | null;
	exhibition_title: string | null;
	venue: string | null;
	thumbnail_uri: string | null;
	memo: string | null;
	status: string | null;
	pending_since: string | null;
	signature_svg: string | null;
	visited_start: string | null;
	visited_end: string | null;
	rating: number | null;
}

interface PhotoRow {
	visit_key: string;
	uri: string;
	sort_order: number;
}

interface ListenedRow {
	visit_key: string;
	title: string;
	image_url: string | null;
	description_preview: string | null;
	sort_order: number;
}

interface PersistedVisits {
	state?: { visits?: Record<string, DayVisit> };
}

let db: SQLite.SQLiteDatabase | null = null;
let migrated = false;

const getDb = (): SQLite.SQLiteDatabase | null => {
	if (db) return db;
	try {
		db = SQLite.openDatabaseSync('local-visits.db');
		db.execSync(`
			PRAGMA journal_mode = WAL;
			CREATE TABLE IF NOT EXISTS local_visits (
				visit_key TEXT PRIMARY KEY NOT NULL,
				date_key TEXT NOT NULL,
				exhibition_id TEXT,
				exhibition_title TEXT,
				venue TEXT,
				thumbnail_uri TEXT,
				memo TEXT,
				status TEXT,
				pending_since TEXT,
				signature_svg TEXT,
				visited_start TEXT,
				visited_end TEXT,
				rating INTEGER
			);
			CREATE TABLE IF NOT EXISTS local_visit_photos (
				visit_key TEXT NOT NULL,
				uri TEXT NOT NULL,
				sort_order INTEGER NOT NULL,
				PRIMARY KEY (visit_key, sort_order)
			);
			CREATE TABLE IF NOT EXISTS local_visit_listened (
				visit_key TEXT NOT NULL,
				title TEXT NOT NULL,
				image_url TEXT,
				description_preview TEXT,
				sort_order INTEGER NOT NULL,
				PRIMARY KEY (visit_key, title)
			);
		`);
		return db;
	} catch (error) {
		console.warn('[visit] sqlite unavailable:', error);
		return null;
	}
};

export const slimLocalVisit = (visit: DayVisit): DayVisit => {
	return {
		exhibitionId: visit.exhibitionId,
		exhibitionTitle: visit.exhibitionTitle,
		venue: visit.venue,
		listened: (visit.listened ?? []).map((item) => ({
			title: item.title,
			imageUrl: item.imageUrl,
		})),
		status: visit.status,
		pendingSince: visit.pendingSince,
		signatureSvg: visit.signatureSvg,
		visitedAt: visit.visitedAt,
		rating: visit.rating,
	};
};

const replaceChildren = (database: SQLite.SQLiteDatabase, key: string, visit: DayVisit): void => {
	database.runSync('DELETE FROM local_visit_photos WHERE visit_key = ?', key);
	database.runSync('DELETE FROM local_visit_listened WHERE visit_key = ?', key);

	(visit.venuePhotos ?? []).forEach((uri, index) => {
		database.runSync(
			'INSERT INTO local_visit_photos (visit_key, uri, sort_order) VALUES (?, ?, ?)',
			key,
			uri,
			index,
		);
	});

	(visit.listened ?? []).forEach((item, index) => {
		database.runSync(
			`INSERT OR REPLACE INTO local_visit_listened
			 (visit_key, title, image_url, description_preview, sort_order)
			 VALUES (?, ?, ?, ?, ?)`,
			key,
			item.title,
			item.imageUrl ?? null,
			item.descriptionPreview ?? null,
			index,
		);
	});
};

const upsertVisit = (database: SQLite.SQLiteDatabase, key: string, visit: DayVisit): void => {
	database.runSync(
		`INSERT OR REPLACE INTO local_visits (
			visit_key, date_key, exhibition_id, exhibition_title, venue,
			thumbnail_uri, memo, status, pending_since, signature_svg,
			visited_start, visited_end, rating
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		key,
		key.split('::')[0],
		visit.exhibitionId,
		visit.exhibitionTitle ?? null,
		visit.venue ?? null,
		visit.thumbnail ?? null,
		visit.memo ?? null,
		visit.status ?? null,
		visit.pendingSince ?? null,
		visit.signatureSvg ?? null,
		visit.visitedAt?.start ?? null,
		visit.visitedAt?.end ?? null,
		visit.rating ?? null,
	);
	replaceChildren(database, key, visit);
};

export const upsertLocalVisit = (key: string, visit: DayVisit, slim?: boolean): void => {
	const database = getDb();
	if (!database) return;
	const next = slim ? slimLocalVisit(visit) : persistVisitPhotoFields(visit);
	upsertVisit(database, key, next);
};

export const persistAllLocalVisits = (visits: Record<string, DayVisit>, slim?: boolean): void => {
	const database = getDb();
	if (!database) return;
	database.withTransactionSync(() => {
		for (const [key, visit] of Object.entries(visits)) {
			upsertVisit(database, key, slim ? slimLocalVisit(visit) : persistVisitPhotoFields(visit));
		}
	});
};

export const deleteLocalVisit = (key: string): void => {
	const database = getDb();
	if (!database) return;
	database.runSync('DELETE FROM local_visit_photos WHERE visit_key = ?', key);
	database.runSync('DELETE FROM local_visit_listened WHERE visit_key = ?', key);
	database.runSync('DELETE FROM local_visits WHERE visit_key = ?', key);
};

export const slimAllLocalVisits = (): void => {
	const visits = loadAllLocalVisits();
	persistAllLocalVisits(visits, true);
};

export const clearAllLocalVisits = (): void => {
	const database = getDb();
	if (!database) return;
	database.execSync(`
		DELETE FROM local_visit_photos;
		DELETE FROM local_visit_listened;
		DELETE FROM local_visits;
	`);
};

export const loadAllLocalVisits = (): Record<string, DayVisit> => {
	const database = getDb();
	if (!database) return {};

	const rows = database.getAllSync<VisitRow>('SELECT * FROM local_visits');
	const photos = database.getAllSync<PhotoRow>(
		'SELECT visit_key, uri, sort_order FROM local_visit_photos ORDER BY sort_order ASC',
	);
	const listened = database.getAllSync<ListenedRow>(
		'SELECT visit_key, title, image_url, description_preview, sort_order FROM local_visit_listened ORDER BY sort_order ASC',
	);

	const photosByKey = new Map<string, string[]>();
	for (const row of photos) {
		const list = photosByKey.get(row.visit_key) ?? [];
		list.push(row.uri);
		photosByKey.set(row.visit_key, list);
	}

	const listenedByKey = new Map<string, ListenedItem[]>();
	for (const row of listened) {
		const list = listenedByKey.get(row.visit_key) ?? [];
		list.push({
			title: row.title,
			imageUrl: row.image_url ?? undefined,
			descriptionPreview: row.description_preview ?? undefined,
		});
		listenedByKey.set(row.visit_key, list);
	}

	const visits: Record<string, DayVisit> = {};
	for (const row of rows) {
		const status =
			row.status === 'in_progress' || row.status === 'pending' || row.status === 'confirmed'
				? row.status
				: undefined;
		visits[row.visit_key] = {
			exhibitionId: row.exhibition_id,
			exhibitionTitle: row.exhibition_title ?? undefined,
			venue: row.venue ?? undefined,
			thumbnail: row.thumbnail_uri ?? undefined,
			venuePhotos: photosByKey.get(row.visit_key),
			listened: listenedByKey.get(row.visit_key) ?? [],
			memo: row.memo ?? undefined,
			status,
			pendingSince: row.pending_since ?? undefined,
			signatureSvg: row.signature_svg ?? undefined,
			visitedAt:
				row.visited_start && row.visited_end
					? { start: row.visited_start, end: row.visited_end }
					: undefined,
			rating: row.rating ?? undefined,
		};
	}
	return visits;
};

export const migrateVisitsFromAsyncStorage = async (): Promise<void> => {
	if (migrated) return;
	migrated = true;

	const raw = await AsyncStorage.getItem(VISITS_ASYNC_KEY);
	if (!raw) return;

	try {
		const parsed = JSON.parse(raw) as PersistedVisits;
		const visits = parsed.state?.visits;
		if (visits && Object.keys(visits).length > 0) {
			persistAllLocalVisits(visits);
		}
	} catch (error) {
		console.warn('[visit] migrate async visits failed:', error);
	} finally {
		await AsyncStorage.removeItem(VISITS_ASYNC_KEY);
	}
};
