// 코드베이스 전체에서 반복 사용되는 HEX 값을 스캔해 뽑은 컬러 토큰
// 1회성 브랜드 색상(카카오 노랑, 지하철 노선색 등)은 의도적으로 제외했다.
export const colors = {
	// 브랜드 컬러 (비비드 퍼플)
	primary: '#AB77F1',
	// 흰 텍스트를 얹는 라이트 배경 브랜드 표면 · 탭바 활성 tint 전용
	primaryDark: '#7C3AED',
	// 보조/아웃라인 버튼
	secondary: '#302D33',

	// 무채색 명도 사다리 (gray100 = 가장 밝음 → gray900 = 가장 어두움)
	gray100: '#F8F6F2',
	gray200: '#F2EFE9',
	gray300: '#E7E5E4',
	gray400: '#C7C3BD',
	gray500: '#A8A29E',
	gray600: '#78716C',
	gray700: '#57534E',
	gray800: '#292524',
	gray900: '#1C1917',

	white: '#FFFFFF',

	description: '#6B6360',

	bgLight: '#F8F6F2',
	bgDark: '#171412',
	bgTonal: '#F2EFE9',

	onDark: '#E8E8E8',
	imagePlaceholder: '#E5E1D8',

	border: '#E7E5E4',
	borderDark: '#292524',

	// 포인트 강조 (민트). 이번 범위에 적용처 없음 — 정의만
	accent: '#00E9C8',

	error: '#EF4444',
	// 스와이프 "패스"(거부) 액션 등 error와 톤이 다른 빨강
	errorAlt: '#F43F5E',
	success: '#00BC7D',
} as const;