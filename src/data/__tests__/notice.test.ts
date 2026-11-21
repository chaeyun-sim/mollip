import { formatNoticeDate, hasEnglishNotice, localizeNotice, type Notice } from '@/src/data/notice';

const base: Notice = {
	id: '1',
	title: '업데이트 안내',
	body: '본문',
	title_en: null,
	body_en: null,
	category: 'general',
	created_at: '2026-11-21T03:00:00Z',
};

describe('notice helpers', () => {
	it('영문 제목·본문이 모두 있어야 영문 공지로 본다', () => {
		expect(hasEnglishNotice(base)).toBe(false);
		expect(hasEnglishNotice({ ...base, title_en: 'Update' })).toBe(false);
		expect(hasEnglishNotice({ ...base, title_en: 'Update', body_en: '  ' })).toBe(false);
		expect(hasEnglishNotice({ ...base, title_en: 'Update', body_en: 'Body' })).toBe(true);
	});

	it('영어일 때만 영문 제목·본문을 고른다', () => {
		const notice = { ...base, title_en: 'Update', body_en: 'Body' };
		expect(localizeNotice(notice, true)).toEqual({ title: 'Update', body: 'Body' });
		expect(localizeNotice(notice, false)).toEqual({ title: '업데이트 안내', body: '본문' });
	});

	it('날짜를 언어별 형식으로 보여준다', () => {
		expect(formatNoticeDate(base.created_at, true)).toBe('Nov 21, 2026');
		expect(formatNoticeDate(base.created_at, false)).toBe('2026.11.21');
	});
});
