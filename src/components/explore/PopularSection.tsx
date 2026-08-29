import { ScrollView, View } from 'react-native';

import { CenteredLoader } from '@/src/components/common/CenteredLoader';
import { RetryErrorState } from '@/src/components/common/RetryErrorState';
import { PopularExhibitionAvatar } from '@/src/components/explore/PopularExhibitionAvatar';
import type { ExhibitionSummary } from '@/src/hooks/useExploreScreenData';

export interface PopularSectionProps {
	items: ExhibitionSummary[];
	status: 'idle' | 'loading' | 'error' | 'success';
	onPress: (id: string) => void;
	onRefetch: () => void;
}

/** 홈 "인기 전시" 섹션 — 북마크·조회 기반 랭킹을 가로 카드 레일로 보여준다. */
export function PopularSection({ items, status, onPress, onRefetch }: PopularSectionProps) {
	// 결과 0건이면 헤더만 남기지 않고 섹션 전체를 렌더링하지 않는다 (AC-8)
	if (items.length === 0 && status === 'success') return null;

	function renderContent() {
		if (items.length > 0) {
			return (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{
						flexDirection: 'row',
						gap: 12,
						marginLeft: 2
					}}
				>
					{items.map((item) => (
						<PopularExhibitionAvatar key={item.id} item={item} onPress={onPress} />
					))}
				</ScrollView>
			);
		}

		if (status === 'error') {
			return (
				<RetryErrorState
					message="인기 전시를 불러오지 못했어요"
					onRetry={onRefetch}
					retryAccessibilityLabel="인기 전시 다시 불러오기"
					className="py-8"
				/>
			);
		}

		return <CenteredLoader className="py-8" />;
	}

	return <View>{renderContent()}</View>;
}
