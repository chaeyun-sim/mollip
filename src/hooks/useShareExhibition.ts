import { initializeKakaoSDK } from '@react-native-kakao/core';
import { shareLocationTemplate } from '@react-native-kakao/share';
import { Share } from 'react-native';
import type { Exhibition } from '@/src/data/exhibitions';
import i18n from '@/src/i18n';
import { localizeExhibition } from '@/src/utils/localizedExhibition';

export function useShareExhibition(exhibition: Exhibition | null) {
	const handleShare = async () => {
		if (!exhibition) return;

		const { title, venue } = localizeExhibition(exhibition, i18n.language);
		const address =
			(i18n.language === 'en' && exhibition.venueAddressEn) || exhibition.venueAddress || '';

		const linkUrl = exhibition.web_site ?? exhibition.homepage_url ?? 'https://mollip.app';

		const link = {
			mobileWebUrl: linkUrl,
			webUrl: linkUrl,
		};

		const imageUrl =
			typeof exhibition.heroImageUri === 'string' && exhibition.heroImageUri.startsWith('http')
				? exhibition.heroImageUri
				: undefined;

		try {
			// 초기화하지 않은 카카오 SDK로 공유하면 네이티브에서 앱이 크래시하므로 공유 직전에 초기화한다
			const kakaoAppKey = process.env.EXPO_PUBLIC_KAKAO_API_KEY;
			if (!kakaoAppKey) throw new Error('Kakao app key is missing');
			await initializeKakaoSDK(kakaoAppKey);
			await shareLocationTemplate({
				template: {
					address,
					addressTitle: venue,
					content: {
						title,
						description: `📍 ${venue} · ${exhibition.startDate} - ${exhibition.endDate}`,
						imageUrl: imageUrl ?? '',
						link,
					},
					buttons: [
						{
							title: i18n.t('exhibitions.detail.share_button'),
							link,
						},
					],
				},
			});
		} catch (error) {
			console.error('Kakao share failed:', error);

			await Share.share({
				message: `${i18n.t('exhibitions.detail.share_prefix')} ${title}\n${venue}\n🗓 ${exhibition.startDate} - ${exhibition.endDate}`,
				title,
			});
		}
	};

	return { handleShare };
}
