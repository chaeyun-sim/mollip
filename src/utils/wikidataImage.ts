/**
 * Wikipedia에서 작품 썸네일 이미지를 가져옵니다.
 * 한국어 위키 → 영어 위키 순으로 시도합니다.
 * 작품 제목만으로는 동명이인·동명 문서(식물, 영화 등)와 오매칭되기 쉬워,
 * 검색 결과 문서 제목에 작가명이 포함될 때만 이미지를 채택한다.
 */
export async function fetchWikidataImage(
	title: string,
	artist?: string,
): Promise<string | null> {
	if (!artist?.trim()) return null;

	return (
		(await fetchWikipediaImage(title, artist, 'ko')) ??
		(await fetchWikipediaImage(title, artist, 'en'))
	);
}

async function fetchWikipediaImage(
	title: string,
	artist: string,
	lang: 'ko' | 'en',
): Promise<string | null> {
	try {
		const searchUrl =
			`https://${lang}.wikipedia.org/w/api.php` +
			`?action=query&list=search&srlimit=5` +
			`&srsearch=${encodeURIComponent(`${title} ${artist}`)}&format=json&origin=*`;

		const searchRes = await fetch(searchUrl);
		const searchData = (await searchRes.json()) as {
			query?: { search?: { title: string }[] };
		};

		const matched = searchData.query?.search?.find((r) => r.title.includes(artist));
		if (!matched) return null;

		const imageUrl =
			`https://${lang}.wikipedia.org/w/api.php` +
			`?action=query&prop=pageimages&pithumbsize=300` +
			`&titles=${encodeURIComponent(matched.title)}&format=json&origin=*`;

		const res = await fetch(imageUrl);
		const data = (await res.json()) as {
			query: { pages: Record<string, { thumbnail?: { source: string } }> };
		};

		const pages = Object.values(data.query?.pages ?? {});
		return pages[0]?.thumbnail?.source ?? null;
	} catch {
		return null;
	}
}
