import {
	ART_GENRE_RULES,
	ART_GENRE_VALUES,
	EXHIBITION_TYPE_RULES,
	EXHIBITION_TYPE_VALUES,
	NON_ART_GENRE_VALUES,
	THEME_TAG_RULES,
} from '@/src/constants/exhibitionTaxonomy';

const KIDS_TAG = '키즈';

function normalizeText(...parts: (string | null | undefined)[]): string {
	return parts
		.filter(Boolean)
		.join(' ')
		.toLowerCase()
		.replace(/\s+/g, ' ');
}

function matchKeywords(text: string, rules: { label: string; keywords: string[] }[]): string[] {
	const found: string[] = [];
	for (const { label, keywords } of rules) {
		if (keywords.some((kw) => text.includes(kw.toLowerCase()))) {
			found.push(label);
		}
	}
	return found;
}

function parseCompoundGenreField(raw: string): string[] {
	return raw
		.split(/[,，·/、]| 및 | 등|\(/)
		.map((s) => s.replace(/\d+점.*$/, '').trim())
		.filter(
			(s) =>
				s.length >= 2 &&
				!NON_ART_GENRE_VALUES.has(s) &&
				!EXHIBITION_TYPE_VALUES.has(s),
		);
}

function pickExhibitionType(typeMatches: string[]): string | null {
	for (const rule of EXHIBITION_TYPE_RULES) {
		if (typeMatches.includes(rule.type)) return rule.type;
	}
	return null;
}

function pickPrimaryGenre(genreCandidates: string[]): string | null {
	for (const rule of ART_GENRE_RULES) {
		if (genreCandidates.includes(rule.genre)) return rule.genre;
	}
	const fallback = genreCandidates.find(
		(g) => !EXHIBITION_TYPE_VALUES.has(g) && !NON_ART_GENRE_VALUES.has(g),
	);
	return fallback ?? null;
}

/** title/description에서 genre(1) · type(1) · tags(N) 추론 */
export function inferGenreAndTags(input: {
	title: string;
	description?: string | null;
	legacyGenre?: string | null;
}): { genre: string | null; type: string | null; tags: string[] } {
	const legacy = input.legacyGenre?.trim();
	const fromLegacy =
		legacy && !NON_ART_GENRE_VALUES.has(legacy) ? parseCompoundGenreField(legacy) : [];
	const text = normalizeText(input.title, input.description, legacy);

	const artFromRules = matchKeywords(
		text,
		ART_GENRE_RULES.map((r) => ({ label: r.genre, keywords: r.keywords })),
	);
	const typeMatches = matchKeywords(
		text,
		EXHIBITION_TYPE_RULES.map((r) => ({ label: r.type, keywords: r.keywords })),
	);
	const themeTags = matchKeywords(
		text,
		THEME_TAG_RULES.map((r) => ({ label: r.tag, keywords: r.keywords })),
	);

	const genreCandidates: string[] = [];
	const seenGenre = new Set<string>();
	for (const g of [...fromLegacy, ...artFromRules]) {
		if (EXHIBITION_TYPE_VALUES.has(g) || seenGenre.has(g)) continue;
		seenGenre.add(g);
		genreCandidates.push(g);
	}

	const primaryGenre = pickPrimaryGenre(genreCandidates);
	const exhibitionType = pickExhibitionType(typeMatches);
	const tagsRaw = [...new Set(themeTags)]
		.filter((t) => !EXHIBITION_TYPE_VALUES.has(t) && !ART_GENRE_VALUES.has(t))
		.sort();
	const tags = tagsRaw.includes(KIDS_TAG) ? [] : tagsRaw;

	return { genre: primaryGenre, type: exhibitionType, tags };
}

export function displayGenre(genre: string | null | undefined): string | null {
	const g = genre?.trim();
	if (!g || NON_ART_GENRE_VALUES.has(g) || EXHIBITION_TYPE_VALUES.has(g)) return null;
	return g;
}

export function sanitizeExhibitionTags(tags: string[] | undefined): string[] {
	const cleaned = (tags ?? []).filter(
		(t) => !EXHIBITION_TYPE_VALUES.has(t) && !ART_GENRE_VALUES.has(t),
	);
	if (cleaned.includes(KIDS_TAG)) return [];
	return cleaned;
}
