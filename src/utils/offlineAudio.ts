import { Directory, File, Paths } from 'expo-file-system';

/** 오프라인 다운로드 오디오가 저장되는 디렉터리 이름(문서 디렉터리 하위). */
export const OFFLINE_AUDIO_DIR_NAME = 'offline-audio';

export function getOfflineAudioDirectory(): Directory {
	return new Directory(Paths.document, OFFLINE_AUDIO_DIR_NAME);
}

/**
 * useTTS.ts의 캐시 키(`voiceId\x00speed\x00text`)를 파일 시스템에 안전한 결정적 파일명으로
 * 변환한다. 특수문자·길이 제약을 피하기 위해 간단한 해시로 축약한다(암호학적 용도 아님).
 */
export function sanitizeCacheKeyForFilename(cacheKey: string): string {
	let hash = 0;
	for (let i = 0; i < cacheKey.length; i += 1) {
		hash = (hash * 31 + cacheKey.charCodeAt(i)) | 0;
	}
	return `audio-${Math.abs(hash)}.mp3`;
}

export function getOfflineAudioFile(cacheKey: string): File {
	return new File(getOfflineAudioDirectory(), sanitizeCacheKeyForFilename(cacheKey));
}

export function hasOfflineAudio(cacheKey: string): boolean {
	return getOfflineAudioFile(cacheKey).exists;
}

export function getOfflineAudioUri(cacheKey: string): string | null {
	const file = getOfflineAudioFile(cacheKey);
	return file.exists ? file.uri : null;
}

function extractBase64Payload(dataUri: string): string {
	const commaIndex = dataUri.indexOf(',');
	return commaIndex === -1 ? dataUri : dataUri.slice(commaIndex + 1);
}

/**
 * `fetchTTSBlob`이 반환하는 `data:audio/mpeg;base64,...` URI를 영구 파일로 저장한다.
 * 이미 같은 캐시 키로 저장된 파일이 있으면 덮어쓴다(재다운로드 시나리오, AC-1 참고사항).
 */
export function saveOfflineAudioFromDataUri(cacheKey: string, dataUri: string): string {
	const dir = getOfflineAudioDirectory();
	if (!dir.exists) dir.create({ intermediates: true, idempotent: true });

	const file = getOfflineAudioFile(cacheKey);
	if (file.exists) file.delete();
	file.create();
	file.write(extractBase64Payload(dataUri), { encoding: 'base64' });
	return file.uri;
}

/** AC-5(저장 공간 관리)에서 사용할 전체 삭제. 디렉터리가 없으면 아무 동작도 하지 않는다. */
export function deleteAllOfflineAudio(): void {
	const dir = getOfflineAudioDirectory();
	if (dir.exists) dir.delete();
}

/** AC-6(개별 삭제)에서 사용할 단건 삭제. 파일이 없으면 아무 동작도 하지 않는다. */
export function deleteOfflineAudio(cacheKey: string): void {
	const file = getOfflineAudioFile(cacheKey);
	if (file.exists) file.delete();
}

/** AC-5(저장 공간 표시)에서 사용할 총 용량(byte). 디렉터리가 없으면 0을 반환한다. */
export function getOfflineAudioTotalSizeBytes(): number {
	const dir = getOfflineAudioDirectory();
	if (!dir.exists) return 0;
	return dir.size ?? 0;
}

/**
 * AC-5(저장 공간 표시)에서 사용할 사람이 읽기 쉬운 용량 포맷.
 * 예: 0 -> "0B", 1536 -> "1.5KB", 12989645 -> "12.4MB".
 */
export function formatOfflineAudioSize(bytes: number): string {
	if (bytes <= 0) return '0B';

	const units = ['B', 'KB', 'MB', 'GB'] as const;
	let value = bytes;
	let unitIndex = 0;
	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024;
		unitIndex += 1;
	}

	const formatted = unitIndex === 0 ? String(value) : value.toFixed(1);
	return `${formatted}${units[unitIndex]}`;
}

/**
 * 재생 시 오디오 URI 조회 우선순위(AC-2) — 로컬 다운로드 파일이 있으면 네트워크 요청 없이
 * 그 URI를 즉시 반환한다. 없으면 `fetchFromNetwork`를 호출해 그 결과를 반환한다(AC-6 회귀 방지).
 * useTTS.ts의 speak/preload가 재생·프리로드 시 이 함수로 로컬 우선 조회를 수행한다.
 */
export async function resolveAudioUri(
	cacheKey: string,
	fetchFromNetwork: () => Promise<string>,
): Promise<string> {
	const localUri = getOfflineAudioUri(cacheKey);
	if (localUri) return localUri;
	return fetchFromNetwork();
}
