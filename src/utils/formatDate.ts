export function formatDate(iso?: string, date?: { year: number; month: number; day: number }) {
	if (date)
		return `${date.year}.${String(date.month).padStart(2, '0')}.${String(date.day).padStart(2, '0')}`;

	const d = iso ? new Date(iso) : new Date();
	return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/** ISO 문자열을 "오후 2:15" 형태의 시각 라벨로 변환 (영수증 요약용) */
export function formatClockTime(iso: string): string {
	const d = new Date(iso);
	const hours24 = d.getHours();
	const period = hours24 < 12 ? '오전' : '오후';
	const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
	const minutes = String(d.getMinutes()).padStart(2, '0');
	return `${period} ${hours12}:${minutes}`;
}
