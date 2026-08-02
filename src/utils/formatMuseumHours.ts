/** museums.open_hours + rstdeInfo → VenueSheet/지도 필터용 표시 문자열 */
export function formatMuseumOpenHours(openHours: string | null, rstdeInfo: string | null): string {
	const hours = openHours?.trim();
	if (!hours) return '운영시간 정보 없음';
	return hours;
}

export function formatMuseumClosedDays(rstdeInfo: string | null, holiday: string | null): string | undefined {
	const rest = rstdeInfo?.trim() || holiday?.trim();
	if (!rest || rest === '없음' || rest === '-') return undefined;
	return rest;
}
