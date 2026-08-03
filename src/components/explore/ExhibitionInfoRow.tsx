import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ExhibitionInfoRowProps {
	label: string;
	isLast?: boolean;
	children: ReactNode;
}

export function ExhibitionInfoRow({ label, isLast, children }: ExhibitionInfoRowProps) {
	return (
		<View
			className='flex-row items-start justify-between gap-4 py-3'
			style={
				!isLast
					? {
							borderBottomWidth: StyleSheet.hairlineWidth,
							borderBottomColor: 'rgba(28,25,23,0.15)',
						}
					: undefined
			}
		>
			<Text className='text-gray-500 text-[12px] font-pretendard-semibold tracking-wider uppercase pt-1'>
				{label}
			</Text>
			<View className='flex-1 items-end'>
				<Text
					className='text-[#1C1917] text-[14px] font-pretendard-regular text-right'
					style={{ lineHeight: 21 }}
				>
					{children}
				</Text>
			</View>
		</View>
	);
}
