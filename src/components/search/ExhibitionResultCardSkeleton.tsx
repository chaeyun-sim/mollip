import { View } from 'react-native';
import { SkeletonBox } from '@/src/components/layout/Loading/SkeletonBox';

/** ExhibitionResultCard과 동일한 높이·레이아웃을 흉내 낸 로딩 스켈레톤. */
export function ExhibitionResultCardSkeleton() {
	return (
		<View className="flex-row gap-3.5">
			<SkeletonBox className="rounded-lg bg-[#E0DCD5] w-[76px] h-[100px]" />
			<View className="flex-1 justify-center gap-2">
				<SkeletonBox className="h-4 rounded-full bg-[#E0DCD5] w-[44px]" />
				<SkeletonBox className="h-[15px] rounded-md bg-[#E0DCD5]" style={{ width: '80%' }} />
				<SkeletonBox className="h-[13px] rounded-md bg-[#E0DCD5]" style={{ width: '60%' }} />
				<SkeletonBox className="h-3 rounded-md bg-[#E0DCD5]" style={{ width: '45%' }} />
			</View>
		</View>
	);
}
