import { initializeKakaoSDK } from '@react-native-kakao/core';
import { shareLocationTemplate } from '@react-native-kakao/share';
import { Share } from 'react-native';
import { useShareExhibition } from '@/src/hooks/useShareExhibition';
import type { Exhibition } from '@/src/data/exhibitions';

jest.mock('@react-native-kakao/core', () => ({ initializeKakaoSDK: jest.fn() }));
jest.mock('@react-native-kakao/share', () => ({ shareLocationTemplate: jest.fn() }));

const exhibition = {
	title: '전시',
	venue: '국립현대미술관',
	startDate: '2026.10.01',
	endDate: '2026.12.31',
} as Exhibition;

describe('useShareExhibition', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		process.env.EXPO_PUBLIC_KAKAO_API_KEY = 'test-key';
	});

	it('카카오 공유 전에 SDK를 초기화한다', async () => {
		const order: string[] = [];
		jest.mocked(initializeKakaoSDK).mockImplementation(async () => {
			order.push('init');
		});
		jest.mocked(shareLocationTemplate).mockImplementation(async () => {
			order.push('share');
			return 42;
		});

		await useShareExhibition(exhibition).handleShare();

		expect(initializeKakaoSDK).toHaveBeenCalledWith('test-key');
		expect(order).toEqual(['init', 'share']);
	});

	it('카카오 앱 키가 없으면 카카오 공유 없이 기본 공유 시트를 연다', async () => {
		delete process.env.EXPO_PUBLIC_KAKAO_API_KEY;
		const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });

		await useShareExhibition(exhibition).handleShare();

		expect(shareLocationTemplate).not.toHaveBeenCalled();
		expect(shareSpy).toHaveBeenCalled();
	});
});
