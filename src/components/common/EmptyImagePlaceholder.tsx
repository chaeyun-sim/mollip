import { Image, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

interface EmptyImagePlaceholderProps {
	className?: string;
	style?: StyleProp<ViewStyle>;
	iconSize?: number;
}

// 작품/전시 이미지가 없을 때의 공용 빈 상태 — 연한 회색 배경 위에 물음표 석고상을
// 50% 투명도로 중앙 배치. posterColor 단색 배경 대신 이걸로 통일해서 쓴다.
export function EmptyImagePlaceholder({
	className = 'flex-1 items-center justify-center',
	style,
	iconSize = 96,
}: EmptyImagePlaceholderProps) {
	return (
		<View className={className} style={style}>
			<Image
				source={require('@/assets/images/skulpture/question.png')}
				style={{ width: iconSize, height: iconSize, opacity: 0.5 }}
				resizeMode='contain'
			/>
		</View>
	);
}
