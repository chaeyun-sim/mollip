import { Text } from 'react-native';
import { cn } from '@/src/lib/cn';
import { STATUS_LABELS, type ExhibitionStatus } from '@/src/utils/exhibitionSearch';

interface ExhibitionStatusBadgeProps {
	status: ExhibitionStatus;
	className?: string;
}

export function ExhibitionStatusBadge({ status, className }: ExhibitionStatusBadgeProps) {
	return (
		<Text
			className={cn(
				'text-black text-[10px] font-pretendard-semibold px-2 py-0.5 bg-black/10 rounded-full self-start',
				className,
			)}
		>
			{STATUS_LABELS[status]}
		</Text>
	);
}
