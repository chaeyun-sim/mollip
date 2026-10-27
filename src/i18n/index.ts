import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resolveAppLanguage } from './language';
import ko from './locales/ko.json';
import en from './locales/en.json';

const i18n = createInstance();
i18n.use(initReactI18next).init({
	resources: { ko: { translation: ko }, en: { translation: en } },
	lng: resolveAppLanguage(getLocales()[0]?.languageCode),
	fallbackLng: 'ko',
	supportedLngs: ['ko', 'en'],
	initAsync: false,
	interpolation: { escapeValue: false },
});

/** Android의 실행 중 기기 언어 설정 변경은 foreground 복귀 시 다시 읽는다. */
export const syncDeviceLanguage = () => {
	const language = resolveAppLanguage(getLocales()[0]?.languageCode);
	if (i18n.language !== language) void i18n.changeLanguage(language);
};

export default i18n;
