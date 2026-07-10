import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Exhibition } from '@/src/data/exhibitions';

interface ExhibitionCardProps {
	ex: Exhibition;
	onPress: (id: string) => void;
}

export function ExhibitionCard({ ex, onPress }: ExhibitionCardProps) {
	return (
		<Pressable
			onPress={() => onPress(ex.id)}
			className='flex-row gap-3 rounded-2xl overflow-hidden bg-black/5 p-3'
			style={({ pressed }) => (pressed ? { opacity: 0.65 } : undefined)}
			accessibilityRole='button'
			accessibilityLabel={ex.title}
		>
			{ex.posterImage ? (
				<Image
					source={ex.posterImage}
					resizeMode='cover'
					className='rounded-xl'
					style={{ width: 80, height: 100 }}
				/>
			) : (
				<View
					className='rounded-xl items-center justify-center w-[80px] h-[100px]'
					style={{ backgroundColor: ex.posterColor }}
				>
					<Ionicons name='image-outline' size={24} color='rgba(0,0,0,0.2)' />
				</View>
			)}
			<View className='flex-1 justify-center gap-1.5'>
				<Text
					className='text-black text-[15px] font-pretendard-semibold leading-snug'
					numberOfLines={3}
				>
					{ex.title}
				</Text>
				<Text className='text-black/40 text-xs font-pretendard-regular'>
					{ex.startDate} – {ex.endDate}
				</Text>
			</View>
			<View className='justify-center'>
				<Ionicons name='chevron-forward' size={16} color='rgba(0,0,0,0.2)' />
			</View>
		</Pressable>
	);
}
