import { Text } from 'react-native';
import { STATUS_LABELS, type ExhibitionStatus } from '@/src/utils/exhibitionSearch';

interface StatusBadgeProps {
	status: ExhibitionStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
	return (
		<Text className="text-black text-[10px] font-pretendard-semibold px-2 py-0.5 bg-black/10 rounded-full self-start">
			{STATUS_LABELS[status]}
		</Text>
	);
}
