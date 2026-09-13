import { cn } from '@/src/lib/cn';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface ExhibitionInfoRowProps {
	label: string;
	isLast?: boolean;
	children: ReactNode;
}

export function ExhibitionInfoRow({ label, isLast, children }: ExhibitionInfoRowProps) {
	return (
		<View
			className={cn("flex-row items-start justify-between gap-28 py-3", !isLast && "border-b-hairline border-b-gray900/15")}
		>
			<Text className="text-gray-500 text-[12px] font-pretendard-semibold tracking-wider uppercase pt-1 whitespace-pre">
				{label}
			</Text>
			<View className="flex-1 items-end">
				<Text className="text-gray900 text-[14px] font-pretendard-regular text-right leading-5">
					{children}
				</Text>
			</View>
		</View>
	);
}
