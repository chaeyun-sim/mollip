import {
	CHAT_DRAFT_TTL_MS,
	pickPersistedChatSessions,
	pruneExpiredDrafts,
	useChatStore,
} from '../chatStore';

jest.mock('@react-native-async-storage/async-storage', () =>
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(() => {
	useChatStore.setState({ sessions: {}, drafts: {} });
	jest.restoreAllMocks();
});

describe('pickPersistedChatSessions', () => {
	it('전시 채팅 세션만 남긴다', () => {
		const persisted = pickPersistedChatSessions({
			'exhibition-chat-1': { messages: [], history: [] },
			'1710000000': { messages: [], history: [] },
		});

		expect(Object.keys(persisted)).toEqual(['exhibition-chat-1']);
	});
});

describe('pruneExpiredDrafts', () => {
	it('만료된 초안과 빈 초안을 버린다', () => {
		const now = 1_000_000;
		const pruned = pruneExpiredDrafts(
			{
				fresh: { text: '안녕', expiresAt: now + 1 },
				expired: { text: '옛글', expiresAt: now },
				empty: { text: '   ', expiresAt: now + 1 },
			},
			now,
		);

		expect(pruned).toEqual({ fresh: { text: '안녕', expiresAt: now + 1 } });
	});
});

describe('useChatStore draft', () => {
	it('전시 채팅 초안은 12시간 TTL로 저장한다', () => {
		const now = Date.now();
		jest.spyOn(Date, 'now').mockReturnValue(now);

		useChatStore.getState().setDraft('exhibition-chat-1', '작성 중');

		expect(useChatStore.getState().getDraft('exhibition-chat-1')).toBe('작성 중');
		expect(useChatStore.getState().drafts['exhibition-chat-1']?.expiresAt).toBe(
			now + CHAT_DRAFT_TTL_MS,
		);

		jest.spyOn(Date, 'now').mockReturnValue(now + CHAT_DRAFT_TTL_MS + 1);
		expect(useChatStore.getState().getDraft('exhibition-chat-1')).toBe('');
	});

	it('작품 채팅 초안은 persist 대상이 아니라 저장하지 않는다', () => {
		useChatStore.getState().setDraft('1710000000', '작품 질문');
		expect(useChatStore.getState().getDraft('1710000000')).toBe('');
		expect(useChatStore.getState().drafts['1710000000']).toBeUndefined();
	});

	it('flushSession은 메시지와 초안을 함께 지운다', () => {
		useChatStore.getState().addMessage('exhibition-chat-1', {
			id: '1',
			role: 'user',
			text: '안녕',
		});
		useChatStore.getState().setDraft('exhibition-chat-1', '초안');
		useChatStore.getState().flushSession('exhibition-chat-1');

		expect(useChatStore.getState().getMessages('exhibition-chat-1')).toEqual([]);
		expect(useChatStore.getState().getDraft('exhibition-chat-1')).toBe('');
	});
});
