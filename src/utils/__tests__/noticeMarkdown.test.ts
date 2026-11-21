import { parseNoticeMarkdown } from '@/src/utils/noticeMarkdown';

const plain = (text: string) => [{ text, bold: false }];

describe('parseNoticeMarkdown', () => {
	it('소제목·목록·문단을 나눈다', () => {
		const body = [
			'Hi, this is mollip.',
			'',
			'## What’s new',
			'- Profile photo',
			'- Rate the app',
			'',
			'Thanks!',
		].join('\n');

		expect(parseNoticeMarkdown(body)).toEqual([
			{ type: 'paragraph', inlines: plain('Hi, this is mollip.') },
			{ type: 'heading', inlines: plain('What’s new') },
			{ type: 'bullet', inlines: plain('Profile photo') },
			{ type: 'bullet', inlines: plain('Rate the app') },
			{ type: 'paragraph', inlines: plain('Thanks!') },
		]);
	});

	it('빈 줄 없이 이어진 줄은 한 문단 안에서 줄바꿈을 유지한다', () => {
		expect(parseNoticeMarkdown('첫 줄\n둘째 줄')).toEqual([
			{ type: 'paragraph', inlines: plain('첫 줄\n둘째 줄') },
		]);
	});

	it('Table Editor에 입력한 리터럴 \\n도 줄바꿈으로 읽는다', () => {
		expect(parseNoticeMarkdown('[고쳤어요]\\n- 안정성 개선')).toEqual([
			{ type: 'paragraph', inlines: plain('[고쳤어요]') },
			{ type: 'bullet', inlines: plain('안정성 개선') },
		]);
	});

	it('**굵게**를 인라인으로 해석한다', () => {
		expect(parseNoticeMarkdown('- **New** profile photo')).toEqual([
			{
				type: 'bullet',
				inlines: [
					{ text: 'New', bold: true },
					{ text: ' profile photo', bold: false },
				],
			},
		]);
	});

	it('**로 시작하는 문장은 목록으로 오인하지 않는다', () => {
		expect(parseNoticeMarkdown('**Note** read this')[0].type).toBe('paragraph');
	});

	it('빈 본문은 빈 배열', () => {
		expect(parseNoticeMarkdown('  \n\n ')).toEqual([]);
	});
});
