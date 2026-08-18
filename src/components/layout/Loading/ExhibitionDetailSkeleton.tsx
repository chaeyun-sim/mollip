import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Dimensions, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SkeletonBox } from './SkeletonBox';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.62;

export function ExhibitionDetailSkeleton() {
	const router = useRouter();
	const insets = useSafeAreaInsets();

	return (
		<View className='flex-1 bg-[#F8F6F2]'>
			{/* Hero */}
			<SkeletonBox className='w-full bg-[#E0DCD5]' style={{ height: HERO_HEIGHT }} />

			{/* 뒤로가기 — 실제 버튼 (FloatingActions와 동일 위치) */}
			<Pressable
				onPress={() => router.back()}
				className='absolute left-5 w-10 h-10 rounded-full bg-white/80 items-center justify-center'
				style={{ top: insets.top + 16 }}
				accessibilityRole='button'
				accessibilityLabel='뒤로가기'
				hitSlop={8}
			>
				<Ionicons name='chevron-back' size={22} color='#1a1a1a' />
			</Pressable>

			{/* MetaPills */}
			<View className='flex-row gap-2 px-[18px] py-4'>
				{[72, 56, 64].map((w, i) => (
					<SkeletonBox key={i} className='h-6 rounded-full bg-[#E0DCD5]' style={{ width: w }} />
				))}
			</View>

			{/* 제목 + 날짜 */}
			<View className='px-6'>
				<SkeletonBox className='h-[26px] rounded-lg bg-[#E0DCD5]' style={{ width: '72%' }} />
				<SkeletonBox className='h-[14px] rounded-md bg-[#E0DCD5] mt-3' style={{ width: '38%' }} />
			</View>

			{/* 설명 줄 */}
			<View className='px-6 mt-6 gap-2'>
				<SkeletonBox className='h-3 rounded-md bg-[#E0DCD5]' style={{ width: '100%' }} />
				<SkeletonBox className='h-3 rounded-md bg-[#E0DCD5]' style={{ width: '100%' }} />
				<SkeletonBox className='h-3 rounded-md bg-[#E0DCD5]' style={{ width: '80%' }} />
				<SkeletonBox className='h-3 rounded-md bg-[#E0DCD5]' style={{ width: '60%' }} />
			</View>

			{/* 장소 정보 행 */}
			<View className='px-6 mt-8 gap-4'>
				{[100, 140, 90].map((w, i) => (
					<View key={i} className='flex-row items-center gap-3'>
						<SkeletonBox className='w-5 h-5 rounded bg-[#E0DCD5]' />
						<SkeletonBox className='h-[14px] rounded-md bg-[#E0DCD5]' style={{ width: w }} />
					</View>
				))}
			</View>
		</View>
	);
}
