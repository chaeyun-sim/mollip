/** 몰립 컬러 정본. NativeWind와 런타임 color prop이 이 객체를 함께 사용한다. */
export const colors = {
	// 화면의 기본 여백과 정보 위계
	canvas: '#FAFAF8',
	ink: '#2D2D23',
	white: '#FFFFFF',
	'surface-neutral': '#F3F3F0',
	// 비활성 버튼 배경 — 베이지가 아닌 중립 연회색
	'surface-disabled': '#E6E6E4',
	blanket: '#F2E0CF',
	mushroom: '#D4C7B4',

	// 핵심 행동은 Deep Plum 한 계열만 사용한다.
	brand: '#5F1D3E',
	// 어두운 화면 위의 브랜드 표시. 이 색을 배경으로 쓰면 글자는 ink를 사용한다.
	'brand-on-dark': '#E3A9C7',

	// 에디토리얼 및 소면적 장식
	editorial: '#854628',
	oak: '#B48954',
	moss: '#7C7458',
	'pastel-pink': '#FFD6EB',
	'pastel-yellow': '#FFF5B4',
	'pastel-blue': '#CAE4EF',
	'pastel-green': '#939E86',
	'pastel-peach': '#FFA873',

	// 기존 gray 계열 사용처를 점진적으로 시맨틱 역할로 옮기기 위한 명도 단계
	gray100: '#FAFAF8',
	gray200: '#F3F3F0',
	gray300: '#E5DCD0',
	gray400: '#C7BDB0',
	gray500: '#A69A8C',
	gray600: '#6D655B',
	gray700: '#554C44',
	gray800: '#3C3930',
	gray900: '#2D2D23',

	// 기존 컴포넌트에서 쓰는 역할 별칭
	secondary: '#2D2D23',
	description: '#6B6360',
	'bg-light': '#FAFAF8',
	'bg-dark': '#171412',
	'bg-tonal': '#F3F3F0',
	'on-dark': '#F5F2ED',
	'image-placeholder': '#E5DCD0',
	divider: '#D4C7B4',
	'divider-dark': '#3C3930',

	// 상태색은 브랜드 장식색과 독립적으로 유지한다.
	error: '#EF4444',
	'error-alt': '#F43F5E',
	success: '#00BC7D',
} as const;
