import { streamDescription } from '../api';

jest.mock('@/src/utils/supabase', () => ({
	supabase: {
		auth: {
			getUser: jest.fn(),
			getSession: jest.fn(async () => ({ data: { session: { access_token: 'user-token' } } })),
			refreshSession: jest.fn(),
		},
	},
}));
jest.mock('@/src/store/authStore', () => ({ getAccessTokenForApi: () => null }));

const encoder = new TextEncoder();

const sse = (event: unknown) => `data: ${JSON.stringify(event)}\n`;
const textDelta = (text: string) =>
	sse({ type: 'content_block_delta', delta: { type: 'text_delta', text } });

// 청크 목록을 순서대로 돌려주는 가짜 스트림 응답
const mockFetchStream = (chunks: string[]) => {
	const queue = chunks.map((c) => encoder.encode(c));
	const reader = {
		read: jest.fn(async () =>
			queue.length > 0 ? { done: false, value: queue.shift() } : { done: true, value: undefined },
		),
		cancel: jest.fn(async () => {}),
	};
	global.fetch = jest.fn(async () => ({
		ok: true,
		body: { getReader: () => reader },
	})) as unknown as typeof fetch;
};

const collect = async (gen: AsyncGenerator<string>) => {
	const out: string[] = [];
	for await (const chunk of gen) out.push(chunk);
	return out;
};

describe('readSSEStream (streamDescription 경유)', () => {
	it('text_delta를 순서대로 돌려준다', async () => {
		mockFetchStream([textDelta('안녕'), textDelta('하세요')]);

		await expect(collect(streamDescription('프롬프트'))).resolves.toEqual(['안녕', '하세요']);
	});

	it('스트림 도중 error 이벤트가 오면 정상 종료로 보지 않고 예외를 던진다', async () => {
		mockFetchStream([
			textDelta('안녕'),
			sse({ type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } }),
		]);

		await expect(collect(streamDescription('프롬프트'))).rejects.toThrow('overloaded_error');
	});

	it('해석할 수 없는 줄은 건너뛴다', async () => {
		mockFetchStream(['data: {깨진 json\n', textDelta('안녕')]);

		await expect(collect(streamDescription('프롬프트'))).resolves.toEqual(['안녕']);
	});

	it('JSON이지만 객체가 아닌 줄(null 등)도 건너뛴다', async () => {
		mockFetchStream(['data: null\n', 'data: 5\n', textDelta('안녕')]);

		await expect(collect(streamDescription('프롬프트'))).resolves.toEqual(['안녕']);
	});
});
