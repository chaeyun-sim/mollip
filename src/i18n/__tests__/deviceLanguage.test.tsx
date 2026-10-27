import { act } from 'react';
import { createRoot } from 'test-renderer';
import { AppState } from 'react-native';
import { getLocales } from 'expo-localization';
import { useTranslation } from 'react-i18next';
import i18n from '../index';
import ko from '../locales/ko.json';
import en from '../locales/en.json';
import { useSyncDeviceLanguage } from '@/src/hooks/useSyncDeviceLanguage';

jest.mock('expo-localization', () => ({
	getLocales: jest.fn(() => [{ languageCode: 'ko', regionCode: 'KR' }]),
}));

it('foreground 언어 변경이 화면 문구를 갱신하고 unmount 시 listener를 해제한다', async () => {
	(getLocales as jest.Mock).mockReturnValue([{ languageCode: 'ko', regionCode: 'KR' }]);
	await i18n.changeLanguage('ko');
	const remove = jest.fn();
	let foreground: ((state: 'active' | 'background') => void) | undefined;
	const subscribe = jest
		.spyOn(AppState, 'addEventListener')
		.mockImplementation((_event, listener) => {
			foreground = listener;
			return { remove };
		});
	let label = '';
	function Harness() {
		useSyncDeviceLanguage();
		const { t } = useTranslation();
		label = t('home.map_a11y_label');
		return null;
	}
	const root = createRoot();
	try {
		act(() => root.render(<Harness />));
		const subscriptionsAfterMount = subscribe.mock.calls.length;
		expect(label).toBe(ko.home.map_a11y_label);
		(getLocales as jest.Mock).mockReturnValue([{ languageCode: 'en', regionCode: 'KR' }]);
		act(() => foreground?.('background'));
		expect(label).toBe(ko.home.map_a11y_label);
		act(() => foreground?.('active'));
		expect(label).toBe(en.home.map_a11y_label);
		(getLocales as jest.Mock).mockReturnValue([{ languageCode: 'ko', regionCode: 'US' }]);
		act(() => foreground?.('active'));
		expect(label).toBe(ko.home.map_a11y_label);
		expect(subscribe).toHaveBeenCalledTimes(subscriptionsAfterMount);
	} finally {
		act(() => root.unmount());
		expect(remove).toHaveBeenCalledTimes(1);
		subscribe.mockRestore();
	}
});
