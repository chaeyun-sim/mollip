import { shareLocationTemplate } from '@react-native-kakao/share';
import { Share } from 'react-native';
import type { Exhibition } from '@/src/data/exhibitions';

export function useShareExhibition(exhibition: Exhibition | null) {
	const handleShare = async () => {
		if (!exhibition) return;

		const linkUrl =
			exhibition.web_site ?? exhibition.homepage_url ?? 'https://mollip.app';

		const link = {
			mobileWebUrl: linkUrl,
			webUrl: linkUrl,
		};

		const imageUrl =
			typeof exhibition.heroImageUri === 'string' &&
			exhibition.heroImageUri.startsWith('http')
				? exhibition.heroImageUri
				: undefined;

		try {
			await shareLocationTemplate({
				template: {
					address: exhibition.venueAddress ?? '',
					addressTitle: exhibition.venue,
					content: {
						title: exhibition.title,
						description: `📍 ${exhibition.venue} · ${exhibition.startDate} - ${exhibition.endDate}`,
						imageUrl: imageUrl ?? '',
						link,
					},
					buttons: [
						{
							title: '전시 정보 보기',
							link,
						},
					],
				},
			});
		} catch (error) {
			console.error('Kakao share failed:', error);

			await Share.share({
				message: `[전시] ${exhibition.title}\n${exhibition.venue}\n🗓 ${exhibition.startDate} - ${exhibition.endDate}`,
				title: exhibition.title,
			});
		}
	};

	return { handleShare };
}
