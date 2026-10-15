import type { DayVisit } from '@/src/store/visitStore';

const TITLES = [
	'빛의 정원',
	'모네에서 앤디 워홀까지',
	'오늘의 정원',
	'세잔과 르누아르',
	'한국 현대미술 60년',
	'색채의 항해',
	'침묵의 풍경',
	'도시의 초상',
	'조용한 물결',
	'백남준 아카이브',
	'여름의 끝',
	'사물의 시간',
	'-',
];
const VENUES = ['예술의전당', '국립현대미술관', '리움미술관', '아모레퍼시픽미술관', 'DDP', '-'];
const MEMOS = [
	'오래 기억하고 싶은 전시',
	'색이 정말 좋았다. 다음에 또 오고 싶다.',
	'',
	'조용히 걷기 좋았던 오후, 마지막 방의 영상 작품이 가장 인상 깊었다.',
	'',
];

/** 시드 고정 난수 — 다시 그려도 같은 기록이 나온다 */
const seeded = (seed: number) => {
	let state = seed;
	return () => {
		state = (state * 1664525 + 1013904223) % 4294967296;
		return state / 4294967296;
	};
};

/** 상세 갤러리 확인용 추가 사진 — 세로·가로·정사각을 섞고 대표 이미지 중복을 일부 끼운다. 모두 정상 주소다 */
const buildMockVenuePhotos = (index: number, thumbnail: string): string[] | undefined => {
	if (index % 3 === 1) {
		return [
			thumbnail,
			`https://picsum.photos/seed/mollip${index}a/800/600`,
			`https://picsum.photos/seed/mollip${index}b/600/900`,
			`https://picsum.photos/seed/mollip${index}c/700/700`,
		];
	}
	if (index % 7 === 2) {
		return [`https://picsum.photos/seed/mollip${index}a/800/600`];
	}
	return undefined;
};

/** 개발용 가짜 확정 기록 — 벽 레이아웃과 스크롤을 눈으로 확인하는 데만 쓴다 (저장하지 않는다) */
export const buildMockVisits = (
	count: number,
	endDate: Date = new Date(),
): Record<string, DayVisit> => {
	const random = seeded(7);
	const visits: Record<string, DayVisit> = {};
	for (let i = 0; i < count; i++) {
		const date = new Date(endDate);
		date.setDate(date.getDate() - Math.floor(i * 3.1 + random() * 2));
		const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
		const hasImage = random() > 0.3;
		const [w, h] = [
			[600, 800],
			[700, 700],
			[800, 600],
		][Math.floor(random() * 3)];
		const thumbnail = hasImage ? `https://picsum.photos/seed/mollip${i}/${w}/${h}` : undefined;
		visits[`${dateKey}::t:mock${i}`] = {
			exhibitionId: null,
			exhibitionTitle: TITLES[Math.floor(random() * TITLES.length)],
			venue: VENUES[Math.floor(random() * VENUES.length)],
			thumbnail,
			venuePhotos: thumbnail ? buildMockVenuePhotos(i, thumbnail) : undefined,
			memo: MEMOS[Math.floor(random() * MEMOS.length)] || undefined,
			rating: 1 + Math.floor(random() * 5),
			listened: [],
			status: 'confirmed',
		};
	}
	return visits;
};

/** 사진 로드 실패 UI를 확인하려는 QA 전용 기록 — 목록(벽)에는 나오지 않고, 이 키를 딥링크로 직접 열 때만 상세에서 쓴다 */
export const QA_BROKEN_PHOTO_VISIT_KEY = '2026-10-13::t:qa-broken-photos';

export const getQaFixtureVisit = (visitKey: string | undefined): DayVisit | undefined => {
	if (visitKey !== QA_BROKEN_PHOTO_VISIT_KEY) return undefined;
	return {
		exhibitionId: null,
		exhibitionTitle: '사진 로드 실패 확인용',
		venue: 'QA 픽스처',
		thumbnail: 'https://picsum.photos/seed/mollip-qa/800/600',
		venuePhotos: [
			'https://broken.mollip.test/x.jpg',
			'https://picsum.photos/seed/mollip-qa2/600/900',
		],
		memo: '두 번째 사진은 일부러 깨진 주소다.',
		rating: 3,
		listened: [],
		status: 'confirmed',
	};
};
