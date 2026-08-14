import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { KcisaExhibitionCard } from '@/src/components/explore/KcisaExhibitionCard';
import { ExploreSectionTitle } from '@/src/components/explore/ExploreHomeSections';
import type { ExhibitionSummary, FeaturedExhibition } from '@/src/hooks/useExploreScreenData';

export interface KcisaSectionProps {
	kcisaStatus: 'idle' | 'loading' | 'error' | 'success';
	kcisaItems: ExhibitionSummary[];
	carousel: ExhibitionSummary[];
	featured: Pick<FeaturedExhibition, 'source'> | null;
	onPress: (id: string) => void;
	onRefetch: () => void;
}

export function KcisaSection({
	kcisaStatus,
	kcisaItems,
	carousel,
	featured,
	onPress,
	onRefetch,
}: KcisaSectionProps) {
	const showSection =
		kcisaStatus === 'loading' ||
		kcisaStatus === 'error' ||
		carousel.length > 0 ||
		(kcisaItems.length === 0 && kcisaStatus === 'success');

	if (!showSection && featured?.source === 'kcisa') return null;

	return (
		<View>
			<ExploreSectionTitle eyebrow='PUBLIC MUSEUMS' title='국공립 기관 전시' />

			{kcisaStatus === 'loading' && kcisaItems.length === 0 ? (
				<View className='items-center justify-center py-8'>
					<ActivityIndicator color='#A8A29E' />
				</View>
			) : kcisaStatus === 'error' ? (
				<View className='items-center justify-center py-8 gap-2'>
					<Text className='text-[#A8A29E] text-[13px] font-pretendard-regular'>
						전시 정보를 불러오지 못했어요
					</Text>
					<Pressable
						onPress={onRefetch}
						accessibilityLabel='국공립 전시 다시 불러오기'
						accessibilityRole='button'
						hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
					>
						<Text className='text-[#1C1917] text-[13px] font-pretendard-semibold'>
							다시 시도
						</Text>
					</Pressable>
				</View>
			) : carousel.length === 0 ? (
				<Text className='text-[#A8A29E] text-[13px] font-pretendard-regular'>
					진행 중인 전시가 없어요
				</Text>
			) : (
				<View className='-mx-6'>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{
							flexDirection: 'row',
							gap: 14,
							paddingHorizontal: 24,
							paddingVertical: 4,
						}}
					>
						{carousel.map((item) => (
							<KcisaExhibitionCard key={item.id} item={item} onPress={onPress} />
						))}
					</ScrollView>
				</View>
			)}
		</View>
	);
}
