/**
 * 오늘의 명화 진행 상태 — 해설을 들은 다음 날에만 다음 그림으로 넘어간다.
 * 듣지 않으면 며칠이 지나도 같은 그림을 유지한다.
 */
export interface DailyArtworkProgress {
	/** DAILY_ARTWORKS 순번 */
	index: number;
	/** 현재 그림의 해설을 들은 날 (YYYY-MM-DD, 로컬). 듣지 않았으면 null */
	listenedOn: string | null;
}

/** 로컬 날짜 키 (YYYY-MM-DD) — 문자열 비교로 날짜 선후를 판단할 수 있다 */
export const toDayKey = (date: Date): string =>
	`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** 오늘 보여줄 진행 상태. 이전 날에 들었으면 한 칸만 넘기고 들은 기록을 비운다 */
export const resolveDailyArtworkProgress = (
	progress: DailyArtworkProgress,
	todayKey: string,
	length: number,
): DailyArtworkProgress => {
	if (length <= 0) return { index: 0, listenedOn: null };
	const index = ((progress.index % length) + length) % length;

	if (progress.listenedOn !== null && progress.listenedOn < todayKey) {
		return { index: (index + 1) % length, listenedOn: null };
	}

	return { index, listenedOn: progress.listenedOn };
};

/** 오늘 해설을 들었다고 기록한다 — 그림은 다음 날 바뀐다 */
export const markDailyArtworkListened = (
	progress: DailyArtworkProgress,
	todayKey: string,
): DailyArtworkProgress => ({ ...progress, listenedOn: todayKey });
