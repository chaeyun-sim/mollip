export interface NearbyPlace {
	id: string;
	name: string;
	category: 'cafe' | 'restaurant';
	distance: string;
	address: string;
	imageUrl: string;
}

// TODO: Naver 지역검색 API 연동 예정 (Client ID/Secret 발급 후 교체) — 지금은 종료 화면
// UI를 완성하기 위한 예시 데이터. imageUrl도 실제 업체 사진으로 교체될 예정.
const PLACEHOLDER_PLACES: NearbyPlace[] = [
	{
		id: '1',
		name: '어니언 안국',
		category: 'cafe',
		distance: '210m',
		address: '서울 종로구 계동길',
		imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&q=70',
	},
	{
		id: '2',
		name: '몽로',
		category: 'restaurant',
		distance: '340m',
		address: '서울 종로구 북촌로',
		imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&q=70',
	},
	{
		id: '3',
		name: '카페 온화',
		category: 'cafe',
		distance: '180m',
		address: '서울 종로구 율곡로',
		imageUrl: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=500&q=70',
	},
	{
		id: '4',
		name: '삼청동수제비',
		category: 'restaurant',
		distance: '420m',
		address: '서울 종로구 삼청로',
		imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=70',
	},
	{
		id: '5',
		name: '커피한약방',
		category: 'cafe',
		distance: '390m',
		address: '서울 종로구 익선동',
		imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=70',
	},
	{
		id: '6',
		name: '밀탑',
		category: 'restaurant',
		distance: '460m',
		address: '서울 종로구 인사동길',
		imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=500&q=70',
	},
];

export function useNearbyPlaces(): NearbyPlace[] {
	return PLACEHOLDER_PLACES;
}
