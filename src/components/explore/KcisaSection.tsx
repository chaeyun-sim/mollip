import { ScrollView, Text, View } from 'react-native';

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
	const showSection =
		kcisaStatus === 'loading' ||
		kcisaStatus === 'error' ||
		carousel.length > 0 ||
		(kcisaItems.length === 0 && kcisaStatus === 'success');

	if (!showSection && featured?.source === 'kcisa') return null;

	return (
		<View>
			<SectionTitle eyebrow="PUBLIC MUSEUMS" title="국공립 기관 전시" />

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
