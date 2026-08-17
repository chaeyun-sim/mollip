import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

interface ExhibitionDescriptionProps {
	description: string;
}

export function ExhibitionDescription({ description }: ExhibitionDescriptionProps) {
	const [expanded, setExpanded] = useState(false);

	return (
		<View className='px-6 pt-3'>
			<Text
				className='font-pretendard-light text-[15px] leading-[26px] text-gray-600'
				numberOfLines={expanded ? undefined : 3}
			>
				{description}
			</Text>
			<Pressable
				onPress={() => setExpanded((prev) => !prev)}
				className='mt-2'
				accessibilityRole='button'
				accessibilityLabel={expanded ? '설명 접기' : '설명 더보기'}
			>
				<Text className='text-gray-400 text-[13px] font-pretendard-medium'>
					{expanded ? '접기' : '더보기'}
				</Text>
			</Pressable>
		</View>
	);
}
