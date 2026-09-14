import { slimLocalVisit } from '../localVisitDb';
import type { DayVisit } from '@/src/store/visitStore';

jest.mock('@react-native-async-storage/async-storage', () =>
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-sqlite', () => ({
	openDatabaseSync: () => {
		throw new Error('sqlite unused in slim test');
	},
}));

const visit: DayVisit = {
	exhibitionId: '1',
	exhibitionTitle: '전시',
	venue: '미술관',
	thumbnail: 'file:///visit-photos/ticket.jpg',
	venuePhotos: ['file:///visit-photos/1.jpg'],
	listened: [{ title: '작품', imageUrl: 'https://img', descriptionPreview: '긴 해설' }],
	memo: '메모',
	status: 'pending',
	pendingSince: '2026-09-13T00:00:00.000Z',
	signatureSvg: '<svg />',
	visitedAt: { start: 'a', end: 'b' },
	rating: 4,
};

describe('slimLocalVisit', () => {
	it('로그인 오버레이만 남기고 사진·메모·해설을 뺀다', () => {
		const slim = slimLocalVisit(visit);
		expect(slim.thumbnail).toBeUndefined();
		expect(slim.venuePhotos).toBeUndefined();
		expect(slim.memo).toBeUndefined();
		expect(slim.listened[0]?.descriptionPreview).toBeUndefined();
		expect(slim.status).toBe('pending');
		expect(slim.signatureSvg).toBe('<svg />');
		expect(slim.rating).toBe(4);
	});
});
