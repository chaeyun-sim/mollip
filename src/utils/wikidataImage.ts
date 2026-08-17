/**
 * Wikipedia에서 작품 썸네일 이미지를 가져옵니다.
 * 한국어 위키 → 영어 위키 순으로 시도합니다.
 */
export async function fetchWikidataImage(
	title: string,
	_artist?: string,
): Promise<string | null> {
	return (
		(await fetchWikipediaImage(title, 'ko')) ??
		(await fetchWikipediaImage(title, 'en'))
	);
}

async function fetchWikipediaImage(title: string, lang: 'ko' | 'en'): Promise<string | null> {
	try {
		const url =
			`https://${lang}.wikipedia.org/w/api.php` +
			`?action=query&prop=pageimages&pithumbsize=300` +
			`&titles=${encodeURIComponent(title)}&format=json&origin=*`;

		const res = await fetch(url);
		const data = await res.json() as {
			query: { pages: Record<string, { thumbnail?: { source: string } }> };
		};

		const pages = Object.values(data.query?.pages ?? {});
		return pages[0]?.thumbnail?.source ?? null;
	} catch {
		return null;
	}
}
