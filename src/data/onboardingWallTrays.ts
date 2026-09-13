/** 나의 첫 전시 벽 — 5개 트레이 × 3개 작품 조각 데이터 계약 (02-design-brief.md 표 그대로 이관) */

export interface OnboardingWallPiece {
	/** 전체 트레이를 통틀어 고유한 조각 id */
	id: string;
	/** 감상 단서 (최대 2줄) */
	cue: string;
	/** src/constants/exhibitionTaxonomy.ts ART_GENRE_VALUES와 1:1 대응하는 저장 장르명 */
	genre: string;
	/** 추상 텍스처 placeholder에 쓰는 배경색 */
	color: string;
	/** 추상 텍스처 패턴 종류 — 실사진 도입 전까지 장르 계열을 구분하는 용도 */
	texture: 'diagonal' | 'dot' | 'grid' | 'wave' | 'collage';
}

export interface OnboardingWallTray {
	/** 라운드 id */
	id: string;
	/** 라운드 제목 (스크린리더 안내에 사용) */
	title: string;
	pieces: [OnboardingWallPiece, OnboardingWallPiece, OnboardingWallPiece];
}

export const ONBOARDING_WALL_TRAYS: OnboardingWallTray[] = [
	{
		id: 'light-and-scene',
		title: '빛과 장면',
		pieces: [
			{ id: 'light-media', cue: '빛이 번지는 화면', genre: '미디어아트', color: '#D9CBE8', texture: 'wave' },
			{ id: 'light-photo', cue: '멈춘 한 장면', genre: '사진', color: '#C9CCD6', texture: 'dot' },
			{ id: 'light-video', cue: '움직이는 장면', genre: '영상', color: '#B9C7D9', texture: 'diagonal' },
		],
	},
	{
		id: 'line-and-space',
		title: '선과 여백',
		pieces: [
			{ id: 'line-painting', cue: '붓질의 온도', genre: '회화', color: '#E3C9B6', texture: 'diagonal' },
			{ id: 'line-korean', cue: '여백의 먹선', genre: '한국화', color: '#DCD6C8', texture: 'grid' },
			{ id: 'line-drawing', cue: '손의 선', genre: '드로잉', color: '#D8D2CB', texture: 'dot' },
		],
	},
	{
		id: 'handmade-texture',
		title: '손으로 만든 물성',
		pieces: [
			{ id: 'texture-sculpture', cue: '입체의 무게', genre: '조각', color: '#C7BEB2', texture: 'grid' },
			{ id: 'texture-craft', cue: '만든 손의 결', genre: '공예', color: '#D3C1A9', texture: 'dot' },
			{ id: 'texture-fiber', cue: '천의 리듬', genre: '섬유', color: '#DCC7C0', texture: 'wave' },
		],
	},
	{
		id: 'space-and-print',
		title: '공간과 인쇄',
		pieces: [
			{ id: 'space-installation', cue: '공간을 걷는 작품', genre: '설치', color: '#BFC9C2', texture: 'diagonal' },
			{ id: 'space-print', cue: '찍어 낸 선', genre: '판화', color: '#CBC4B8', texture: 'grid' },
			{ id: 'space-graphic', cue: '문자와 형태', genre: '그래픽', color: '#C6CBD4', texture: 'dot' },
		],
	},
	{
		id: 'contemporary-stimulus',
		title: '동시대의 자극',
		pieces: [
			{ id: 'contemporary-sound', cue: '귀로 만나는 작품', genre: '사운드', color: '#B7C2CC', texture: 'wave' },
			{ id: 'contemporary-pop', cue: '대중의 색', genre: '팝아트', color: '#E3B9B9', texture: 'dot' },
			{ id: 'contemporary-mixed', cue: '경계를 섞는 전시', genre: '현대미술', color: '#CBBEDB', texture: 'collage' },
		],
	},
];
