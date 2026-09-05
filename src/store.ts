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

/**
 * store는 화면 간 데이터 전달용 non-reactive 싱글턴이라 컴포넌트 안에서 필드를 직접
 * 대입하면 React Compiler가 "컴포넌트/훅 밖에서 정의된 값을 mutate한다"고 오탐한다.
 * mutation을 컴포넌트가 아닌 이 함수 안으로 옮겨서 그 오탐을 피한다.
 */
export function updateStore(patch: Partial<typeof store>) {
	Object.assign(store, patch);
}
