import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from 'react-native-reanimated';

import { ExhibitionPoster } from '@/src/components/common/EmptyImagePlaceholder';
import type { Exhibition } from '@/src/data/exhibitions';
import { getDdayLabel } from '@/src/utils/exhibitionSearch';

const POSTER_W = 148;
const POSTER_H = 216;

interface RelatedExhibitionsProps {
	exhibitions: Exhibition[];
}

export function RelatedExhibitions({ exhibitions }: RelatedExhibitionsProps) {
	const router = useRouter();
	const related = exhibitions.slice(0, 6);

	return (
		<View className='pt-8 mt-4'>
			<Text className='font-pretendard-semibold text-[18px] text-gray-900 mb-4 px-6'>
				관련 전시
			</Text>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{ paddingHorizontal: 24, gap: 14 }}
			>
				{related.map((ex) => (
					<RelatedExhibitionCard
						key={ex.id}
						exhibition={ex}
						onPress={() => router.push(`/(explore)/${ex.id}`)}
					/>
				))}
			</ScrollView>
		</View>
	);
}

interface RelatedExhibitionCardProps {
	exhibition: Exhibition;
	onPress: () => void;
}

function RelatedExhibitionCard({
	exhibition,
	onPress,
}: RelatedExhibitionCardProps) {
	const scale = useSharedValue(1);
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));
	const ddayLabel = getDdayLabel(exhibition, undefined, Infinity);

	return (
		<Pressable
			onPressIn={() => {
				scale.value = withSpring(0.96, { damping: 30, stiffness: 300 });
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			}}
			onPressOut={() => {
				scale.value = withSpring(1, { damping: 30, stiffness: 300 });
			}}
			onPress={onPress}
			style={{ width: POSTER_W }}
			accessibilityLabel={`${exhibition.title}, ${exhibition.venue}`}
			accessibilityRole='button'
		>
			<Animated.View style={animatedStyle}>
				<ExhibitionPoster
					heroImageUri={exhibition.heroImageUri}
					posterImage={exhibition.posterImage}
					style={{ width: POSTER_W, height: POSTER_H }}
					className='rounded-2xl'
					iconSize={72}
					resizeMode='cover'
				>
					<LinearGradient
						colors={['rgba(0,0,0,0.4)', 'transparent']}
						className='absolute top-0 left-0 right-0 h-14'
						pointerEvents='none'
					/>
					{ddayLabel ? (
						<View
							className='absolute top-2.5 left-2.5 rounded-full px-2.5 py-1 bg-white/85'
							style={{
								shadowColor: '#000',
								shadowOpacity: 0.15,
								shadowRadius: 4,
								shadowOffset: { width: 0, height: 1 },
								elevation: 2,
							}}
						>
							<Text className='text-[10px] font-pretendard-semibold text-[#1C1917]'>
								{ddayLabel}
							</Text>
						</View>
					) : null}
				</ExhibitionPoster>
				<View className='pt-2.5' style={{ width: POSTER_W }}>
					<Text
						className='font-pretendard-semibold text-[14px] text-gray-900'
						numberOfLines={2}
					>
						{exhibition.title.trim()}
					</Text>
					<View className='flex-row items-center gap-1 mt-1'>
						<Ionicons name='location-outline' size={11} color='#9CA3AF' />
						<Text
							className='font-pretendard-regular text-[11px] text-gray-400 flex-1'
							numberOfLines={1}
						>
							{exhibition.venue}
						</Text>
					</View>
				</View>
			</Animated.View>
		</Pressable>
	);
}
