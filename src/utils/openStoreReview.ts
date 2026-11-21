import * as StoreReview from 'expo-store-review';
import { Alert, Linking, Platform } from 'react-native';

const IOS_APP_STORE_ID = '6813843152';
const ANDROID_PACKAGE = 'com.simune.mollip';

// 사용자가 직접 누르는 버튼은 App Store의 리뷰 작성 화면으로 연결한다.
export const openStoreReview = async (): Promise<void> => {
	try {
		if (Platform.OS === 'ios') {
			const nativeUrl = `itms-apps://itunes.apple.com/app/viewContentsUserReviews/id${IOS_APP_STORE_ID}?action=write-review`;
			await Linking.openURL(nativeUrl);
			return;
		}

		if (await StoreReview.isAvailableAsync()) {
			await StoreReview.requestReview();
			return;
		}
	} catch (error) {
		console.warn('[store-review] 리뷰 요청 실패:', error);
		if (Platform.OS === 'ios') {
			Alert.alert('App Store를 열 수 없어요', '실제 기기에서 다시 시도해 주세요.');
			return;
		}
	}

	if (Platform.OS === 'android') {
		await Linking.openURL(`market://details?id=${ANDROID_PACKAGE}`).catch(() =>
			Linking.openURL(`https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`),
		);
	}
};
