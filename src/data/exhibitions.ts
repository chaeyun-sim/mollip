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
	heroImageUri?: string;
	openHours: string;
	closedDays?: string;
	admission: string;
	admissionFree?: boolean;
	ticketUrl?: string;
	phone?: string;
	coordinates?: { latitude: number; longitude: number };
	genre: string;
	exhibitionType?: string;
	artworks: Artwork[];
	relatedExhibitionIds: string[];
	relatedExhibitions?: Exhibition[];
	tags?: string[];
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
