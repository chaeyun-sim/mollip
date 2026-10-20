export const PREFERRED_TASTE_OPTIONS = {
	moods: [
		{ value: 'calm', label: '차분한', keywords: ['차분', '고요', '정적', '명상', '휴식'] },
		{ value: 'dreamy', label: '몽환적인', keywords: ['몽환', '꿈', '환상', '초현실'] },
		{
			value: 'vivid',
			label: '생동감 있는',
			keywords: ['생동감', '강렬', '화려', '색채', '팝아트'],
		},
		{ value: 'warm', label: '따뜻한', keywords: ['따뜻', '온기', '일상', '가족'] },
		{ value: 'thoughtful', label: '사유적인', keywords: ['사유', '철학', '질문', '성찰', '사회'] },
	],
	venueScales: [
		{
			value: 'small',
			label: '한 층의 작은 갤러리',
			keywords: ['갤러리', '화랑', '아트스페이스', '전시공간'],
		},
		{
			value: 'medium',
			label: '중간 규모의 전시장',
			keywords: ['아트센터', '문화센터', '문화재단'],
		},
		{ value: 'large', label: '대형 미술관·박물관', keywords: ['미술관', '박물관'] },
	],
	artMovements: [
		{ value: 'impressionism', label: '인상주의', keywords: ['인상주의', '인상파'] },
		{ value: 'surrealism', label: '초현실주의', keywords: ['초현실주의', '초현실'] },
		{ value: 'abstract', label: '추상미술', keywords: ['추상미술', '추상화', '추상'] },
		{ value: 'pop-art', label: '팝아트', keywords: ['팝아트', '팝 아트'] },
		{ value: 'expressionism', label: '표현주의', keywords: ['표현주의'] },
		{ value: 'minimalism', label: '미니멀리즘', keywords: ['미니멀리즘', '미니멀'] },
		{
			value: 'contemporary',
			label: '현대미술',
			keywords: ['현대미술', '동시대 미술', '현대 예술'],
		},
	],
} as const;

export type PreferredTasteDetails = {
	moods: string[];
	venueScales: string[];
	artMovements: string[];
};

export const EMPTY_PREFERRED_TASTE: PreferredTasteDetails = {
	moods: [],
	venueScales: [],
	artMovements: [],
};

export function normalizePreferredTaste(value: unknown): PreferredTasteDetails {
	if (!value || typeof value !== 'object') return EMPTY_PREFERRED_TASTE;
	const input = value as Record<string, unknown>;
	const valid = (key: keyof PreferredTasteDetails, options: readonly { value: string }[]) => {
		const candidate = input[key];
		if (!Array.isArray(candidate)) return [];
		const allowed = new Set(options.map((option) => option.value));
		return candidate.filter(
			(item): item is string => typeof item === 'string' && allowed.has(item),
		);
	};
	return {
		moods: valid('moods', PREFERRED_TASTE_OPTIONS.moods),
		venueScales: valid('venueScales', PREFERRED_TASTE_OPTIONS.venueScales),
		artMovements: valid('artMovements', PREFERRED_TASTE_OPTIONS.artMovements),
	};
}

export function matchPreferredTaste(
	text: string,
	venue: string,
	preferences: PreferredTasteDetails,
): string | undefined {
	return matchPreferredTastes(text, venue, preferences)[0];
}

export function matchPreferredTastes(
	text: string,
	venue: string,
	preferences: PreferredTasteDetails,
): string[] {
	const normalizedText = text.toLocaleLowerCase();
	const normalizedVenue = venue.toLocaleLowerCase();
	const matches: string[] = [];
	const groups: {
		key: keyof PreferredTasteDetails;
		options: readonly { value: string; label: string; keywords: readonly string[] }[];
	}[] = [
		{ key: 'moods', options: PREFERRED_TASTE_OPTIONS.moods },
		{ key: 'venueScales', options: PREFERRED_TASTE_OPTIONS.venueScales },
		{ key: 'artMovements', options: PREFERRED_TASTE_OPTIONS.artMovements },
	];
	for (const { key, options } of groups) {
		const selected = new Set(preferences[key]);
		for (const option of options) {
			if (!selected.has(option.value)) continue;
			const source = key === 'venueScales' ? normalizedVenue : normalizedText;
			if (option.keywords.some((keyword) => source.includes(keyword.toLocaleLowerCase()))) {
				matches.push(option.label);
			}
		}
	}
	return matches;
}

export function matchPreferredArtist(text: string, artists: string[]): string | undefined {
	return matchPreferredArtists(text, artists)[0];
}

export function matchPreferredArtists(text: string, artists: string[]): string[] {
	const normalizedText = text.toLocaleLowerCase();
	return artists.filter((artist) => {
		const normalizedArtist = artist.trim().toLocaleLowerCase();
		return normalizedArtist.length > 0 && normalizedText.includes(normalizedArtist);
	});
}
