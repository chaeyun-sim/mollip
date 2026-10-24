import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { cn } from '@/src/lib/cn';
import { AsyncStatus } from '@/src/types/asyncStatus.types';
import { Indicator } from '../common/Indicator';

export interface HorizontalSectionProps<T> {
	items: T[];
	status: AsyncStatus;
	onRefetch: () => void;
	renderItem: (item: T, index: number) => ReactNode;
	sectionName: string;
	placeholder?: string;
	contentContainerClassName?: string;
	/** 로딩 중 표시할 카드 모양 스켈레톤. 미지정 시 범용 Indicator로 폴백한다. */
	renderSkeletonItem?: (index: number) => ReactNode;
	/** renderSkeletonItem과 함께 사용 — 가로로 나열할 플레이스홀더 개수 */
	skeletonCount?: number;
}

/** 홈 탐색용 가로 스크롤 섹션. 로딩·에러·빈 상태를 함께 보여준다. */
export function HorizontalSection<T>({
	items,
	status,
	onRefetch,
	renderItem,
	sectionName,
	placeholder,
	contentContainerClassName,
	renderSkeletonItem,
	skeletonCount = 4,
}: HorizontalSectionProps<T>) {
	if (items.length === 0 && status === 'loading') {
		if (renderSkeletonItem) {
			return (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerClassName={cn('flex-row gap-3 px-6', contentContainerClassName)}
				>
					{Array.from({ length: skeletonCount }).map((_, index) => (
						<View key={index}>{renderSkeletonItem(index)}</View>
					))}
				</ScrollView>
			);
		}

		return (
			<View className="items-center justify-center py-8">
				<Indicator color="gray500" />
			</View>
		);
	}

	if (status === 'error') {
		return (
			<View className="items-center justify-center gap-2 py-8">
				<Text className="text-gray500 text-[13px] font-pretendard-regular">
					전시 정보를 불러오지 못했어요
				</Text>
				<Pressable
					onPress={onRefetch}
					accessibilityLabel={`${sectionName} 다시 불러오기`}
					accessibilityRole="button"
					hitSlop={8}
				>
					<Text className="text-gray900 text-[13px] font-pretendard-semibold">다시 시도</Text>
				</Pressable>
			</View>
		);
	}

	if (items.length === 0) {
		return (
			<Text className="text-gray500 text-[13px] font-pretendard-regular">
				{placeholder || `${sectionName}가 없어요`}
			</Text>
		);
	}

	return (
		<View>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerClassName={cn('flex-row gap-3 px-6', contentContainerClassName)}
			>
				{items.map((item, index) => renderItem(item, index))}
			</ScrollView>
		</View>
	);
}
