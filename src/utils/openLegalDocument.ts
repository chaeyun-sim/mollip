import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';
import { LEGAL_LINKS, type LegalDocument } from '@/src/constants/legalLinks';

/** 약관·방침 웹페이지를 앱 안 브라우저로 연다 — 네트워크 문제 등으로 못 열면 안내한다 */
export const openLegalDocument = async (document: LegalDocument) => {
	try {
		await WebBrowser.openBrowserAsync(LEGAL_LINKS[document]);
	} catch (err) {
		console.warn('[legal] 문서 열기 실패:', err instanceof Error ? err.message : err);
		Alert.alert('문서를 열 수 없어요', '네트워크 연결을 확인한 뒤 다시 시도해 주세요.');
	}
};
