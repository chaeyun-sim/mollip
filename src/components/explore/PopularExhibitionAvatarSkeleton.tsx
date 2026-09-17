import { View } from 'react-native';
import { SkeletonBox } from '@/src/components/layout/Loading/SkeletonBox';

const AVATAR_SIZE = 56;
const RING_WIDTH = 2;
const RING_GAP = 3;
const CIRCLE_SIZE = AVATAR_SIZE + RING_WIDTH * 2 + RING_GAP * 2;

/** PopularExhibitionAvatar와 동일한 폭·원형 크기를 흉내 낸 로딩 스켈레톤. */
export function PopularExhibitionAvatarSkeleton() {
	return (
		<View className="w-[84px] items-center justify-center">
			<SkeletonBox
				className="rounded-full bg-[#E0DCD5]"
				style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
			/>
		</View>
	);
}
