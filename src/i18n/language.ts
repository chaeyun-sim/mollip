export type AppLanguage = 'ko' | 'en';

/** 기기 언어가 없으면 한국어를 기본값으로 사용한다. */
export const resolveAppLanguage = (languageCode: string | null | undefined): AppLanguage => {
	if (!languageCode) return 'ko';
	if (languageCode.toLowerCase().split(/[-_]/, 1)[0] === 'ko') return 'ko';
	return 'en';
};
