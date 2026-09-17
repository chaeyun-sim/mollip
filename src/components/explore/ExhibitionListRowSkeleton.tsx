import { View } from 'react-native';
import { SkeletonBox } from '@/src/components/layout/Loading/SkeletonBox';
import { cn } from '@/src/lib/cn';

const ROW_HEIGHT = 100;

interface ExhibitionListRowSkeletonProps {
	columnWidth: number;
	showDivider: boolean;
}

/** ExhibitionListRow과 동일한 높이·폭을 흉내 낸 로딩 스켈레톤. */
export function ExhibitionListRowSkeleton({
	columnWidth,
	showDivider,
}: ExhibitionListRowSkeletonProps) {
	return (
		<View className={cn('flex-row gap-4 py-4', showDivider && 'border-b border-description')}>
			<SkeletonBox
				className="rounded-none bg-[#E0DCD5]"
				style={{ width: columnWidth, height: ROW_HEIGHT }}
			/>
			<View className="flex-1 justify-center gap-2" style={{ height: ROW_HEIGHT }}>
				<SkeletonBox className="h-[9px] rounded-md bg-[#E0DCD5]" style={{ width: '70%' }} />
				<SkeletonBox className="h-[15px] rounded-md bg-[#E0DCD5]" style={{ width: '85%' }} />
				<SkeletonBox className="h-[9px] rounded-md bg-[#E0DCD5]" style={{ width: '55%' }} />
			</View>
		</View>
	);
}
