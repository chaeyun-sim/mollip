import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

interface ExhibitionMetaPillProps {
	icon?: keyof typeof Ionicons.glyphMap;
	text: string;
	searchable?: boolean;
}

export function ExhibitionMetaPill({
	icon,
	text,
	searchable = true,
}: ExhibitionMetaPillProps) {
	const router = useRouter();
	if (!searchable) {
		return (
			<View className='flex-row items-center gap-1.5 rounded-full px-3 py-2 bg-white'>
				{icon && <Ionicons name={icon} size={14} color='#6B7280' />}
				<Text className='font-pretendard-regular text-[12px] text-[#374151]'>{text}</Text>
			</View>
		);
	}
	return (
		<Pressable
			onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: text } })}
			className='flex-row items-center gap-1.5 rounded-full px-3 py-2 bg-white'
			style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
			accessibilityRole='button'
			accessibilityLabel={`${text}로 검색`}
		>
			{icon && <Ionicons name={icon} size={14} color='#6B7280' />}
			<Text className='font-pretendard-regular text-[12px] text-[#374151]'>{text}</Text>
		</Pressable>
	);
}
