export interface WikiArtwork {
	qId: string;
	label: string;
	description: string;
	imageUrl?: string;
	year?: string;
	artist?: string;
}

interface RawArtwork extends WikiArtwork {
	creatorId?: string;
}

 
type EntityClaims = Record<string, any[]>;
type EntityMap = Record<
	string,
	{
		labels?: Record<string, { value: string }>;
		descriptions?: Record<string, { value: string }>;
		claims?: EntityClaims;
	}
>;

const SEARCH_URL = 'https://www.wikidata.org/w/api.php';

function getHeaders(): HeadersInit {
	const token = process.env.EXPO_PUBLIC_WIKIDATA_TOKEN;
	return token ? { Authorization: `Bearer ${token}` } : {};
}

function commonsImageUrl(filename: string): string {
	const encoded = encodeURIComponent(filename.replace(/ /g, '_'));
	return `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=400`;
}

async function searchEntities(query: string): Promise<string[]> {
	const params = new URLSearchParams({
		action: 'wbsearchentities',
		search: query,
		language: 'ko',
		uselang: 'ko',
		type: 'item',
		limit: '20',
		format: 'json',
		origin: '*',
	});
	const res = await fetch(`${SEARCH_URL}?${params}`, { headers: getHeaders() });
	if (!res.ok) throw new Error(`wbsearchentities ${res.status}`);
	const json = await res.json();
	return (json.search ?? []).map((r: { id: string }) => r.id);
}

async function fetchEntities(ids: string[]): Promise<EntityMap> {
	if (ids.length === 0) return {};
	const params = new URLSearchParams({
		action: 'wbgetentities',
		ids: ids.join('|'),
		props: 'labels|descriptions|claims',
		languages: 'ko|en',
		format: 'json',
		origin: '*',
	});
	const res = await fetch(`${SEARCH_URL}?${params}`, { headers: getHeaders() });
	if (!res.ok) throw new Error(`wbgetentities ${res.status}`);
	const json = await res.json();
	return json.entities ?? {};
}

// P31 (instance of) Q값 중 시각 미술 작품에 해당하는 것들
const ARTWORK_TYPES = new Set([
	'Q3305213', // painting (회화)
	'Q93184', // drawing (드로잉)
	'Q4502142', // visual artwork (시각 예술 작품)
	'Q179700', // statue (조각상)
	'Q860861', // sculpture (조각)
	'Q4604490', // visual art work
	'Q838948', // work of art (예술 작품)
	'Q15709879', // artwork
	'Q18593264', // installation art (설치 미술)
	'Q1980247', // etching (에칭)
	'Q11835431', // watercolor painting (수채화)
	'Q7184903', // pastel (파스텔화)
]);

// P106 (occupation) Q값 중 시각 예술가에 해당하는 것들
const ARTIST_OCCUPATIONS = new Set([
	'Q1028181', // painter (화가)
	'Q1281618', // sculptor (조각가)
	'Q15296811', // draughtsman (소묘가)
	'Q483501', // artist (예술가)
	'Q3391743', // visual artist (시각 예술가)
	'Q1925963', // graphic artist (그래픽 아티스트)
	'Q1408969', // printmaker (판화가)
	'Q5322166', // illustrator (일러스트레이터)
]);

function isArtwork(claims: EntityClaims): boolean {
	const p31 = claims?.P31 ?? [];
	return p31.some((c) => {
		const id = c?.mainsnak?.datavalue?.value?.id;
		return id !== undefined && ARTWORK_TYPES.has(id);
	});
}

function isArtist(claims: EntityClaims): boolean {
	const p31 = claims?.P31 ?? [];
	const isHuman = p31.some((c) => c?.mainsnak?.datavalue?.value?.id === 'Q5');
	if (!isHuman) return false;
	const p106 = claims?.P106 ?? [];
	return p106.some((c) => {
		const id = c?.mainsnak?.datavalue?.value?.id;
		return id !== undefined && ARTIST_OCCUPATIONS.has(id);
	});
}

function getLabel(e: EntityMap[string], fallback: string): string {
	return e.labels?.ko?.value ?? e.labels?.en?.value ?? fallback;
}

function parseArtwork(id: string, e: EntityMap[string]): RawArtwork | null {
	const label = getLabel(e, id);
	const description = e.descriptions?.ko?.value ?? e.descriptions?.en?.value ?? '';
	const imageClaim = e.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
	const imageUrl = imageClaim ? commonsImageUrl(imageClaim) : undefined;
	const yearClaim = e.claims?.P571?.[0]?.mainsnak?.datavalue?.value?.time;
	const year = yearClaim ? String(Math.abs(parseInt(yearClaim.slice(1, 5), 10))) : undefined;
	// P170 (creator) — 별도 배치로 조회해 이름을 붙인다 (searchWikiArtworks 참고)
	const creatorId: string | undefined = e.claims?.P170?.[0]?.mainsnak?.datavalue?.value?.id;
	return { qId: id, label, description, imageUrl, year, creatorId };
}

export async function searchWikiArtworks(query: string): Promise<WikiArtwork[]> {
	const ids = await searchEntities(query);
	if (ids.length === 0) return [];

	const firstBatch = await fetchEntities(ids);

	const directArtworks: RawArtwork[] = [];
	const notableWorkIds: string[] = [];
	// 대표작(P800) 경로로 들어온 작품은 자기 항목에 P170(creator)이 비어있는 경우가 흔해서,
	// 이미 알고 있는 검색된 작가 id를 폴백으로 남겨둔다.
	const notableWorkArtistId = new Map<string, string>();

	for (const id of ids) {
		const e = firstBatch[id];
		if (!e) continue;
		const claims = e.claims ?? {};

		if (isArtwork(claims)) {
			const artwork = parseArtwork(id, e);
			if (artwork) directArtworks.push(artwork);
		} else if (isArtist(claims)) {
			// P800 = notable work
			const p800 = (claims.P800 ?? [])
				.map(
					(c: { mainsnak?: { datavalue?: { value?: { id?: string } } } }) =>
						c?.mainsnak?.datavalue?.value?.id,
				)
				.filter(Boolean)
				.slice(0, 15) as string[];
			for (const workId of p800) notableWorkArtistId.set(workId, id);
			notableWorkIds.push(...p800);
		}
	}

	// 작가 대표작 추가 fetch (직접 검색 결과와 중복 제거)
	const existingIds = new Set(directArtworks.map((a) => a.qId));
	const uniqueWorkIds = [...new Set(notableWorkIds)].filter((id) => !existingIds.has(id));

	if (uniqueWorkIds.length > 0) {
		const secondBatch = await fetchEntities(uniqueWorkIds.slice(0, 20));
		for (const id of uniqueWorkIds) {
			const e = secondBatch[id];
			// 대표작(P800) 목록에서 나온 항목은 이미 "확인된 작가의 대표작"이라는 신뢰도가
			// 있으므로, isArtwork(P31 분류) 여부와 무관하게 채택한다. Wikidata에는 대표작으로
			// 링크되어 있으면서도 정작 자기 항목엔 P31이 비어있는 경우가 흔하다.
			if (!e) continue;
			const artwork = parseArtwork(id, e);
			if (!artwork) continue;
			if (!artwork.creatorId) artwork.creatorId = notableWorkArtistId.get(id);
			directArtworks.push(artwork);
		}
	}

	// 작가명 보강 — 작가명이 프롬프트에 있어야 해설 품질이 떨어지지 않는다.
	const creatorIds = [
		...new Set(directArtworks.map((a) => a.creatorId).filter(Boolean)),
	] as string[];
	if (creatorIds.length > 0) {
		const creatorBatch = await fetchEntities(creatorIds);
		for (const artwork of directArtworks) {
			if (!artwork.creatorId) continue;
			const creator = creatorBatch[artwork.creatorId];
			if (creator) artwork.artist = getLabel(creator, '');
		}
	}

	return directArtworks.map(({ creatorId: _creatorId, ...artwork }) => artwork);
}
