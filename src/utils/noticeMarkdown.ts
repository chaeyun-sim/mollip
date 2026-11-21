import { normalizeNoticeBody } from '@/src/data/notice';

export interface NoticeInline {
	text: string;
	bold: boolean;
}

export interface NoticeBlock {
	type: 'heading' | 'bullet' | 'paragraph';
	inlines: NoticeInline[];
}

/** `**굵게**`만 인라인으로 해석한다 */
const parseInline = (text: string): NoticeInline[] =>
	text
		.split(/(\*\*[^*]+\*\*)/)
		.filter((part) => part.length > 0)
		.map((part) =>
			part.startsWith('**') && part.endsWith('**') && part.length > 4
				? { text: part.slice(2, -2), bold: true }
				: { text: part, bold: false },
		);

/**
 * 공지 본문용 마크다운 subset 파서.
 * `#`~`######` 소제목, `-`/`*`/`•` 목록, 빈 줄 문단 구분, `**굵게**`만 지원한다.
 * 그 외 문법은 일반 문장으로 그대로 보여준다.
 */
export const parseNoticeMarkdown = (body: string): NoticeBlock[] => {
	const blocks: NoticeBlock[] = [];
	let paragraph: string[] = [];

	const flushParagraph = () => {
		if (paragraph.length === 0) return;
		blocks.push({ type: 'paragraph', inlines: parseInline(paragraph.join('\n')) });
		paragraph = [];
	};

	for (const line of normalizeNoticeBody(body).replace(/\r\n/g, '\n').split('\n')) {
		const trimmed = line.trim();
		const heading = /^#{1,6}\s+(.+)$/.exec(trimmed);
		const bullet = /^[-*•]\s+(.+)$/.exec(trimmed);

		if (!trimmed) {
			flushParagraph();
		} else if (heading) {
			flushParagraph();
			blocks.push({ type: 'heading', inlines: parseInline(heading[1]) });
		} else if (bullet) {
			flushParagraph();
			blocks.push({ type: 'bullet', inlines: parseInline(bullet[1]) });
		} else {
			paragraph.push(trimmed);
		}
	}
	flushParagraph();

	return blocks;
};
