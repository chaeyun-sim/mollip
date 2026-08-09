export type FrameRatio = '3:4' | '4:3' | '2:3' | '1:1';

export interface Artwork {
	id: string;
	title: string;
	artist: string;
	year?: string;
	thumbnailColor: string;
	frameRatio?: FrameRatio;
	imageSource?: ReturnType<typeof require>;
	imageUri?: string;
	medium?: string;
	dimensions?: string;
	description?: string;
	collection?: string;
	collectionCity?: string;
}

export interface Exhibition {
	// — 식별
	id: string;
	source?: string;
	museumId?: number | null;

	// — 전시 기본 정보
	title: string;
	artist?: string;
	description: string;
	genre: string;
	exhibitionType?: string;
	tags?: string[];
	note?: string;

	// — 장소
	venue: string;
	eventSite?: string;
	venueAddress?: string;
	venueGroupName?: string;
	coordinates?: { latitude: number; longitude: number };

	// — 기간
	startDate: string;
	endDate: string;

	// — 운영
	openHours: string;
	closedDays?: string;
	admission: string;
	admissionFree?: boolean;
	phone?: string;

	// — 링크
	ticketUrl?: string;
	web_site?: string;
	homepage_url?: string;

	// — 이미지
	heroImageUri?: string;
	posterColor: string;
	posterImage?: ReturnType<typeof require>;

	// — 관계
	artworks: Artwork[];
	relatedExhibitionIds: string[];
	relatedExhibitions?: Exhibition[];
}

// 전시 본문은 Supabase exhibitions(kcisa/culture/manual)에서 조회한다.
export const EXHIBITIONS: Exhibition[] = [];

export function getArtwork(artworkId: string): { artwork: Artwork; exhibition: Exhibition } | undefined {
	for (const exhibition of EXHIBITIONS) {
		const artwork = exhibition.artworks.find((a) => a.id === artworkId);
		if (artwork) return { artwork, exhibition };
	}
	return undefined;
}
