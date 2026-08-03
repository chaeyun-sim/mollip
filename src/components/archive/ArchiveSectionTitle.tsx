import { Text, View } from 'react-native';

interface ArchiveSectionTitleProps {
	title: string;
	subtitle?: string;
}

export function ArchiveSectionTitle({ title, subtitle }: ArchiveSectionTitleProps) {
	return (
		<View className='mb-4'>
			<Text className='text-[#1C1917] text-[20px]' style={{ fontFamily: 'Hahmlet_600SemiBold' }}>
				{title}
			</Text>
			{subtitle ? (
				<Text
					className='text-[13px] mt-1 leading-[19px]'
					style={{ fontFamily: 'Pretendard-Regular', color: '#57534E' }}
				>
					{subtitle}
				</Text>
			) : null}
		</View>
	);
}
