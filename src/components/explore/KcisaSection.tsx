import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SectionTitle } from '@/src/components/common/SectionTitle';
import { HorizontalSection } from '@/src/components/common/HorizontalSection';
import { KcisaExhibitionCard } from '@/src/components/explore/KcisaExhibitionCard';
import { KcisaExhibitionCardSkeleton } from '@/src/components/explore/KcisaExhibitionCardSkeleton';
import type { ExhibitionSummary, FeaturedExhibition } from '@/src/hooks/useExploreScreenData';
import { AsyncStatus } from '@/src/types/asyncStatus.types';

export interface KcisaSectionProps {
	kcisaStatus: AsyncStatus;
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
	const router = useRouter();
	const showSection =
		kcisaStatus === 'loading' ||
		kcisaStatus === 'error' ||
		carousel.length > 0 ||
		(kcisaItems.length === 0 && kcisaStatus === 'success');

	if (!showSection && featured?.source === 'kcisa') return null;

	return (
		<View className="pb-2">
			<SectionTitle
				eyebrow="NATIONAL MUSEUMS"
				title="국립 기관 전시"
				right={
					<Pressable
						onPress={() => router.push({ pathname: '/search', params: { q: '국립' } })}
						hitSlop={8}
						accessibilityRole="button"
						accessibilityLabel="국립 기관 전시 더보기"
					>
						{({ pressed }) => (
							<View className="flex-row items-center" style={{ opacity: pressed ? 0.6 : 1 }}>
								<Text className="text-gray500 text-[12px] font-pretendard-medium mr-0.5">
									더보기
								</Text>
								<Ionicons name="chevron-forward" size={14} className="text-gray500" />
							</View>
						)}
					</Pressable>
				}
			/>

			<HorizontalSection
				items={carousel}
				status={kcisaStatus}
				onRefetch={onRefetch}
				renderItem={(item, i) => (
					<KcisaExhibitionCard key={item.id} item={item} onPress={onPress} index={i + 1} />
				)}
				sectionName="국립 기관 전시"
				placeholder="진행 중인 전시가 없어요"
			/>
		</View>
	);
}
