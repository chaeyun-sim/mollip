import { Image, Text, View } from 'react-native';

const SCULPTURE = require('@/assets/images/skulpture/default.png');

export function ExploreHomeHero() {
	return (
		<View style={{ position: 'relative' }}>
			<Image
				source={SCULPTURE}
				resizeMode="contain"
				style={{ position: 'absolute', bottom: 15, right: -8, width: 52, height: 74, opacity: 0.9 }}
				accessibilityIgnoresInvertColors
			/>
			<Text
				className="text-muted text-[11px] font-pretendard-semibold mb-4 tracking-widest"
			>
				전시를 발견하고, 몰입하고, 기록까지.
			</Text>
			<Text className="text-primary text-[40px] leading-[46px] font-hahmlet-bold">
				{'어떤 이야기를\n담고 있을까요?'}
			</Text>
			<View className="h-[1px] bg-muted/30 mt-4 w-16" />
		</View>
	);
}
