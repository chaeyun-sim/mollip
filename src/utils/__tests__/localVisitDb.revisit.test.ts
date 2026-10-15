import type { DayVisit } from '@/src/store/visitStore';

jest.mock('@react-native-async-storage/async-storage', () =>
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('../visitPhotoFiles', () => ({
	persistVisitPhotoFields: (visit: unknown) => visit,
}));

/** 컬럼 목록·실행된 SQL·저장된 행만 흉내 내는 가짜 expo-sqlite */
const fake = {
	columns: [] as string[],
	executed: [] as string[],
	runs: [] as { sql: string; params: unknown[] }[],
	rows: [] as Record<string, unknown>[],
};

jest.mock('expo-sqlite', () => ({
	openDatabaseSync: () => ({
		execSync: (sql: string) => {
			fake.executed.push(sql);
			if (/ADD COLUMN (\w+)/.test(sql)) fake.columns.push(/ADD COLUMN (\w+)/.exec(sql)![1]);
		},
		runSync: (sql: string, ...params: unknown[]) => fake.runs.push({ sql, params }),
		getAllSync: (sql: string) => {
			if (sql.includes('PRAGMA table_info')) return fake.columns.map((name) => ({ name }));
			if (sql.includes('FROM local_visits')) return fake.rows;
			return [];
		},
		withTransactionSync: (fn: () => void) => fn(),
	}),
}));

const LEGACY_COLUMNS = ['visit_key', 'date_key', 'rating', 'companion', 'keywords'];

const loadModule = () => {
	let mod!: typeof import('../localVisitDb');
	jest.isolateModules(() => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		mod = require('../localVisitDb');
	});
	return mod;
};

const baseRow = { visit_key: '2026-10-09::t:a', exhibition_id: null, rating: 4 };

describe('localVisitDb — is_revisit 마이그레이션과 영속', () => {
	beforeEach(() => {
		fake.columns = [...LEGACY_COLUMNS];
		fake.executed = [];
		fake.runs = [];
		fake.rows = [];
	});

	it('컬럼이 없는 기존 DB에는 is_revisit를 한 번만 덧붙이고 옛 행은 undefined로 읽는다', () => {
		fake.rows = [{ ...baseRow }];
		const { loadAllLocalVisits } = loadModule();

		const visits = loadAllLocalVisits();

		const alters = fake.executed.filter((sql) => sql.includes('ADD COLUMN is_revisit'));
		expect(alters).toEqual(['ALTER TABLE local_visits ADD COLUMN is_revisit INTEGER']);
		expect(fake.columns).toContain('is_revisit');
		expect(visits['2026-10-09::t:a'].isRevisit).toBeUndefined();
		expect(visits['2026-10-09::t:a'].rating).toBe(4);
	});

	it('이미 컬럼이 있으면 ALTER를 실행하지 않는다', () => {
		fake.columns = [...LEGACY_COLUMNS, 'is_revisit'];
		const { loadAllLocalVisits } = loadModule();

		loadAllLocalVisits();

		expect(fake.executed.some((sql) => sql.includes('ADD COLUMN is_revisit'))).toBe(false);
	});

	it('0/1/NULL을 false/true/undefined로 복원한다', () => {
		fake.columns = [...LEGACY_COLUMNS, 'is_revisit'];
		fake.rows = [
			{ ...baseRow, visit_key: 'a', is_revisit: 1 },
			{ ...baseRow, visit_key: 'b', is_revisit: 0 },
			{ ...baseRow, visit_key: 'c', is_revisit: null },
		];
		const { loadAllLocalVisits } = loadModule();

		const visits = loadAllLocalVisits();

		expect(visits.a.isRevisit).toBe(true);
		expect(visits.b.isRevisit).toBe(false);
		expect(visits.c.isRevisit).toBeUndefined();
	});

	it('저장할 때 true/false/undefined를 1/0/NULL로 쓰고 keywords에는 섞지 않는다', () => {
		const { upsertLocalVisit } = loadModule();
		const visit = (isRevisit?: boolean): DayVisit => ({
			exhibitionId: null,
			listened: [],
			rating: 4,
			keywords: ['고요한'],
			isRevisit,
		});

		upsertLocalVisit('2026-10-09::t:a', visit(true));
		upsertLocalVisit('2026-10-09::t:b', visit(false));
		upsertLocalVisit('2026-10-09::t:c', visit(undefined));

		const inserts = fake.runs.filter((run) =>
			run.sql.includes('INSERT OR REPLACE INTO local_visits'),
		);
		expect(inserts.map((run) => run.sql.includes('is_revisit'))).toEqual([true, true, true]);
		// 마지막 파라미터가 is_revisit, 그 앞이 keywords JSON
		expect(inserts.map((run) => run.params[run.params.length - 1])).toEqual([1, 0, null]);
		expect(inserts[0].params[inserts[0].params.length - 2]).toBe('["고요한"]');
	});

	it('로그인 오버레이로 슬림 저장해도 isRevisit가 남는다', () => {
		const { slimLocalVisit } = loadModule();
		const slim = slimLocalVisit({ exhibitionId: '1', listened: [], isRevisit: false });
		expect(slim.isRevisit).toBe(false);
	});
});
