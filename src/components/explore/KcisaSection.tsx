import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { CenteredLoader } from '@/src/components/common/CenteredLoader';
import { RetryErrorState } from '@/src/components/common/RetryErrorState';
import { SectionTitle } from '@/src/components/common/SectionTitle';
import { KcisaExhibitionCard } from '@/src/components/explore/KcisaExhibitionCard';
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
				eyebrow="PUBLIC MUSEUMS"
				title="국공립 기관 전시"
				right={
					<Pressable
						onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: '국립' } })}
						hitSlop={8}
						accessibilityRole="button"
						accessibilityLabel="국공립 기관 전시 더보기"
					>
						{({ pressed }) => (
							<View className="flex-row items-center" style={{ opacity: pressed ? 0.6 : 1 }}>
								<Text className="text-muted text-[12px] font-pretendard-medium mr-0.5">
									더보기
								</Text>
								<Ionicons name="chevron-forward" size={14} className="text-muted" />
							</View>
						)}
					</Pressable>
				}
			/>

			{kcisaStatus === 'loading' && kcisaItems.length === 0 ? (
				<CenteredLoader className="py-8" />
			) : kcisaStatus === 'error' ? (
				<RetryErrorState
					message="전시 정보를 불러오지 못했어요"
					onRetry={onRefetch}
					retryAccessibilityLabel="국공립 전시 다시 불러오기"
					className="py-8"
				/>
			) : carousel.length === 0 ? (
				<Text className="text-muted text-[13px] font-pretendard-regular">
					진행 중인 전시가 없어요
				</Text>
			) : (
				<View className="-mx-6">
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{
							flexDirection: 'row',
							gap: 14,
							paddingHorizontal: 24,
						}}
					>
						{carousel.map((item, i) => (
							<KcisaExhibitionCard key={item.id} item={item} onPress={onPress} index={i + 1} />
						))}
					</ScrollView>
				</View>
			)}
		</View>
	);
}
