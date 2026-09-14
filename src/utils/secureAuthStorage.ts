import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * Supabase 세션(Access/Refresh Token)용 저장소.
 * Keychain/Keystore에 암호화를 맡기고, 2048바이트 제한은 청크로 나눈다.
 * 예전에 AsyncStorage에 남긴 평문 세션은 한 번 읽은 뒤 SecureStore로 옮기고 지운다.
 */

const CHUNK_SIZE = 1800;
const CHUNK_PREFIX = '__chunks__:';
const OPTIONS: SecureStore.SecureStoreOptions = {
	keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

const chunkKey = (key: string, index: number): string => {
	return `${key}.${index}`;
};

const parseChunkCount = (value: string): number | null => {
	if (!value.startsWith(CHUNK_PREFIX)) return null;
	const count = Number(value.slice(CHUNK_PREFIX.length));
	return Number.isInteger(count) && count > 0 ? count : null;
};

const deleteChunks = async (key: string, count: number): Promise<void> => {
	await Promise.all(
		Array.from({ length: count }, (_, index) =>
			SecureStore.deleteItemAsync(chunkKey(key, index), OPTIONS).catch(() => undefined),
		),
	);
};

const readSecure = async (key: string): Promise<string | null> => {
	const head = await SecureStore.getItemAsync(key, OPTIONS);
	if (head == null) return null;

	const count = parseChunkCount(head);
	if (count == null) return head;

	const chunks = await Promise.all(
		Array.from({ length: count }, (_, index) =>
			SecureStore.getItemAsync(chunkKey(key, index), OPTIONS),
		),
	);
	if (chunks.some((chunk) => chunk == null)) return null;
	return chunks.join('');
};

const writeSecure = async (key: string, value: string): Promise<void> => {
	const previous = await SecureStore.getItemAsync(key, OPTIONS);
	const previousCount = previous ? parseChunkCount(previous) : null;

	if (value.length <= CHUNK_SIZE) {
		await SecureStore.setItemAsync(key, value, OPTIONS);
		if (previousCount) await deleteChunks(key, previousCount);
		return;
	}

	const chunks: string[] = [];
	for (let i = 0; i < value.length; i += CHUNK_SIZE) {
		chunks.push(value.slice(i, i + CHUNK_SIZE));
	}
	await SecureStore.setItemAsync(key, `${CHUNK_PREFIX}${chunks.length}`, OPTIONS);
	await Promise.all(
		chunks.map((chunk, index) => SecureStore.setItemAsync(chunkKey(key, index), chunk, OPTIONS)),
	);
	if (previousCount && previousCount > chunks.length) {
		await Promise.all(
			Array.from({ length: previousCount - chunks.length }, (_, offset) =>
				SecureStore.deleteItemAsync(chunkKey(key, chunks.length + offset), OPTIONS).catch(
					() => undefined,
				),
			),
		);
	}
};

const removeSecure = async (key: string): Promise<void> => {
	const head = await SecureStore.getItemAsync(key, OPTIONS);
	const count = head ? parseChunkCount(head) : null;
	await SecureStore.deleteItemAsync(key, OPTIONS).catch(() => undefined);
	if (count) await deleteChunks(key, count);
};

export const secureAuthStorage = {
	async getItem(key: string): Promise<string | null> {
		try {
			const fromSecure = await readSecure(key);
			if (fromSecure != null) return fromSecure;
		} catch (error) {
			console.warn('[auth] SecureStore read failed:', error);
		}

		const fromAsync = await AsyncStorage.getItem(key);
		if (fromAsync == null) return null;

		try {
			await writeSecure(key, fromAsync);
			await AsyncStorage.removeItem(key);
		} catch (error) {
			console.warn('[auth] migrate session to SecureStore failed:', error);
		}
		return fromAsync;
	},

	async setItem(key: string, value: string): Promise<void> {
		try {
			await writeSecure(key, value);
			await AsyncStorage.removeItem(key);
		} catch (error) {
			console.warn('[auth] SecureStore write failed, fallback AsyncStorage:', error);
			await AsyncStorage.setItem(key, value);
		}
	},

	async removeItem(key: string): Promise<void> {
		await Promise.all([removeSecure(key).catch(() => undefined), AsyncStorage.removeItem(key)]);
	},
};
