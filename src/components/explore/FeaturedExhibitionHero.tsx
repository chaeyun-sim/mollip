import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ImageBackground, Pressable, Text, View } from 'react-native';
import { STATUS_LABELS, type ExhibitionStatus } from '@/src/utils/exhibitionSearch';

export interface FeaturedExhibitionProps {
	id: string;
	/** 캐러셀 헤드라인 문구 (카테고리 기반 카피, 전시 원제목이 아님) */
	title: string;
	/** 실제 전시명 — 서브텍스트에 노출 */
	exhibitionTitle: string;
	venue: string;
	thumbnail: string | null;
	status: ExhibitionStatus;
	onPress: (id: string) => void;
}

export function FeaturedExhibitionHero({
	id,
	title,
	exhibitionTitle,
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
			accessibilityLabel={`${exhibitionTitle}, ${venue}, ${STATUS_LABELS[status]}`}
			style={({ pressed }) => ({ opacity: pressed ? 0.94 : 1 })}
		>
			<View
				className="rounded-2xl overflow-hidden w-full shadow-gray900 elevation-md"
				style={{
					shadowOpacity: 0.16,
					shadowRadius: 18,
					shadowOffset: { width: 0, height: 8 },
				}}
			>
				<ImageBackground
					source={{ uri: thumbnail! }}
					className="h-[380px] justify-end"
					imageStyle={{ resizeMode: 'cover' }}
				>
					<LinearGradient
						colors={['transparent', 'rgba(0,0,0,0.75)']}
						style={{ height: '100%', width: '100%' }}
					>
						<View className="h-full w-full justify-end px-6 pb-6">
							<Text
								className="text-white text-4xl leading-tight mb-2 font-pretendard-bold"
								numberOfLines={2}
							>
								{title}
							</Text>
							<Text className="text-white/70 text-lg font-pretendard-regular" numberOfLines={2}>
								{exhibitionTitle.trim()}
							</Text>
						</View>
					</LinearGradient>
				</ImageBackground>
			</View>
		</Pressable>
	);
}
