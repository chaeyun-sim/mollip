/** 로컬 달력 기준 날짜 키(YYYY-MM-DD) — UTC 자정 밀림을 피한다 */
export const dateKeyFrom = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

/** 관람 기록 오늘 날짜 키(YYYY-MM-DD) — visitStore 소비처 공용 */
export const todayKey = (): string => {
	return dateKeyFrom(new Date());
};

/**
 * visits의 키 = "날짜::전시식별자" — 하루에 전시를 여러 개 봐도 서로 안 겹치게 한다.
 * 같은 전시(id 같음, 또는 id 없이 같은 제목)를 같은 날 또 들으면 같은 키로 합쳐진다.
 * exhibitionId가 있으면 id로, 검색 없이 직접 입력한 경우(id 없음)는 제목으로 식별한다.
 */
export const makeVisitKey = (
	dateKey: string,
	exhibitionId: string | null,
	title?: string,
): string => {
	const idPart = exhibitionId ? `id:${exhibitionId}` : title ? `t:${title}` : 'manual';
	return `${dateKey}::${idPart}`;
};

/** visits 키에서 날짜 부분만 뽑아낸다 — 캘린더/그룹핑용 */
export const dateKeyOf = (visitKey: string): string => {
	return visitKey.split('::')[0];
};

/** 로컬 키에서 전시 식별자만 — 원격 visit_key 컬럼(id:… / t:…) */
export const visitIdentityOf = (visitKey: string): string => {
	const sep = visitKey.indexOf('::');
	return sep === -1 ? visitKey : visitKey.slice(sep + 2);
};

/** 원격 date(관람일) + visit_key(전시 식별)로 로컬 키를 복원한다 */
export const localVisitKeyFromRemote = (date: string, visitKey: string): string => {
	return visitKey.includes('::') ? visitKey : `${date}::${visitKey}`;
};
