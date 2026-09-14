/** @type {import('tailwindcss').Config} */
const { hairlineWidth } = require('nativewind/theme');

module.exports = {
	content: [
		'./app/**/*.{js,jsx,ts,tsx}',
		'./components/**/*.{js,jsx,ts,tsx}',
		'./src/**/*.{js,jsx,ts,tsx}',
	],
	presets: [require('nativewind/preset')],
	theme: {
		extend: {
			// NativeWind의 rem 기준 단위(inlineRem)가 기본 14px이라 Tailwind 기본 rem 스케일을 쓰면
			// text-base가 16px이 아니라 14px로 렌더링된다. inlineRem을 올리면 p-4/rounded-xl 같은
			// spacing/radius까지 전부 같이 커지므로, fontSize 스케일만 px로 고정해 폰트 크기가
			// inlineRem 값과 무관하게 항상 웹 표준(1rem=16px) 기준으로 렌더링되게 한다.
			fontSize: {
				xs: ['12px', { lineHeight: '16px' }],
				sm: ['14px', { lineHeight: '20px' }],
				base: ['16px', { lineHeight: '24px' }],
				lg: ['18px', { lineHeight: '28px' }],
				xl: ['20px', { lineHeight: '28px' }],
				'2xl': ['24px', { lineHeight: '32px' }],
				'3xl': ['30px', { lineHeight: '36px' }],
				'4xl': ['36px', { lineHeight: '40px' }],
				'5xl': ['48px', { lineHeight: '1' }],
				'6xl': ['60px', { lineHeight: '1' }],
				'7xl': ['72px', { lineHeight: '1' }],
				'8xl': ['96px', { lineHeight: '1' }],
				'9xl': ['128px', { lineHeight: '1' }],
			},
			colors: {
				primary: '#AB77F1',
				'primary-dark': '#7C3AED',
				secondary: '#302D33',
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
				'bg-light': '#F8F6F2',
				'bg-dark': '#171412',
				'bg-tonal': '#F2EFE9',
				'on-dark': '#E8E8E8',
				'image-placeholder': '#E5E1D8',
				divider: '#E7E5E4',
				'divider-dark': '#292524',
				accent: '#00E9C8',
				error: '#EF4444',
				'error-alt': '#F43F5E',
				success: '#00BC7D',
			},
			fontFamily: {
				sans: ['Pretendard-Regular'],
				'pretendard-regular': ['Pretendard-Regular'],
				'pretendard-light': ['Pretendard-Light'],
				'pretendard-medium': ['Pretendard-Medium'],
				'pretendard-semibold': ['Pretendard-SemiBold'],
				'pretendard-bold': ['Pretendard-Bold'],
				hahmlet: ['Hahmlet_400Regular'],
				'hahmlet-semibold': ['Hahmlet_600SemiBold'],
				'hahmlet-bold': ['Hahmlet_700Bold'],
				// SignaturePad 안내 캡션 전용 — 사용 범위를 이 한 곳으로 제한한다 (02-design-brief.md 참고)
				'nanum-pen': ['NanumPenScript_400Regular'],
			},
			borderWidth: {
				hairline: hairlineWidth(),
			},
			boxShadow: {
				floating: '0 6px 14px rgba(28, 25, 23, 0.28)',
				'map-control': '0 2px 8px rgba(0, 0, 0, 0.12)',
				'onboarding-button': '0 4px 12px rgba(0, 0, 0, 0.08)',
				'onboarding-card': '0 8px 20px rgba(0, 0, 0, 0.12)',
				chip: '0 1px 4px rgba(0, 0, 0, 0.12)',
			},
		},
	},
	plugins: [],
};
