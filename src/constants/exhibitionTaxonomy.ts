/** DB genre 컬럼 — 단일 “미술 매체/분야” (우선순위: 앞일수록 먼저 매칭) */
export const ART_GENRE_RULES: { genre: string; keywords: string[] }[] = [
	{
		genre: '미디어아트',
		keywords: ['미디어아트', '미디어 아트', '뉴미디어', 'ai 미디어', 'media art', '몰입형'],
	},
	{ genre: '영상', keywords: ['영상', '비디오', 'video', 'vr ', ' ar ', 'film'] },
	{ genre: '사진', keywords: ['사진', 'photo', 'photography', '포토'] },
	{ genre: '조각', keywords: ['조각', 'sculpture', '입체'] },
	{ genre: '설치', keywords: ['설치', 'installation'] },
	{ genre: '사운드', keywords: ['사운드', 'sound art', '음향'] },
	{ genre: '드로잉', keywords: ['드로잉', 'drawing', '소묘'] },
	{ genre: '판화', keywords: ['판화', 'print', '에칭', '리토그래프'] },
	{ genre: '한국화', keywords: ['한국화', '동양화', '수묵'] },
	{ genre: '회화', keywords: ['회화', 'painting', '유화', '아크릴', '캔버스'] },
	{ genre: '공예', keywords: ['공예', '도예', 'ceramic', '금속공예', '목예'] },
	{ genre: '섬유', keywords: ['섬유', '직물', 'quilt', '섬유작'] },
	{ genre: '그래픽', keywords: ['그래픽', '일러스트', '디자인'] },
	{ genre: '팝아트', keywords: ['팝아트', 'pop art'] },
	{ genre: '현대미술', keywords: ['현대미술', 'contemporary'] },
];

export const ART_GENRE_VALUES = new Set(ART_GENRE_RULES.map((r) => r.genre));

/** DB type 컬럼 — 전시 유형 단일값 (규칙 순서 = 우선순위) */
export const EXHIBITION_TYPE_RULES: { type: string; keywords: string[] }[] = [
	{ type: '상설전', keywords: ['상설', '상설전', '소장품전', '소장품', 'collection'] },
	{ type: '기획전', keywords: ['기획전', '기획 전시', '기획展'] },
	{ type: '특별전', keywords: ['특별전', '特別'] },
	{
		type: '아카이브',
		keywords: [
			'아카이브',
			'archive',
			'archival',
			'기록물',
			'문헌',
			'문헌자료',
			'역사자료',
			'기록 전시',
			'자료 전시',
			'편지',
			'서한',
			'고문서',
			'문서자료',
			'문헌 전시',
		],
	},
	{ type: '초대전', keywords: ['초대전'] },
	{ type: '개인전', keywords: ['개인전', 'solo'] },
	{ type: '그룹전', keywords: ['그룹전', '단체전', 'group exhibition'] },
	{ type: '회고전', keywords: ['회고전', 'retrospective'] },
	{ type: '순회전', keywords: ['순회', 'touring'] },
	{ type: '팝업', keywords: ['팝업', 'popup'] },
];

export const EXHIBITION_TYPE_VALUES = new Set(EXHIBITION_TYPE_RULES.map((r) => r.type));

/** DB tags — 관람·편의 키워드만 (genre/type 값은 넣지 않음). 키즈는 태그로 쓰지 않음 */
export const THEME_TAG_RULES: { tag: string; keywords: string[] }[] = [
	{ tag: '무료', keywords: ['무료 관람', '무료입장', '관람료 무료'] },
];

/** genre 컬럼에 들어가면 안 되는 값 (전시 상태·플레이스홀더) */
export const NON_ART_GENRE_VALUES = new Set([
	'전시',
	'현재 전시',
	'예정 전시',
	'과거 전시',
	'현재전시',
	'예정전시',
	'과거전시',
	'기획전시',
]);
