import { buildAudioGuideInsert } from '../historyInsert';

describe('buildAudioGuideInsert', () => {
	it('전시 채팅이 있으면 chat_messages를 함께 넣는다', () => {
		const row = buildAudioGuideInsert('hist-1', 'user-1', {
			title: '여름 전시',
			text: '',
			savedAt: '2026-09-23T00:00:00.000Z',
			chatMessages: [{ id: 'm1', role: 'user', text: '이 전시 주제가 뭐야?' }],
		});

		expect(row.chat_messages).toEqual([{ id: 'm1', role: 'user', text: '이 전시 주제가 뭐야?' }]);
		expect(row.title).toBe('여름 전시');
		expect(row.user_id).toBe('user-1');
	});

	it('채팅이 없으면 chat_messages는 null이다', () => {
		const row = buildAudioGuideInsert('hist-2', 'user-1', {
			title: '작품 해설',
			text: '해설 본문',
			savedAt: '2026-09-23T00:00:00.000Z',
		});

		expect(row.chat_messages).toBeNull();
		expect(row.full_text).toBe('해설 본문');
	});
});
