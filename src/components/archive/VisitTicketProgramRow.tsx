import { Text, View } from 'react-native';

import type { ListenedItem } from '@/src/store/visitStore';

interface VisitTicketProgramRowProps {
	index: number;
	item: ListenedItem;
}

export function VisitTicketProgramRow({ index, item }: VisitTicketProgramRowProps) {
	return (
		<View
			className='flex-row items-center py-3 border-b border-[#F5F5F4]'
			accessibilityLabel={`${index + 1}번, ${item.title}`}
		>
			<Text className='w-6 text-[13px] font-pretendard-medium text-muted'>{index + 1}</Text>
			<Text
				className='flex-1 text-[14px] leading-[19px] font-pretendard-semibold text-primary'
				numberOfLines={2}
			>
				{item.title}
			</Text>
		</View>
	);
}
