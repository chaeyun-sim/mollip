interface LocalizableExhibition {
	title: string;
	titleEn?: string | null;
	venue: string;
	venueEn?: string | null;
}

/** 영어 설정이면 영문 제목·장소를 우선하고, 영문 값이 비어 있으면 한국어로 폴백한다 (양쪽 모두 trim) */
export const localizeExhibition = (
	item: LocalizableExhibition,
	language: string,
): { title: string; venue: string } => {
	const isEn = language === 'en';
	const titleEn = item.titleEn?.trim();
	const venueEn = item.venueEn?.trim();
	return {
		title: isEn && titleEn ? titleEn : item.title.trim(),
		venue: isEn && venueEn ? venueEn : item.venue.trim(),
	};
};
