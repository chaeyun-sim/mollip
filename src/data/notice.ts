export interface Notice {
	id: string;
	title: string;
	body: string;
	category: 'version_update' | 'terms_update' | 'general';
	created_at: string;
}

/** Table Editor에 실제 줄바꿈 대신 리터럴 "\n" 문자열로 입력된 경우까지 대응 */
export function normalizeNoticeBody(body: string): string {
	return body.replace(/\\n/g, '\n');
}
