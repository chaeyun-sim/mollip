import {
	markDailyArtworkListened,
	resolveDailyArtworkProgress,
	toDayKey,
} from '../dailyArtworkProgress';

const LENGTH = 5;

describe('toDayKey — 로컬 날짜 키', () => {
	it('YYYY-MM-DD 형식이고 같은 날이면 시각과 무관하다', () => {
		expect(toDayKey(new Date(2026, 9, 7, 0, 1))).toBe('2026-10-07');
		expect(toDayKey(new Date(2026, 9, 7, 23, 59))).toBe('2026-10-07');
	});
});

describe('resolveDailyArtworkProgress — 오늘 보여줄 명화', () => {
	it('어제 들었으면 오늘은 다음 그림으로 넘어가고 들은 기록을 비운다', () => {
		expect(
			resolveDailyArtworkProgress({ index: 2, listenedOn: '2026-10-06' }, '2026-10-07', LENGTH),
		).toEqual({ index: 3, listenedOn: null });
	});

	it('오늘 들었으면 오늘은 그대로 유지한다', () => {
		expect(
			resolveDailyArtworkProgress({ index: 2, listenedOn: '2026-10-07' }, '2026-10-07', LENGTH),
		).toEqual({ index: 2, listenedOn: '2026-10-07' });
	});

	it('듣지 않았으면 며칠이 지나도 같은 그림을 유지한다', () => {
		expect(
			resolveDailyArtworkProgress({ index: 2, listenedOn: null }, '2026-10-20', LENGTH),
		).toEqual({ index: 2, listenedOn: null });
	});

	it('며칠 만에 들어와도 한 칸만 넘어간다', () => {
		expect(
			resolveDailyArtworkProgress({ index: 2, listenedOn: '2026-10-01' }, '2026-10-20', LENGTH),
		).toEqual({ index: 3, listenedOn: null });
	});

	it('마지막 그림 다음은 처음으로 순환한다', () => {
		expect(
			resolveDailyArtworkProgress({ index: 4, listenedOn: '2026-10-06' }, '2026-10-07', LENGTH),
		).toEqual({ index: 0, listenedOn: null });
	});

	it('목록이 줄어 순번이 범위를 넘으면 범위 안으로 맞춘다', () => {
		expect(
			resolveDailyArtworkProgress({ index: 7, listenedOn: null }, '2026-10-07', LENGTH),
		).toEqual({ index: 2, listenedOn: null });
	});
});

describe('markDailyArtworkListened — 들은 날 기록', () => {
	it('순번은 그대로 두고 오늘 날짜를 기록한다', () => {
		expect(markDailyArtworkListened({ index: 2, listenedOn: null }, '2026-10-07')).toEqual({
			index: 2,
			listenedOn: '2026-10-07',
		});
	});
});
