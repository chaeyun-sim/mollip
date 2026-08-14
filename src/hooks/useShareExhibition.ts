import { Linking, Platform, Share } from 'react-native';
import type { Exhibition } from '@/src/data/exhibitions';

export function useShareExhibition(exhibition: Exhibition | null) {
	const handleShare = async () => {
		if (!exhibition) return;
		const title = exhibition.title ?? '';
		const message = `${title}\n📍 ${exhibition.venue}\n🗓 ${exhibition.startDate} - ${exhibition.endDate}`;
		const linkUrl = exhibition.web_site ?? 'https://mollip.app';
		const kakaoKey = process.env.EXPO_PUBLIC_KAKAO_JS_KEY;

		if (kakaoKey) {
			const templateJson = encodeURIComponent(
				JSON.stringify({
					object_type: 'text',
					text: message,
					link: { mobile_web_url: linkUrl, web_url: linkUrl },
				}),
			);
			const kakaoUrl =
				Platform.OS === 'android'
					? `intent://send?app_key=${kakaoKey}&template_json=${templateJson}#Intent;scheme=kakaolink;package=com.kakao.talk;end;`
					: `kakaolink://send?app_key=${kakaoKey}&template_json=${templateJson}`;

			const canOpen = await Linking.canOpenURL('kakaolink://');
			if (canOpen) {
				await Linking.openURL(kakaoUrl);
				return;
			}
		}

		try {
			await Share.share({ message, title });
		} catch {
			// share cancelled
		}
	};

	return { handleShare };
}
