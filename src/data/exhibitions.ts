export type FrameRatio = '3:4' | '4:3' | '2:3' | '1:1';

export interface Artwork {
	id: string;
	title: string;
	artist: string;
	year?: string;
	thumbnailColor: string;
	frameRatio?: FrameRatio;
	imageSource?: ReturnType<typeof require>;
	// Wikidata 등에서 가져온 원격 작품 이미지 URL. 있으면 imageSource보다 우선 사용.
	imageUri?: string;
	medium?: string;
	dimensions?: string;
	description?: string;
	collection?: string;
	collectionCity?: string;
}

export interface Exhibition {
	id: string;
	title: string;
	venue: string;
	venueAddress?: string;
	startDate: string;
	endDate: string;
	artist?: string;
	curator?: string;
	curatorNote?: string;
	description: string;
	posterColor: string;
	posterImage?: ReturnType<typeof require>;
	// 문화포털 API로 조회한 전시의 실제 포스터 URL (원격 이미지). 있으면 히어로에서 우선 사용.
	heroImageUri?: string;
	openHours: string;
	closedDays?: string;
	admission: string;
	admissionFree?: boolean;
	ticketUrl?: string;
	phone?: string;
	coordinates?: { latitude: number; longitude: number };
	// 관련 전시 카드(포스터 캐러셀)에 표시되는 장르 배지. 데이터 소스와 무관하게 항상 채워져야 함.
	genre: string;
	artworks: Artwork[];
	relatedExhibitionIds: string[];
	// API 소스(KCISA 등)에서 이미 완전히 조회해둔 관련 전시. 있으면 relatedExhibitionIds보다 우선.
	relatedExhibitions?: Exhibition[];
	tags?: string[];
}

export const EXHIBITIONS: Exhibition[] = [
	{
		id: '1',
		title: '모네, 빛을 그리다',
		venue: '예술의전당',
		coordinates: { latitude: 37.4784, longitude: 127.0082 },
		startDate: '2026.05.01',
		endDate: '2026.08.31',
		artist: '클로드 모네',
		description:
			'인상주의의 대가 클로드 모네의 대표작 60여 점을 한자리에서 만날 수 있는 특별전입니다. 빛과 색채의 마법사 모네가 포착한 순간들, 수련 연작부터 루앙 대성당까지 그의 예술 세계를 깊이 있게 탐구합니다.',
		posterColor: '#E8D5B7',
		posterImage: require('../../assets/images/example/exhibition-1.png'),
		genre: '인상주의',
		openHours: '10:00 – 20:00',
		closedDays: '매주 월요일',
		admission: '성인 18,000원',
		ticketUrl: 'https://tickets.interpark.com',
		curatorNote: '모네는 단순히 사물을 그리지 않았습니다. 그는 빛이 사물 위에서 어떻게 춤추는지를 포착했습니다. 이번 전시는 그 빛의 여정을 따라가며, 관람객이 직접 인상주의의 탄생 순간을 체험할 수 있도록 구성했습니다.',
		tags: ['인상주의', '풍경화', '빛과 색채', '명화'],
		artworks: [
			{
				id: 'a1-1',
				title: '수련',
				artist: '클로드 모네',
				year: '1906',
				thumbnailColor: '#7BA7A7',
				frameRatio: '1:1',
				medium: '캔버스에 유화',
				dimensions: '89.5 × 92.7 cm',
				description: '모네가 지베르니의 정원 연못을 바라보며 완성한 연작 중 하나입니다. 물 위에 반영된 하늘과 수련의 경계가 허물어지며, 빛과 색채만이 남는 인상주의의 정수를 보여줍니다.',
				collection: '시카고 미술관',
				collectionCity: '시카고, 미국',
			},
			{
				id: 'a1-2',
				title: '루앙 대성당',
				artist: '클로드 모네',
				year: '1894',
				thumbnailColor: '#C4A882',
				frameRatio: '2:3',
				medium: '캔버스에 유화',
				dimensions: '100 × 65 cm',
				description: '모네는 루앙 대성당의 정면을 서로 다른 시간대와 날씨 조건에서 30여 점 연작으로 담았습니다. 빛의 변화에 따라 달라지는 석조 건물의 표면이 마치 살아 숨쉬는 듯합니다.',
				collection: '오르세 미술관',
				collectionCity: '파리, 프랑스',
			},
			{
				id: 'a1-3',
				title: '인상, 해돋이',
				artist: '클로드 모네',
				year: '1872',
				thumbnailColor: '#6B8BA4',
				frameRatio: '4:3',
				medium: '캔버스에 유화',
				dimensions: '48 × 63 cm',
				description: '르아브르 항구의 새벽을 담은 이 작품은 "인상주의"라는 미술 운동의 이름 자체가 된 그림입니다. 안개 속 흐릿한 윤곽과 주황빛 태양의 대비가 강렬한 인상을 남깁니다.',
				collection: '마르모탕 모네 미술관',
				collectionCity: '파리, 프랑스',
			},
			{ id: 'a1-4', title: '건초더미', artist: '클로드 모네', year: '1891', thumbnailColor: '#D4A55A' },
			{ id: 'a1-5', title: '포플러', artist: '클로드 모네', year: '1891', thumbnailColor: '#8CAF6E' },
		],
		relatedExhibitionIds: ['4', '6'],
	},
	{
		id: '2',
		title: '이중섭 특별전',
		venue: '국립현대미술관 서울관',
		coordinates: { latitude: 37.5789, longitude: 126.9800 },
		startDate: '2026.04.10',
		endDate: '2026.07.20',
		artist: '이중섭',
		description:
			'한국 근현대 미술의 거장 이중섭의 탄생 110주년을 기념하는 대규모 회고전입니다.',
		posterColor: '#D5E8D4',
		genre: '한국화',
		openHours: '10:00 – 18:00',
		closedDays: '매주 월요일',
		admission: '무료',
		admissionFree: true,
		ticketUrl: 'https://www.mmca.go.kr',
		curatorNote: '이중섭의 예술은 고통 속에서도 꺼지지 않는 인간의 의지를 담고 있습니다. 그의 붓질 하나하나에는 가족을 향한 그리움과 조국에 대한 사랑이 배어 있습니다.',
		tags: ['근현대미술', '한국화', '회고전', '거장'],
		artworks: [
			{
				id: 'a2-1',
				title: '황소',
				artist: '이중섭',
				year: '1953',
				thumbnailColor: '#8B6914',
				frameRatio: '4:3',
				medium: '종이에 유화',
				dimensions: '35.5 × 52 cm',
				description: '한국 근현대 미술의 가장 상징적인 작품 중 하나입니다. 억압과 저항을 상징하는 황소의 눈빛과 근육질의 몸체에서 격동의 한국 근현대사와 작가의 고뇌가 동시에 느껴집니다.',
				collection: '국립현대미술관',
				collectionCity: '서울, 한국',
			},
			{ id: 'a2-2', title: '흰 소', artist: '이중섭', year: '1954', thumbnailColor: '#E8E0D0' },
			{ id: 'a2-3', title: '길 떠나는 가족', artist: '이중섭', year: '1954', thumbnailColor: '#A0866C' },
			{ id: 'a2-4', title: '두 아이', artist: '이중섭', year: '1955', thumbnailColor: '#C8B89A' },
		],
		relatedExhibitionIds: ['4', '1'],
	},
	{
		id: '3',
		title: '달리 초현실주의',
		venue: '세종문화회관',
		coordinates: { latitude: 37.5724, longitude: 126.9769 },
		startDate: '2026.06.01',
		endDate: '2026.09.15',
		artist: '살바도르 달리',
		description:
			'초현실주의 거장 살바도르 달리의 회화, 조각, 드로잉 80여 점을 선보이는 국내 최대 규모의 달리 전시입니다.',
		posterColor: '#D4D5E8',
		genre: '초현실주의',
		openHours: '10:00 – 19:00',
		admission: '성인 20,000원',
		ticketUrl: 'https://tickets.interpark.com',
		curatorNote: '달리의 세계에는 논리가 없습니다. 오직 꿈과 무의식만이 있을 뿐입니다. 이번 전시는 그 기묘하고 매혹적인 세계로 당신을 초대합니다.',
		tags: ['초현실주의', '현대미술', '조각', '드로잉'],
		artworks: [
			{
				id: 'a3-1',
				title: '기억의 지속',
				artist: '살바도르 달리',
				year: '1931',
				thumbnailColor: '#C4B896',
				frameRatio: '4:3',
				medium: '캔버스에 유화',
				dimensions: '24.1 × 33 cm',
				description: '녹아내리는 시계와 황량한 해변이 펼쳐지는 이 소품은 달리의 가장 유명한 작품입니다. 시간의 유동성과 무의식의 세계를 탁월하게 표현했으며, 초현실주의의 교과서로 불립니다.',
				collection: '뉴욕 현대미술관 (MoMA)',
				collectionCity: '뉴욕, 미국',
			},
			{ id: 'a3-2', title: '코끼리', artist: '살바도르 달리', year: '1948', thumbnailColor: '#8899AA' },
			{ id: 'a3-3', title: '성 안토니우스의 유혹', artist: '살바도르 달리', year: '1946', thumbnailColor: '#B8956E' },
			{ id: 'a3-4', title: '꿈', artist: '살바도르 달리', year: '1937', thumbnailColor: '#9AADBC' },
		],
		relatedExhibitionIds: ['5', '6'],
	},
	{
		id: '4',
		title: '김환기 회고전',
		venue: '환기미술관',
		coordinates: { latitude: 37.5844, longitude: 126.9676 },
		startDate: '2026.05.01',
		endDate: '2026.09.30',
		artist: '김환기',
		description:
			'한국 추상미술의 선구자 김환기의 탄생 110주년을 기념하는 대규모 회고전.',
		posterColor: '#D4C5B0',
		genre: '추상미술',
		openHours: '10:00 – 18:00',
		closedDays: '매주 월요일',
		admission: '성인 10,000원',
		tags: ['추상미술', '한국화', '회고전', '점·선·면'],
		artworks: [
			{ id: 'a4-1', title: '어디서 무엇이 되어 다시 만나랴', artist: '김환기', year: '1970', thumbnailColor: '#3A5A8C' },
			{ id: 'a4-2', title: '19-VII-71', artist: '김환기', year: '1971', thumbnailColor: '#4A6A9C' },
			{ id: 'a4-3', title: '산월', artist: '김환기', year: '1960', thumbnailColor: '#6A8A6C' },
			{ id: 'a4-4', title: '론도', artist: '김환기', year: '1938', thumbnailColor: '#8A7A5C' },
		],
		relatedExhibitionIds: ['1', '2'],
	},
	{
		id: '5',
		title: 'KAWS: HOLIDAY',
		venue: '롯데뮤지엄',
		coordinates: { latitude: 37.5133, longitude: 127.1028 },
		startDate: '2026.06.15',
		endDate: '2026.10.01',
		artist: 'KAWS',
		description:
			'세계적인 팝 아티스트 KAWS의 아시아 순회 전시.',
		posterColor: '#B8CCB8',
		genre: '팝아트',
		openHours: '10:00 – 20:00',
		admission: '성인 18,000원',
		ticketUrl: 'https://tickets.lottemuseum.com',
		tags: ['팝아트', '현대미술', '설치', '컬래버'],
		artworks: [
			{ id: 'a5-1', title: 'COMPANION', artist: 'KAWS', year: '2020', thumbnailColor: '#4A4A4A' },
			{ id: 'a5-2', title: 'BFF', artist: 'KAWS', year: '2018', thumbnailColor: '#E8A0C8' },
			{ id: 'a5-3', title: 'SHARE', artist: 'KAWS', year: '2021', thumbnailColor: '#6A8AAC' },
			{ id: 'a5-4', title: 'ALONG THE WAY', artist: 'KAWS', year: '2019', thumbnailColor: '#8A6A5C' },
		],
		relatedExhibitionIds: ['3', '6'],
	},
	{
		id: '6',
		title: '반 고흐: 별이 빛나는 밤',
		venue: 'DDP 갤러리',
		coordinates: { latitude: 37.5673, longitude: 127.0095 },
		startDate: '2026.04.01',
		endDate: '2026.08.15',
		artist: '빈센트 반 고흐',
		description:
			'몰입형 미디어아트로 재탄생한 반 고흐의 세계.',
		posterColor: '#C8C5D8',
		genre: '몰입형 미디어아트',
		openHours: '10:00 – 21:00',
		admission: '성인 20,000원',
		ticketUrl: 'https://tickets.interpark.com',
		curatorNote: '고흐의 별이 빛나는 밤은 단순한 그림이 아닙니다. 그것은 절망 속에서도 빛을 찾으려 했던 한 인간의 절규입니다. 몰입형 미디어아트로 재탄생한 이 작품은 관람객을 그 밤하늘 한가운데로 데려갑니다.',
		tags: ['후기인상주의', '몰입형', '미디어아트', '야간관람'],
		artworks: [
			{
				id: 'a6-1',
				title: '별이 빛나는 밤',
				artist: '빈센트 반 고흐',
				year: '1889',
				thumbnailColor: '#2A4A8A',
				frameRatio: '4:3',
				medium: '캔버스에 유화',
				dimensions: '73.7 × 92.1 cm',
				description: '생레미드프로방스의 정신병원에서 바라본 밤하늘을 담은 작품입니다. 소용돌이치는 하늘과 빛나는 별들, 조용히 잠든 마을의 대비가 극적인 내면의 감정을 드러냅니다.',
				collection: '뉴욕 현대미술관 (MoMA)',
				collectionCity: '뉴욕, 미국',
			},
			{
				id: 'a6-2',
				title: '해바라기',
				artist: '빈센트 반 고흐',
				year: '1888',
				thumbnailColor: '#D4A824',
				frameRatio: '3:4',
				medium: '캔버스에 유화',
				dimensions: '92.1 × 73 cm',
				description: '아를에 머물던 시기 고갱을 맞이하기 위해 그린 연작 중 하나입니다. 노란색의 무한한 변주 속에서 삶에 대한 고흐의 열정과 집착이 고스란히 드러납니다.',
				collection: '내셔널 갤러리',
				collectionCity: '런던, 영국',
			},
			{ id: 'a6-3', title: '자화상', artist: '빈센트 반 고흐', year: '1889', thumbnailColor: '#6A9A8C' },
			{ id: 'a6-4', title: '아를의 침실', artist: '빈센트 반 고흐', year: '1888', thumbnailColor: '#7A9AC4' },
		],
		relatedExhibitionIds: ['1', '3'],
	},
];

export function getExhibition(id: string): Exhibition | undefined {
	return EXHIBITIONS.find((e) => e.id === id);
}

export function getArtwork(artworkId: string): { artwork: Artwork; exhibition: Exhibition } | undefined {
	for (const exhibition of EXHIBITIONS) {
		const artwork = exhibition.artworks.find((a) => a.id === artworkId);
		if (artwork) return { artwork, exhibition };
	}
	return undefined;
}
