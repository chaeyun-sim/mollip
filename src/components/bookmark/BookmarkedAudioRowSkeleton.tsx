import { View } from 'react-native';
import { SkeletonBox } from '@/src/components/layout/Loading/SkeletonBox';

/** 다시 들을 오디오 행(원형 이미지 + 제목·작가·날짜)을 흉내 낸 로딩 스켈레톤 */
export function BookmarkedAudioRowSkeleton() {
	return (
		<View className="flex-row items-center gap-3 py-2.5">
			<SkeletonBox className="h-[40px] w-[40px] rounded-full bg-gray300" />
			<View className="flex-1 gap-1.5">
				<SkeletonBox className="h-[14px] rounded-md bg-gray300" style={{ width: '65%' }} />
				<SkeletonBox className="h-[11px] rounded-md bg-gray300" style={{ width: '40%' }} />
				<SkeletonBox className="h-[9px] rounded-md bg-gray300" style={{ width: '25%' }} />
			</View>
		</View>
	);
}
