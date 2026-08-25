/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#1C1917',
        secondary: '#57534E',
        tertiary: '#78716C',
        muted: '#A8A29E',
        'bg-light': '#f4f4f1',
        'bg-dark': '#171412',
        'bg-tonal': '#F2EFE9',
        'on-dark': '#E8E8E8',
        'image-placeholder': '#E5E1D8',
        divider: '#E7E5E4',
        'divider-dark': '#292524',
        accent: '#3B82F6',
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
      },
    },
  },
  plugins: [],
};
