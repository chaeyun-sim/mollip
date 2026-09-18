import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CircleActionButton } from '@/src/components/explore/CircleActionButton';
import { SkeletonBox } from './SkeletonBox';

export function ExhibitionDetailSkeleton() {
	const router = useRouter();
	const insets = useSafeAreaInsets();

	return (
		<View className="flex-1 bg-bg-light">
			{/* 원형 액션 버튼 — 뒤로가기/루트/공유, 실제 화면과 동일 위치 */}
			<View
				className="absolute left-0 right-0 z-20 px-6"
				style={{ top: insets.top + 18 }}
				pointerEvents="box-none"
			>
				<View className="flex-row items-center justify-between">
					<CircleActionButton icon="chevron-back" label="뒤로가기" onPress={() => router.back()} />
					<View className="flex-row gap-2">
						<CircleActionButton icon="map-outline" label="관람 루트 보기" onPress={() => {}} />
						<CircleActionButton icon="share-outline" label="공유하기" onPress={() => {}} />
					</View>
				</View>
			</View>

			<View style={{ paddingTop: insets.top + 88 }}>
				{/* 제목 + 장소 */}
				<View className="px-6">
					<SkeletonBox className="h-[30px] rounded-lg bg-[#E0DCD5]" style={{ width: '85%' }} />
					<SkeletonBox className="h-[14px] rounded-md bg-[#E0DCD5] mt-2" style={{ width: '45%' }} />
				</View>

				{/* 포스터 카드 */}
				<SkeletonBox
					className="mt-7 rounded-[8px] bg-[#E0DCD5] w-[90%] mx-auto"
					style={{ height: 430 }}
				/>

				{/* 설명 줄 */}
				<View className="px-6 mt-6 gap-2">
					<SkeletonBox className="h-3 rounded-md bg-[#E0DCD5]" style={{ width: '100%' }} />
					<SkeletonBox className="h-3 rounded-md bg-[#E0DCD5]" style={{ width: '100%' }} />
					<SkeletonBox className="h-3 rounded-md bg-[#E0DCD5]" style={{ width: '60%' }} />
				</View>

				{/* MetaPills */}
				<View className="flex-row gap-2 px-6 pt-5">
					{[72, 56, 64].map((w, i) => (
						<SkeletonBox key={i} className="h-6 rounded-full bg-[#E0DCD5]" style={{ width: w }} />
					))}
				</View>

				{/* 관람 정보 행 */}
				<View className="px-6 mt-8 gap-4">
					{[100, 140, 90].map((w, i) => (
						<View key={i} className="flex-row items-center gap-3">
							<SkeletonBox className="w-5 h-5 rounded bg-[#E0DCD5]" />
							<SkeletonBox className="h-[14px] rounded-md bg-[#E0DCD5]" style={{ width: w }} />
						</View>
					))}
				</View>
			</View>
		</View>
	);
}
