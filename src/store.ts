export type InputMode = 'image' | 'manual';

export const store = {
	extractedText: '',
	imageBase64: '',
	imageMediaType: 'image/jpeg' as 'image/jpeg' | 'image/png' | 'image/webp',
	inputMode: 'image' as InputMode,
	manualTitle: '',
	manualArtist: '',
	manualYear: '',
	artworkDescription: '',
	artworkImageUrl: '',
	// 지금 해설 화면이 "작가 소개 인트로"인지 여부. 인트로는 작품이 아니므로 재생목록에
	// 다시 쌓이면 안 된다(재생목록 최상단 고정 트랙으로만 존재한다).
	isArtistIntro: false,
};
