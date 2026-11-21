export interface Notice {
	id: string;
	title: string;
	body: string;
	title_en: string | null;
	body_en: string | null;
	category: 'version_update' | 'terms_update' | 'general';
	created_at: string;
}

/** Table Editor에 실제 줄바꿈 대신 리터럴 "\n" 문자열로 입력된 경우까지 대응 */
export function normalizeNoticeBody(body: string): string {
	return body.replace(/\\n/g, '\n');
}

/** 영어 화면에서 쓸 영문 공지가 있는지 — 없으면 영어 화면에서 숨긴다 */
export const hasEnglishNotice = (notice: Notice): boolean =>
	Boolean(notice.title_en?.trim() && notice.body_en?.trim());

/** 언어에 맞는 제목·본문을 고른다 */
export const localizeNotice = (notice: Notice, isEn: boolean): { title: string; body: string } =>
	isEn && hasEnglishNotice(notice)
		? { title: notice.title_en ?? notice.title, body: notice.body_en ?? notice.body }
		: { title: notice.title, body: notice.body };

/** 한국어 2026.11.21, 영어 Nov 21, 2026 */
export const formatNoticeDate = (isoDate: string, isEn: boolean): string => {
	const d = new Date(isoDate);
	if (isEn) {
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		}).format(d);
	}
	return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};
