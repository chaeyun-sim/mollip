import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 온보딩 완료·저장 실패 재시도를 위한 사용자별 로컬 레코드.
 * 키에 userId를 포함해 계정 간 데이터가 섞이지 않게 한다 (AC-5).
 */

interface PendingGenresRecord {
	genres: string[];
	pieceIds?: string[];
	savedAt: string;
}

function completedKey(userId: string): string {
	return `onboarding:${userId}:completed`;
}

function pendingKey(userId: string): string {
	return `onboarding:${userId}:pendingGenres`;
}

export async function getLocalOnboardingCompleted(userId: string): Promise<boolean> {
	const value = await AsyncStorage.getItem(completedKey(userId));
	return value === 'true';
}

export async function setLocalOnboardingCompleted(userId: string, value: boolean): Promise<void> {
	await AsyncStorage.setItem(completedKey(userId), value ? 'true' : 'false');
}

export async function getPendingGenres(userId: string): Promise<PendingGenresRecord | null> {
	const raw = await AsyncStorage.getItem(pendingKey(userId));
	if (!raw) return null;
	try {
		return JSON.parse(raw) as PendingGenresRecord;
	} catch {
		return null;
	}
}

export async function setPendingGenres(
	userId: string,
	genres: string[],
	pieceIds: string[] = [],
): Promise<void> {
	const record: PendingGenresRecord = { genres, pieceIds, savedAt: new Date().toISOString() };
	await AsyncStorage.setItem(pendingKey(userId), JSON.stringify(record));
}

export async function clearPendingGenres(userId: string): Promise<void> {
	await AsyncStorage.removeItem(pendingKey(userId));
}
