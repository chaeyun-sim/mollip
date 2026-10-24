/**
 * Wikipedia / Wikidata에서 작품 썸네일을 가져옵니다.
 * 촬영 해설은 제목이 첫 문장 전체인 경우가 많아서, 해설에서 작품명 후보를 먼저 뽑는다.
 */
import { isWikidataVisualArtwork, searchWikiArtworks } from '@/src/api/wikidata';
import { fetchWikiJson } from '@/src/utils/wikiFetch';

const THUMB_SIZE = 800;

const GENERIC_TITLES = new Set([
	'촬영한 작품',
	'작품 해설',
	'해설',
	'작품 소개',
	'오디오 가이드',
	'전시 채팅',
]);

interface WikiPageImage {
	title: string;
	thumb: string | null;
	qid: string | null;
	disambiguation: boolean;
	missing: boolean;
}

export function normalizeWikiTitle(value: string): string {
	return value.replace(/[\s·・"'"`「」『』[\]()（）]/g, '').toLowerCase();
}

/** 작품 제목과 위키 문서 제목이 같은 작품인지 — 부분 일치도 허용하되 한쪽이 너무 짧으면 거절 */
export function titlesAreClose(artworkTitle: string, pageTitle: string): boolean {
	const a = normalizeWikiTitle(artworkTitle);
	const b = normalizeWikiTitle(pageTitle);
	if (!a || !b) return false;
	if (a === b) return true;
	const shorter = a.length <= b.length ? a : b;
	const longer = a.length <= b.length ? b : a;
	if (shorter.length < 2) return false;
	return longer.includes(shorter);
}

function cleanCandidate(value: string): string {
	return value
		.replace(/[.…]+$/g, '')
		.replace(/^["'『「<]+|["'』」>]+$/g, '')
		.trim();
}

function stripTopicTail(value: string): string {
	const idx = Math.max(value.lastIndexOf('는 '), value.lastIndexOf('은 '));
	if (idx >= 2) return value.slice(0, idx).trim();
	return value.replace(/(?:는|은)$/u, '').trim();
}

function pushCandidate(out: string[], value: string | undefined) {
	const title = value ? cleanCandidate(value) : '';
	if (!title || GENERIC_TITLES.has(title) || title.length < 2 || title.length > 40) return;
	if (!out.includes(title)) out.push(title);
}

/** 기록 제목·해설 본문에서 위키 검색에 쓸 작품명 후보 */
export function artworkTitleCandidates(title: string, artist?: string, text?: string): string[] {
	const out: string[] = [];
	const blob = [title, text].filter(Boolean).join('\n');

	for (const match of blob.matchAll(/[『「<]([^』」>\n]{2,40})[』」>]/g)) {
		pushCandidate(out, match[1]);
	}
	for (const match of blob.matchAll(/["“]([^"”\n]{2,40})["”]/g)) {
		pushCandidate(out, match[1]);
	}

	for (const sentence of blob.split(/[.\n]/)) {
		const afterUi = sentence.match(/의\s+(.+)/);
		if (afterUi) pushCandidate(out, stripTopicTail(afterUi[1]));
	}

	const trimmedTitle = title.trim().replace(/[.…]+$/g, '');
	if (trimmedTitle && !GENERIC_TITLES.has(trimmedTitle)) {
		if (trimmedTitle.length <= 40) pushCandidate(out, trimmedTitle);
		const afterUi = trimmedTitle.match(/의\s+(.+)/);
		if (afterUi) pushCandidate(out, stripTopicTail(afterUi[1]));
	}

	if (out.length === 0 && artist?.trim()) {
		pushCandidate(out, `${trimmedTitle} ${artist}`.trim());
	}

	return out;
}

function labelMatchesQuery(label: string, query: string, context?: string): boolean {
	if (titlesAreClose(query, label)) return true;
	if (!context) return false;
	const normalizedLabel = normalizeWikiTitle(label);
	if (normalizedLabel.length < 4) return false;
	return normalizeWikiTitle(context).includes(normalizedLabel);
}

export async function fetchWikidataImage(
	title: string,
	artist?: string,
	contextText?: string,
): Promise<string | null> {
	const artistName = artist?.trim() || undefined;
	const candidates = artworkTitleCandidates(title, artistName, contextText);
	if (candidates.length === 0) return null;

	for (const candidate of candidates) {
		const fromWikidata = await fetchWikidataArtworkImage(candidate, artistName, contextText);
		if (fromWikidata) return fromWikidata;
	}

	for (const candidate of candidates) {
		const url =
			(await fetchExactPageImage(candidate, artistName, 'ko')) ??
			(await fetchExactPageImage(candidate, artistName, 'en'));
		if (url) return url;
	}

	for (const candidate of candidates.slice(0, 2)) {
		const url =
			(await fetchSearchPageImage(candidate, artistName, 'ko')) ??
			(await fetchSearchPageImage(candidate, artistName, 'en'));
		if (url) return url;
	}

	return null;
}

async function fetchExactPageImage(
	title: string,
	artist: string | undefined,
	lang: 'ko' | 'en',
): Promise<string | null> {
	const page = await queryPageImage(title, lang);
	if (!page) return null;
	return acceptPageImage(page, title, artist);
}

async function fetchWikidataArtworkImage(
	title: string,
	artist: string | undefined,
	context?: string,
): Promise<string | null> {
	try {
		const query = artist ? `${title} ${artist}` : title;
		const artworks = await searchWikiArtworks(query);
		const hit = artworks.find(
			(artwork) => artwork.imageUrl && labelMatchesQuery(artwork.label, title, context),
		);
		return hit?.imageUrl ?? null;
	} catch {
		return null;
	}
}

async function fetchSearchPageImage(
	title: string,
	artist: string | undefined,
	lang: 'ko' | 'en',
): Promise<string | null> {
	try {
		const query = artist ? `${title} ${artist}` : title;
		const searchUrl =
			`https://${lang}.wikipedia.org/w/api.php` +
			`?action=query&list=search&srlimit=5` +
			`&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;

		const searchData = await fetchWikiJson<{ query?: { search?: { title: string }[] } }>(searchUrl);
		const results = searchData.query?.search ?? [];

		const artistHit = artist ? results.find((r) => r.title.includes(artist)) : undefined;
		const candidates = artistHit
			? [artistHit, ...results.filter((r) => r.title !== artistHit.title)]
			: results;

		for (const result of candidates) {
			const page = await queryPageImage(result.title, lang);
			if (!page) continue;
			const url = await acceptPageImage(page, title, artist);
			if (url) return url;
		}
		return null;
	} catch {
		return null;
	}
}

async function queryPageImage(title: string, lang: 'ko' | 'en'): Promise<WikiPageImage | null> {
	try {
		const imageUrl =
			`https://${lang}.wikipedia.org/w/api.php` +
			`?action=query&prop=pageimages|pageprops` +
			`&ppprop=disambiguation|wikibase_item` +
			`&pithumbsize=${THUMB_SIZE}&redirects=1` +
			`&titles=${encodeURIComponent(title)}&format=json&origin=*`;

		const data = await fetchWikiJson<{
			query?: {
				pages?: Record<
					string,
					{
						title?: string;
						missing?: string;
						thumbnail?: { source: string };
						pageprops?: { disambiguation?: string; wikibase_item?: string };
					}
				>;
			};
		}>(imageUrl);

		const page = Object.values(data.query?.pages ?? {})[0];
		if (!page) return null;

		return {
			title: page.title ?? title,
			thumb: page.thumbnail?.source ?? null,
			qid: page.pageprops?.wikibase_item ?? null,
			disambiguation: page.pageprops?.disambiguation !== undefined,
			missing: page.missing !== undefined,
		};
	} catch {
		return null;
	}
}

async function acceptPageImage(
	page: WikiPageImage,
	artworkTitle: string,
	artist: string | undefined,
): Promise<string | null> {
	if (page.missing || page.disambiguation || !page.thumb) return null;
	if (!titlesAreClose(artworkTitle, page.title)) return null;
	if (artist && page.title.includes(artist)) return page.thumb;
	if (page.qid && (await isWikidataVisualArtwork(page.qid))) return page.thumb;
	return null;
}
