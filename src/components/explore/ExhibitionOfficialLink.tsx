import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, Text } from 'react-native';

interface ExhibitionOfficialLinkProps {
	url: string;
}

export function ExhibitionOfficialLink({ url }: ExhibitionOfficialLinkProps) {
	if (!url) return null;

	return (
		<Pressable
			onPress={() => {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				WebBrowser.openBrowserAsync(url);
			}}
			hitSlop={6}
			className='flex-row items-center gap-0.5'
			accessibilityRole='link'
			accessibilityLabel={`공식 웹사이트 외부 브라우저에서 열기`}
		>
			<Text className='text-[#1C1917] text-[13px] font-pretendard-medium'>
				공식 웹사이트
			</Text>
			<Ionicons name='open-outline' size={12} color='#1C1917' />
		</Pressable>
	);
}
