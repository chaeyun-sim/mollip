import { View } from 'react-native';

import { SkeletonBox } from '@/src/components/layout/Loading/SkeletonBox';

const SKELETON_ROWS = 3;

/** 목차형 섹션 로딩 — HomeIndexRow와 같은 리듬의 행 스켈레톤 */
export function HomeIndexSkeleton() {
	return (
		<View>
			{Array.from({ length: SKELETON_ROWS }).map((_, index) => (
				<View key={index} className="flex-row items-start py-4">
					<SkeletonBox className="w-10 h-[22px] mr-6 rounded-md bg-gray300" />
					<View className="flex-1 gap-2">
						<SkeletonBox className="h-[15px] w-[80%] rounded-md bg-gray300" />
						<SkeletonBox className="h-3 w-[45%] rounded-md bg-gray300" />
					</View>
				</View>
			))}
		</View>
	);
}
