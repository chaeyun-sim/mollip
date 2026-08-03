import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, Text } from 'react-native';

import type { Exhibition } from '@/src/data/exhibitions';

interface ExhibitionOfficialLinkProps {
	exhibition: Exhibition;
}

function exhibitionOfficialLinkLabel(exhibition: Exhibition): string {
	if (exhibition.admissionFree) return '공식 안내';
	return '예매·안내';
}

export function ExhibitionOfficialLink({ exhibition }: ExhibitionOfficialLinkProps) {
	const url = exhibition.ticketUrl;
	if (!url) return null;
	const label = exhibitionOfficialLinkLabel(exhibition);

	return (
		<Pressable
			onPress={() => {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				WebBrowser.openBrowserAsync(url);
			}}
			hitSlop={6}
			className='flex-row items-center gap-0.5'
			accessibilityRole='link'
			accessibilityLabel={`${label}, 외부 브라우저에서 열기`}
		>
			<Text className='text-[#1C1917] text-[13px] font-pretendard-semibold underline'>
				{label}
			</Text>
			<Ionicons name='open-outline' size={12} color='#1C1917' />
		</Pressable>
	);
}
