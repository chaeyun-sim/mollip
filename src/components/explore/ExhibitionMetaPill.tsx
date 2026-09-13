import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ExhibitionMetaPillProps {
	icon?: keyof typeof Ionicons.glyphMap;
	text: string;
	searchable?: boolean;
}

export function ExhibitionMetaPill({ icon, text, searchable = true }: ExhibitionMetaPillProps) {
	const router = useRouter();

	const handlePress = () => {
		if (!searchable) return;

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		router.push({ pathname: '/(tabs)/search', params: { q: text } });
	};

	return (
		<Pressable
			onPress={handlePress}
			disabled={!searchable}
			className="flex-row items-center gap-1.5 rounded-full px-3 py-2 bg-white"
			style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
			accessibilityRole={searchable ? 'button' : 'text'}
			accessibilityLabel={searchable ? `${text}로 검색` : text}
		>
			{icon && <Ionicons name={icon} size={14} color="#6B7280" />}
			<Text className="font-pretendard-regular text-[12px] text-[#374151]">{text}</Text>
		</Pressable>
	);
}
