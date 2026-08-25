import { Text, View } from 'react-native';
import { cn } from '@/src/lib/cn';

/** "YYYY.MM.DD" 문자열을 파싱해 오늘로부터 남은 일수를 반환. 이미 지났으면 음수. */
function getDaysRemaining(dateStr: string): number {
	const [y, m, d] = dateStr.split('.').map(Number);
	const end = new Date(y, m - 1, d);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return Math.round((end.getTime() - today.getTime()) / 86_400_000);
}

interface DeadlineLabelProps {
	endDate: string;
}

export function DeadlineLabel({ endDate }: DeadlineLabelProps) {
	const days = getDaysRemaining(endDate);
	if (days > 14 || days < 0) return null;

	const label = days === 0 ? '오늘 마감' : `D-${days}`;

	return (
		<View
			className={cn(
				'px-2 py-0.5 rounded-full',
				days <= 3 ? 'bg-error' : days <= 7 ? 'bg-orange-500' : 'bg-yellow-500',
			)}
		>
			<Text className="font-pretendard-semibold text-[11px] text-white">{label}</Text>
		</View>
	);
}
