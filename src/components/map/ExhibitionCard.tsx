import { Pressable, Text, View } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withSpring,
} from 'react-native-reanimated';
import { ImageFallback } from '@/src/components/common/ImageFallback';
import { cn } from '@/src/lib/cn';
import type { Exhibition } from '@/src/data/exhibitions';

interface ExhibitionCardProps {
	ex: Exhibition;
	status: 'active' | 'upcoming';
	onPress: (id: string) => void;
}

export function ExhibitionCard({ ex, status, onPress }: ExhibitionCardProps) {
	const reduceMotion = useReducedMotion();
	const scale = useSharedValue(1);
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const statusLabel = status === 'active' ? '진행 중' : '예정';

	return (
		<Pressable
			onPressIn={() => {
				scale.value = withSpring(reduceMotion ? 1 : 0.97, { damping: 15 });
			}}
			onPressOut={() => {
				scale.value = withSpring(1, { damping: 15 });
			}}
			onPress={() => onPress(ex.id)}
			accessibilityRole='button'
			accessibilityLabel={`${ex.title}, ${statusLabel}, ${ex.startDate}부터 ${ex.endDate}까지`}
		>
			<Animated.View
				style={animatedStyle}
				className='flex-row gap-3 rounded-2xl overflow-hidden bg-black/[0.03] p-2.5'
			>
				{/* 갤러리 엽서처럼 — 원본 비율을 자르지 않고 정사각 마운트 안에 담는다 */}
				<ImageFallback
					heroImageUri={ex.heroImageUri}
					posterImage={ex.posterImage}
					className='rounded-xl w-[88px] h-[88px]'
					iconSize={44}
					resizeMode='cover'
				/>
				<View className='flex-1 justify-center gap-1.5'>
					<View className='flex-row items-center gap-1.5'>
						<View
							className='w-[5px] h-[5px] rounded-full'
							style={{
								backgroundColor:
									status === 'active' ? ex.posterColor : 'rgba(0,0,0,0.35)',
							}}
						/>
						<Text
							className={cn(
								'text-[10px] font-pretendard-bold tracking-[1.5px] uppercase',
								status === 'active' ? 'text-black/70' : 'text-black/60',
							)}
						>
							{status === 'active' ? 'On View' : 'Opening Soon'}
						</Text>
					</View>
					<Text
						className='text-black text-[14px] font-pretendard-semibold leading-snug'
						numberOfLines={2}
					>
						{ex.title}
					</Text>
					<Text className='text-black/55 text-[11px] font-pretendard-regular'>
						{ex.startDate} – {ex.endDate}
					</Text>
				</View>
			</Animated.View>
		</Pressable>
	);
}
