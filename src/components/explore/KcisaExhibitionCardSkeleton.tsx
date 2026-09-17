import { View } from 'react-native';
import { SkeletonBox } from '@/src/components/layout/Loading/SkeletonBox';

const CARD_HEIGHT = Math.round((140 * 4) / 3);

/** KcisaExhibitionCard와 동일한 폭·이미지 비율을 흉내 낸 로딩 스켈레톤. */
export function KcisaExhibitionCardSkeleton() {
	return (
		<View className="w-[148px]">
			<SkeletonBox
				className="rounded-[8px] bg-[#E0DCD5] w-[140px]"
				style={{ height: CARD_HEIGHT }}
			/>
			<SkeletonBox className="h-4 rounded-full bg-[#E0DCD5] mt-2.5 w-[52px]" />
			<SkeletonBox className="h-[14px] rounded-md bg-[#E0DCD5] mt-1 w-[132px]" />
			<SkeletonBox className="h-[11px] rounded-md bg-[#E0DCD5] mt-1 w-[90px]" />
		</View>
	);
}
