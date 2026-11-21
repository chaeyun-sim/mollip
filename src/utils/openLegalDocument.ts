import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';
import { LEGAL_LINKS, type LegalDocument } from '@/src/constants/legalLinks';
import i18n from '@/src/i18n';

/** 약관·방침 웹페이지를 앱 안 브라우저로 연다 — 네트워크 문제 등으로 못 열면 안내한다 */
export const openLegalDocument = async (document: LegalDocument) => {
	try {
		await WebBrowser.openBrowserAsync(LEGAL_LINKS[document]);
	} catch (err) {
		console.warn('[legal] 문서 열기 실패:', err instanceof Error ? err.message : err);
		Alert.alert(
			i18n.t('settings.legal_open_failed_title'),
			i18n.t('settings.legal_open_failed_body'),
		);
	}
};
