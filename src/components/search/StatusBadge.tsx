import { Text, View } from 'react-native';
import { STATUS_LABELS, type ExhibitionStatus } from '@/src/utils/exhibitionSearch';

interface StatusBadgeProps {
	status: ExhibitionStatus;
}

/** 포스터 위에 올리는 반투명 상태 배지 */
export function StatusBadge({ status }: StatusBadgeProps) {
	return (
		<View
			className='absolute top-1.5 left-1.5 rounded-full px-2 py-0.5'
			style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
		>
			<Text
				className='text-white text-[10px]'
				style={{ fontFamily: 'Pretendard-SemiBold' }}
			>
				{STATUS_LABELS[status]}
			</Text>
		</View>
	);
}
