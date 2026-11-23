import { formatDate as formatCultureDate } from '@/src/utils/cultureExhibitionMapper';
import { formatDate } from '@/src/utils/formatDate';

// 다시 들을 오디오의 savedAt은 ISO 문자열이다
const savedAt = new Date(2026, 10, 22, 14, 5).toISOString();

describe('savedAt 날짜 표시', () => {
	it('전시 API용 formatDate는 8자리(YYYYMMDD)만 다뤄 ISO 문자열을 그대로 돌려준다', () => {
		expect(formatCultureDate(savedAt)).toBe(savedAt);
	});

	it('formatDate는 ISO 문자열을 YYYY.MM.DD로 바꾼다', () => {
		expect(formatDate(savedAt)).toBe('2026.11.22');
	});
});
