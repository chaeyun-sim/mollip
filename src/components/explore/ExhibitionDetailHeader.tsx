import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DeadlineLabel } from './DeadlineLabel';

interface ExhibitionDetailHeaderProps {
	title: string;
	startDate: string;
	endDate: string;
	webSite?: string;
}

export function ExhibitionDetailHeader({
	title,
	startDate,
	endDate,
	webSite,
}: ExhibitionDetailHeaderProps) {
	return (
		<View className="px-6">
			<Text className="text-gray-900 text-[26px] leading-[34px] font-pretendard-bold">
				{title.trim()}
			</Text>
			<View className="flex-row items-center flex-wrap gap-x-3 gap-y-1 mt-3">
				<Text className="text-gray-400 text-[13px] font-pretendard-regular">
					{startDate} - {endDate}
				</Text>
				<DeadlineLabel endDate={endDate} />
				{webSite && (
					<Pressable
						onPress={() => {
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							WebBrowser.openBrowserAsync(webSite);
						}}
						hitSlop={6}
						className="flex-row items-center gap-0.5"
						accessibilityRole="link"
						accessibilityLabel="공식 웹사이트 외부 브라우저에서 열기"
					>
						<Text className="text-primary text-[13px] font-pretendard-medium">공식 웹사이트</Text>
						<Ionicons name="open-outline" size={12} className="text-primary" />
					</Pressable>
				)}
			</View>
		</View>
	);
}
