import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ImageFallback } from '@/src/components/common/ImageFallback';
import { SkeletonBox } from '@/src/components/layout/Loading/SkeletonBox';
import { HOME_SIDE_PADDING, HomeSectionHeader } from '@/src/components/home/HomeSectionHeader';
import type { ExhibitionSummary } from '@/src/hooks/queries/useExploreScreenData';
import type { AsyncStatus } from '@/src/types/asyncStatus.types';

const CARD_WIDTH = 132;
const POSTER_HEIGHT = 176;
const CARD_GAP = 12;
const SKELETON_COUNT = 3;

interface ClosingSoonRailProps {
	items: (ExhibitionSummary & { daysLeft: number })[];
	status: AsyncStatus;
	onPress: (id: string) => void;
}

/** 곧 막을 내리는 전시 — 2주 안에 끝나는 전시의 D-day 포스터 레일. 전체는 검색 "마감 임박" 필터로, 대상이 없으면 숨긴다 */
export function ClosingSoonRail({ items, status, onPress }: ClosingSoonRailProps) {
	const router = useRouter();

	const header = (
		<HomeSectionHeader
			title="2주 안에 끝나요"
			right={
				<Pressable
					onPress={() => router.push({ pathname: '/search', params: { closing: '1' } })}
					hitSlop={8}
					accessibilityRole="button"
					accessibilityLabel="곧 막을 내리는 전시 전체 보기"
				>
					{({ pressed }) => (
						<View className="flex-row items-center" style={{ opacity: pressed ? 0.6 : 1 }}>
							<Text className="text-gray700 text-[13px] font-pretendard-medium mr-0.5">전체</Text>
							<Ionicons name="chevron-forward" size={14} className="text-gray700" />
						</View>
					)}
				</Pressable>
			}
		/>
	);
	const railStyle = { paddingHorizontal: HOME_SIDE_PADDING, columnGap: CARD_GAP };

	if (items.length === 0 && status === 'loading') {
		return (
			<View>
				{header}
				<ScrollView
					horizontal
					scrollEnabled={false}
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={railStyle}
				>
					{Array.from({ length: SKELETON_COUNT }).map((_, index) => (
						<View key={index} style={{ width: CARD_WIDTH }}>
							<SkeletonBox
								className="rounded-[14px] bg-[#E0DCD5]"
								style={{ width: CARD_WIDTH, height: POSTER_HEIGHT }}
							/>
							<SkeletonBox className="mt-2.5 h-[14px] w-[85%] rounded-md bg-[#E0DCD5]" />
						</View>
					))}
				</ScrollView>
			</View>
		);
	}

	return (
		items.length > 0 && (
			<View>
				{header}
				<ScrollView
					horizontal
					// 대각선으로 세게 끌어도 가로로만 움직이고 세로로 튕기지 않게 한다
					directionalLockEnabled
					alwaysBounceVertical={false}
					showsHorizontalScrollIndicator={false}
					snapToInterval={CARD_WIDTH + CARD_GAP}
					decelerationRate="fast"
					contentContainerStyle={railStyle}
				>
					{items.map((item) => {
						const title = item.title.trim();
						const venue = item.venue.trim() || '장소 정보 없음';
						const dday = `D-${item.daysLeft}`;
						return (
							<Pressable
								key={item.id}
								onPress={() => onPress(item.id)}
								accessibilityRole="button"
								accessibilityLabel={`${title}, ${venue}, ${dday}`}
								style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
							>
								<View style={{ width: CARD_WIDTH }}>
									<View
										className="overflow-hidden rounded-[14px]"
										style={{ width: CARD_WIDTH, height: POSTER_HEIGHT }}
									>
										<ImageFallback
											heroImageUri={item.thumbnail}
											className="absolute inset-0 bg-image-placeholder"
											iconSize={44}
											resizeMode="cover"
											useImageProxy
										/>
										<Text className="absolute left-2 top-2 overflow-hidden rounded-full bg-primary-dark px-2.5 py-1 text-white text-[13px] font-pretendard-bold">
											{dday}
										</Text>
									</View>
									<Text
										numberOfLines={2}
										className="mt-2.5 text-gray900 text-[14px] leading-[19px] font-pretendard-semibold"
									>
										{title}
									</Text>
									<Text
										numberOfLines={1}
										className="mt-0.5 text-gray700 text-[12px] font-pretendard-regular"
									>
										{venue}
									</Text>
								</View>
							</Pressable>
						);
					})}
				</ScrollView>
			</View>
		)
	);
}
