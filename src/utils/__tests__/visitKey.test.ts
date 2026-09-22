import { dateKeyOf, localVisitKeyFromRemote, makeVisitKey, visitIdentityOf } from '../visitKey';

describe('visit key helpers', () => {
	it('티켓 키에서 관람일과 전시 식별을 나눈다', () => {
		const key = makeVisitKey('2026-09-15', null, '세잔과 르누아르');
		expect(key).toBe('2026-09-15::t:세잔과 르누아르');
		expect(dateKeyOf(key)).toBe('2026-09-15');
		expect(visitIdentityOf(key)).toBe('t:세잔과 르누아르');
	});

	it('원격 행의 date(관람일)로 로컬 키를 복원한다', () => {
		expect(localVisitKeyFromRemote('2026-09-15', 't:세잔과 르누아르')).toBe(
			'2026-09-15::t:세잔과 르누아르',
		);
		expect(localVisitKeyFromRemote('2026-09-15', '2026-09-15::id:7922')).toBe(
			'2026-09-15::id:7922',
		);
	});
});
