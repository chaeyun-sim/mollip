import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Image, ImageBackground, Pressable, Text, View } from 'react-native';
import { QUESTION_MARK } from '@/src/components/common/ImageFallback';
import { colors } from '@/src/constants/colors';
import { STATUS_LABELS, type ExhibitionStatus } from '@/src/utils/exhibitionSearch';

export interface FeaturedExhibitionProps {
	id: string;
	title: string;
	venue: string;
	thumbnail: string | null;
	status: ExhibitionStatus;
	onPress: (id: string) => void;
}

export function FeaturedExhibitionHero({
	id,
	title,
	venue,
	thumbnail,
	status,
	onPress,
}: FeaturedExhibitionProps) {
	return (
		<Pressable
			onPress={() => {
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				onPress(id);
			}}
			accessibilityRole="button"
			accessibilityLabel={`오늘의 전시, ${title}, ${venue}`}
			style={({ pressed }) => ({ opacity: pressed ? 0.94 : 1 })}
		>
			<View
				className="rounded-2xl overflow-hidden w-full"
				style={{
					shadowColor: colors.gray900,
					shadowOpacity: 0.16,
					shadowRadius: 18,
					shadowOffset: { width: 0, height: 8 },
					elevation: 6,
				}}
			>
				{thumbnail ? (
					<ImageBackground
						source={{ uri: thumbnail }}
						className="h-[380px] justify-between"
						imageStyle={{ resizeMode: 'cover' }}
					>
						<View className="self-start mt-4 ml-4 rounded-full bg-black/40 px-3 py-1.5">
							<Text
								className="text-white text-[10px] font-pretendard-semibold"
								style={{ letterSpacing: 1 }}
							>
								TODAY&apos;S PICK
							</Text>
						</View>

						<LinearGradient
							colors={['transparent', 'rgba(0,0,0,0.75)']}
							style={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 90 }}
						>
							<Text
								className="text-white text-[26px] leading-[32px] mb-2 font-pretendard-bold"
								numberOfLines={2}
							>
								{title}
							</Text>
							<Text className="text-white/70 text-[13px] font-pretendard-regular" numberOfLines={1}>
								{venue} · {STATUS_LABELS[status]}
							</Text>
						</LinearGradient>
					</ImageBackground>
				) : (
					<View className="h-[300px] bg-image-placeholder items-center justify-center px-6">
						<Image
							source={QUESTION_MARK}
							style={{ width: 100, height: 100 }}
							resizeMode="contain"
							className="mb-4"
						/>
						<Text
							className="text-gray900 text-[22px] text-center font-hahmlet-bold"
							numberOfLines={2}
						>
							{title}
						</Text>
						<Text className="text-gray600 text-[13px] mt-2 text-center font-pretendard-regular">
							{venue} · {STATUS_LABELS[status]}
						</Text>
					</View>
				)}
			</View>
		</Pressable>
	);
}
