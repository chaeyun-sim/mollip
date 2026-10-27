import { getLocales } from 'expo-localization';
import i18n, { syncDeviceLanguage } from '../index';
import { resolveAppLanguage } from '../language';
import ko from '../locales/ko.json';
import en from '../locales/en.json';

jest.mock('expo-localization', () => ({
	getLocales: jest.fn(() => [{ languageCode: 'ko', regionCode: 'KR' }]),
}));

const mockGetLocales = getLocales as jest.Mock;

beforeEach(async () => {
	mockGetLocales.mockReturnValue([{ languageCode: 'ko', regionCode: 'KR' }]);
	await i18n.changeLanguage('ko');
});

afterEach(() => {
	i18n.removeResourceBundle('en', 'missing-test');
	i18n.removeResourceBundle('ko', 'missing-test');
});

describe('기기 언어 기준 언어 선택', () => {
	it.each([
		['ko', 'ko'],
		['KO', 'ko'],
		['ko-KR', 'ko'],
		['en', 'en'],
		['en-KR', 'en'],
		['ja', 'en'],
		[null, 'ko'],
		[undefined, 'ko'],
		['', 'ko'],
	])('%s 언어 → %s', (languageCode, expected) => {
		expect(resolveAppLanguage(languageCode)).toBe(expected);
	});

	it('앱 최초 한국어 기기에서 한국어로 초기화한다', () => {
		expect(i18n.language).toBe('ko');
		expect(i18n.t('home.map_a11y_label')).toBe(ko.home.map_a11y_label);
	});

	it('지역이 아니라 휴대폰 언어로 결정하고 복귀 시 최신 설정을 반영한다', () => {
		mockGetLocales.mockReturnValue([{ languageCode: 'ko', regionCode: 'US' }]);
		syncDeviceLanguage();
		expect(i18n.language).toBe('ko');
		expect(i18n.t('home.map_a11y_label')).toBe(ko.home.map_a11y_label);
		mockGetLocales.mockReturnValue([{ languageCode: 'en', regionCode: 'KR' }]);
		syncDeviceLanguage();
		expect(i18n.language).toBe('en');
		expect(i18n.t('home.map_a11y_label')).toBe(en.home.map_a11y_label);
	});

	it('언어 정보가 없으면 한국어로 복구한다', async () => {
		await i18n.changeLanguage('en');
		mockGetLocales.mockReturnValue([]);
		syncDeviceLanguage();
		expect(i18n.language).toBe('ko');
	});

	it('같은 언어로 반복 복귀해도 불필요한 언어 변경을 하지 않는다', () => {
		const changed = jest.fn();
		i18n.on('languageChanged', changed);
		syncDeviceLanguage();
		syncDeviceLanguage();
		expect(changed).not.toHaveBeenCalled();
		i18n.off('languageChanged', changed);
	});

	it('영어 누락 → 한국어 대체 → 기기 언어 변경의 연속 상황에서 복구한다', async () => {
		i18n.addResourceBundle('ko', 'missing-test', { message: '한국어 대체 문구' });
		await i18n.changeLanguage('en');
		expect(i18n.t('message', { ns: 'missing-test' })).toBe('한국어 대체 문구');
		mockGetLocales.mockReturnValue([{ languageCode: 'ko', regionCode: 'KR' }]);
		syncDeviceLanguage();
		expect(i18n.t('home.personalized_title', { name: '민수' })).toBe('민수님의 취향 저격!');
		mockGetLocales.mockReturnValue([{ languageCode: 'en', regionCode: 'US' }]);
		syncDeviceLanguage();
		expect(i18n.t('home.personalized_title', { name: 'Alex' })).toBe(
			en.home.personalized_title.replace('{{name}}', 'Alex'),
		);
	});
});

describe('기본 키가 없는 개수 표현', () => {
	it.each(['ko', 'en'])('%s에서 0·1·2개 결과와 안내판을 올바르게 표시한다', async (language) => {
		await i18n.changeLanguage(language);
		const catalog = language === 'ko' ? ko : en;
		for (const count of [0, 1, 2]) {
			const suffix = language === 'en' && count === 1 ? 'one' : 'other';
			expect(i18n.t('search.count_results', { count })).toBe(
				catalog.search[`count_results_${suffix}`].replace('{{count}}', String(count)),
			);
			expect(i18n.t('departures.hero_text', { count })).toBe(
				catalog.departures[`hero_text_${suffix}`].replace('{{count}}', String(count)),
			);
			expect(i18n.t('departures.nearest_a11y', { count, dayWord: 'tomorrow' })).toBe(
				catalog.departures[`nearest_a11y_${suffix}`]
					.replace('{{count}}', String(count))
					.replace('{{dayWord}}', 'tomorrow'),
			);
		}
	});

	it('한국어와 영어의 키·치환 변수를 동일하게 유지한다', () => {
		const flatten = (value: object, prefix = ''): Record<string, string> => {
			return Object.fromEntries(
				Object.entries(value).flatMap(([key, entry]) => {
					const path = prefix ? `${prefix}.${key}` : key;
					return typeof entry === 'string' ? [[path, entry]] : Object.entries(flatten(entry, path));
				}),
			);
		};
		const korean = flatten(ko);
		const english = flatten(en);
		expect(Object.keys(korean).sort()).toEqual(Object.keys(english).sort());
		for (const key of Object.keys(korean)) {
			expect((korean[key].match(/{{.*?}}/g) ?? []).sort()).toEqual(
				(english[key].match(/{{.*?}}/g) ?? []).sort(),
			);
		}
	});
});
