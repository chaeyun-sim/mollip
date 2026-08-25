// 코드베이스 전체에서 반복 사용되는 HEX 값을 스캔해 뽑은 컬러 토큰
// 1회성 브랜드 색상(카카오 노랑, 지하철 노선색 등)은 의도적으로 제외했다.
export const colors = {
	primary: '#1C1917',
	secondary: '#57534E',
	tertiary: '#78716C',
	muted: '#A8A29E',

	description: '#6B6360',

	bgLight: '#F8F6F2',
	bgDark: '#171412',
	bgTonal: '#F2EFE9',

	onDark: '#E8E8E8',
	imagePlaceholder: '#E5E1D8',

	border: '#E7E5E4',
	borderDark: '#292524',

	accent: '#3B82F6',

	error: '#EF4444',
	// 스와이프 "패스"(거부) 액션 등 error와 톤이 다른 빨강
	errorAlt: '#F43F5E',
	success: '#00BC7D',
} as const;

// F0EDE7 1
// FF2D78 1
// E8E4DC 1
