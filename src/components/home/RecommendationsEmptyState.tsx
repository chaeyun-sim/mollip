import { View } from 'react-native';

import { Result } from '@/src/components/common/Result';
import { SkeletonBox } from '@/src/components/layout/Loading/SkeletonBox';

const SKELETON_COUNT = 4;

interface RecommendationsEmptyStateProps {
	isLoading: boolean;
	isError: boolean;
	hasPreferredGenres: boolean;
	cardWidth: number;
	onRetry: () => void;
}

/** 취향 추천 목록이 비어 있을 때 — 로딩 스켈레톤, 오류, 빈 상태 중 하나를 그린다. */
export function RecommendationsEmptyState({
	isLoading,
	isError,
	hasPreferredGenres,
	cardWidth,
	onRetry,
}: RecommendationsEmptyStateProps) {
	if (isLoading) {
		return (
			<View className="gap-4 px-6 pt-2">
				{Array.from({ length: SKELETON_COUNT }).map((_, index) => (
					<View
						key={index}
						className="flex-row gap-4 rounded-2xl border border-ink/10 bg-white p-4"
					>
						<SkeletonBox
							className="rounded-xl bg-gray300"
							style={{ width: Math.floor(cardWidth * 0.36), height: Math.floor(cardWidth * 0.47) }}
						/>
						<View className="flex-1 justify-center gap-2">
							<SkeletonBox className="h-3 w-2/5 rounded-md bg-gray300" />
							<SkeletonBox className="h-4 w-4/5 rounded-md bg-gray300" />
							<SkeletonBox className="h-4 w-3/5 rounded-md bg-gray300" />
							<SkeletonBox className="mt-2 h-3 w-full rounded-md bg-gray300" />
							<SkeletonBox className="h-3 w-4/5 rounded-md bg-gray300" />
						</View>
					</View>
				))}
			</View>
		);
	}

	if (isError) {
		return (
			<Result
				icon="cloud-offline-outline"
				tone="danger"
				title="전시를 불러오지 못했어요"
				actionLabel="다시 시도"
				onAction={onRetry}
				className="py-24"
			/>
		);
	}

	return (
		<Result
			icon="color-wand-outline"
			title={
				hasPreferredGenres ? '아직 취향에 맞는 전시가 없어요' : '취향을 고르면 전시를 추천해드려요'
			}
			description={
				hasPreferredGenres
					? '새로운 전시가 등록되면 여기서 확인할 수 있어요.'
					: '마이페이지에서 좋아하는 장르를 선택해 주세요.'
			}
			className="py-24"
		/>
	);
}
