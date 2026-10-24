import {
	deleteAllOfflineAudio,
	deleteOfflineAudio,
	formatOfflineAudioSize,
	getOfflineAudioFile,
	getOfflineAudioTotalSizeBytes,
	getOfflineAudioUri,
	hasOfflineAudio,
	resolveAudioUri,
	sanitizeCacheKeyForFilename,
	saveOfflineAudioFromDataUri,
} from '../offlineAudio';

// jest-expo가 expo-file-system의 File/Directory/Paths를 인메모리 목(node_modules/expo-file-system/mocks/FileSystem.ts)으로
// 백업하므로, 실제 클래스를 그대로 사용해 파일 I/O를 종단 간 검증할 수 있다. 목의 인메모리 저장소는 이 테스트
// 파일 실행 전체에서 공유되므로(리셋 훅 없음), 테스트마다 서로 다른 캐시 키를 사용해 격리하고 순서에 유의한다.
const SAMPLE_BASE64 = Buffer.from('hello-audio-bytes').toString('base64');
const SAMPLE_DATA_URI = `data:audio/mpeg;base64,${SAMPLE_BASE64}`;

describe('sanitizeCacheKeyForFilename — 캐시 키를 안전한 파일명으로 변환', () => {
	it('동일 입력은 항상 동일 파일명을 반환한다(결정적)', () => {
		const key = 'voice-1\x001\x00안녕하세요';
		expect(sanitizeCacheKeyForFilename(key)).toBe(sanitizeCacheKeyForFilename(key));
	});

	it('다른 입력은 다른 파일명을 반환한다', () => {
		expect(sanitizeCacheKeyForFilename('a')).not.toBe(sanitizeCacheKeyForFilename('b'));
	});

	it('.mp3 확장자로 끝난다', () => {
		expect(sanitizeCacheKeyForFilename('아무-키')).toMatch(/\.mp3$/);
	});
});

// 아직 아무것도 저장하지 않은 시점의 조회 동작 — 디렉터리 생성 이전 상태를 검증하므로 파일 맨 앞에 둔다.
describe('저장 전 초기 상태', () => {
	it('존재 조회는 false, URI 조회는 null을 반환한다', () => {
		expect(hasOfflineAudio('cache-key-initial')).toBe(false);
		expect(getOfflineAudioUri('cache-key-initial')).toBeNull();
	});

	it('디렉터리가 아직 없으면 총 용량은 0이다', () => {
		expect(getOfflineAudioTotalSizeBytes()).toBe(0);
	});
});

describe('saveOfflineAudioFromDataUri — data URI를 영구 파일로 저장', () => {
	it('base64 payload를 디코딩해 원본 바이트로 저장하고, 이후 조회에서 발견된다', () => {
		saveOfflineAudioFromDataUri('cache-key-2', SAMPLE_DATA_URI);

		const file = getOfflineAudioFile('cache-key-2');
		expect(file.textSync()).toBe('hello-audio-bytes');
		expect(hasOfflineAudio('cache-key-2')).toBe(true);
		expect(getOfflineAudioUri('cache-key-2')).toMatch(/^file:\/\//);
	});

	it('같은 캐시 키로 재호출하면 기존 파일을 덮어쓴다(재다운로드)', () => {
		saveOfflineAudioFromDataUri('cache-key-3', SAMPLE_DATA_URI);
		const secondBase64 = Buffer.from('replaced-bytes').toString('base64');
		saveOfflineAudioFromDataUri('cache-key-3', `data:audio/mpeg;base64,${secondBase64}`);

		const file = getOfflineAudioFile('cache-key-3');
		expect(file.textSync()).toBe('replaced-bytes');
	});
});

describe('deleteAllOfflineAudio — 저장 공간 정리(AC-5)', () => {
	it('전체 삭제 후에는 다운로드했던 항목도 사라진다', () => {
		saveOfflineAudioFromDataUri('cache-key-4', SAMPLE_DATA_URI);
		expect(hasOfflineAudio('cache-key-4')).toBe(true);

		deleteAllOfflineAudio();

		expect(hasOfflineAudio('cache-key-4')).toBe(false);
	});
});

describe('deleteOfflineAudio — 단건 삭제(AC-6)', () => {
	it('삭제 후 해당 항목만 사라지고, 다른 캐시 키는 영향받지 않는다', () => {
		saveOfflineAudioFromDataUri('cache-key-delete-single-a', SAMPLE_DATA_URI);
		saveOfflineAudioFromDataUri('cache-key-delete-single-b', SAMPLE_DATA_URI);

		deleteOfflineAudio('cache-key-delete-single-a');

		expect(hasOfflineAudio('cache-key-delete-single-a')).toBe(false);
		expect(hasOfflineAudio('cache-key-delete-single-b')).toBe(true);
	});

	it('존재하지 않는 캐시 키를 삭제해도 에러 없이 아무 동작도 하지 않는다', () => {
		expect(() => deleteOfflineAudio('cache-key-never-saved')).not.toThrow();
	});
});

describe('formatOfflineAudioSize — 사람이 읽기 쉬운 용량 포맷(AC-5)', () => {
	it('0 이하는 0B로 표기한다', () => {
		expect(formatOfflineAudioSize(0)).toBe('0B');
		expect(formatOfflineAudioSize(-10)).toBe('0B');
	});

	it('1024 미만은 바이트 단위 그대로 표기한다', () => {
		expect(formatOfflineAudioSize(512)).toBe('512B');
	});

	it('KB 단위는 소수 첫째 자리까지 표기한다', () => {
		expect(formatOfflineAudioSize(1536)).toBe('1.5KB');
	});

	it('MB 단위로 올라간다', () => {
		expect(formatOfflineAudioSize(12_989_645)).toBe('12.4MB');
	});
});

describe('resolveAudioUri — 재생 시 로컬 우선 조회(AC-2)', () => {
	it('로컬 파일이 있으면 네트워크 호출 없이 로컬 URI를 즉시 반환한다', async () => {
		saveOfflineAudioFromDataUri('cache-key-resolve-local', SAMPLE_DATA_URI);
		const fetchFromNetwork = jest
			.fn()
			.mockResolvedValue('data:audio/mpeg;base64,SHOULD_NOT_BE_USED');

		const uri = await resolveAudioUri('cache-key-resolve-local', fetchFromNetwork);

		expect(uri).toBe(getOfflineAudioUri('cache-key-resolve-local'));
		expect(fetchFromNetwork).not.toHaveBeenCalled();
	});

	it('로컬 파일이 없으면 네트워크 fetcher를 호출하고 그 결과를 반환한다(AC-6 회귀 방지)', async () => {
		const fetchFromNetwork = jest.fn().mockResolvedValue('data:audio/mpeg;base64,FROM_NETWORK');

		const uri = await resolveAudioUri('cache-key-never-downloaded', fetchFromNetwork);

		expect(uri).toBe('data:audio/mpeg;base64,FROM_NETWORK');
		expect(fetchFromNetwork).toHaveBeenCalledTimes(1);
	});
});
