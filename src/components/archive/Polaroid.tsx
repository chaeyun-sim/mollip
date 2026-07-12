import { Image, ImageSourcePropType, Text, View, ViewStyle } from 'react-native';

interface PolaroidProps {
	source?: ImageSourcePropType;
	fallbackColor?: string;
	caption: string;
	rotate?: number;
	width?: number;
	style?: ViewStyle;
}

// 폴라로이드 사진 프레임. 이미지가 없으면 포스터 컬러로 채운다.
export function Polaroid({
	source,
	fallbackColor = '#D8CDBB',
	caption,
	rotate = -3,
	width = 148,
	style,
}: PolaroidProps) {
	const photoHeight = width * 1.15;
	return (
		<View
			className='bg-white p-2 pb-3'
			style={[
				{
					width: width + 16,
					transform: [{ rotate: `${rotate}deg` }],
					shadowColor: '#4A4238',
					shadowOpacity: 0.22,
					shadowRadius: 6,
					shadowOffset: { width: 0, height: 3 },
					elevation: 4,
				},
				style,
			]}
		>
			{source ? (
				<Image
					source={source}
					resizeMode='cover'
					style={{ width, height: photoHeight }}
				/>
			) : (
				<View style={{ width, height: photoHeight, backgroundColor: fallbackColor }} />
			)}
			<Text
				className='mt-2 text-center text-[15px] text-[#44403C]'
				style={{ fontFamily: 'NanumPenScript_400Regular' }}
				numberOfLines={1}
			>
				{caption}
			</Text>
		</View>
	);
}
