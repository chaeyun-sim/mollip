import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/src/components/layout/Screen';
import { ImageFallback } from '@/src/components/common/ImageFallback';
import { Chip } from '@/src/components/common/Chip';
import { StatusBadge } from '@/src/components/search/StatusBadge';
import { useBookmarkedExhibitions } from '@/src/hooks/useBookmarkedExhibitions';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import { getExhibitionStatus, STATUS_LABELS, getDdayLabel } from '@/src/utils/exhibitionSearch';
import type { Exhibition } from '@/src/data/exhibitions';
import type { ExhibitionStatus } from '@/src/utils/exhibitionSearch';
import { colors } from '@/src/constants/colors';
import { cn } from '@/src/lib/cn';

type FilterOption = ExhibitionStatus | 'all';

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
	{ value: 'all', label: '전체' },
	{ value: 'ongoing', label: '진행중' },
	{ value: 'upcoming', label: '예정' },
	{ value: 'ended', label: '마감' },
];

interface ExhibitionCardProps {
	ex: Exhibition;
	onPress: (id: string) => void;
}

function ExhibitionCard({ ex, onPress }: ExhibitionCardProps) {
	const status = getExhibitionStatus(ex);
	const ddayLabel = getDdayLabel(ex);
	const isBookmarked = useBookmarkStore((s) => s.isBookmarked(ex.id));
	const toggleBookmark = useBookmarkStore((s) => s.toggle);

	return (
		<Pressable
			onPress={() => onPress(ex.id)}
			accessibilityLabel={`${ex.title}, ${ex.venue}, ${STATUS_LABELS[status]}`}
			accessibilityRole="button"
			className="flex-row gap-4"
			style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
		>
			<ImageFallback
				heroImageUri={ex.heroImageUri}
				posterImage={ex.posterImage}
				className="rounded-lg w-[72px] aspect-[3/4] bg-image-placeholder"
				iconSize={40}
				resizeMode="cover"
			/>

			<View className="flex-1 justify-center gap-1.5">
				<StatusBadge status={status} />
				<Text
					numberOfLines={2}
					className="text-primary text-[15px] font-pretendard-semibold leading-[21px]"
				>
					{ex.title}
				</Text>
				<View className="flex-row items-center gap-1.5">
					<Text className="text-muted text-[12px] font-pretendard-regular">
						{ex.startDate} – {ex.endDate}
					</Text>
					{ddayLabel && (
						<Text className="text-orange-700 text-[12px] font-pretendard-semibold">
							{ddayLabel}
						</Text>
					)}
				</View>
			</View>

			<Pressable
				onPress={() => toggleBookmark(ex.id)}
				hitSlop={8}
				accessibilityLabel={isBookmarked ? '북마크 해제' : '북마크 추가'}
				accessibilityRole="button"
				className="self-center pl-1"
			>
				<Ionicons
					name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
					size={20}
					className={cn(isBookmarked ? 'text-primary' : 'text-stone-300')}
				/>
			</Pressable>
		</Pressable>
	);
}

export default function ExhibitionBookmarkScreen() {
	const router = useRouter();
	const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
	const { data, isLoading, error } = useBookmarkedExhibitions();

	const handlePress = (id: string) => {
		router.push(`/(explore)/${id}`);
	};

	const filteredData = data.filter((ex) => {
		if (activeFilter === 'all') return true;
		return getExhibitionStatus(ex) === activeFilter;
	});

	function renderList() {
		if (filteredData.length === 0) {
			return (
				<View className="flex-1 items-center justify-center gap-2">
					<Ionicons name="bookmark-outline" size={36} className="text-stone-300" />
					<Text className="text-muted text-[14px] font-pretendard-regular text-center">
						해당하는 전시가 없어요
					</Text>
				</View>
			);
		}

		return (
			<FlatList
				data={filteredData}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => <ExhibitionCard ex={item} onPress={handlePress} />}
				ItemSeparatorComponent={() => <View className="h-4" />}
				contentContainerStyle={{
					paddingTop: 12,
					paddingBottom: 32,
					paddingHorizontal: 4,
				}}
				showsVerticalScrollIndicator={false}
			/>
		);
	}

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back color="muted" />
				<Screen.Header.Center>관심 있는 전시</Screen.Header.Center>
			</Screen.Header>

			{isLoading ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator color={colors.tertiary} />
				</View>
			) : error ? (
				<View className="flex-1 items-center justify-center">
					<Text className="text-tertiary text-[14px] font-pretendard-regular text-center">
						전시 정보를 불러오지 못했어요
					</Text>
				</View>
			) : data.length === 0 ? (
				<View className="flex-1 items-center justify-center gap-2">
					{/* TODO: 북마크 전시 빈 상태 일러스트
						프롬프트: 따뜻한 베이지(#F8F6F2) 배경 위에 접힌 리본 북마크와 작은 액자 그림,
						플랫 일러스트 스타일, 얇은 라인 아트, 잉크색(#1C1917) 윤곽선, 포인트 컬러는 은은한 테라코타,
						미니멀하고 여백이 많은 구도, 사진 느낌 없이 손그림 느낌, 정사각형 120x120 */}
					<Ionicons name="bookmark-outline" size={36} className="text-stone-300" />
					<Text className="text-muted text-[14px] font-pretendard-regular text-center">
						관심 있는 전시가 없어요{'\n'}전시를 탐색하고 북마크해보세요
					</Text>
				</View>
			) : (
				<View className="flex-1 ">
					<View className="flex-row items-center justify-between py-3">
						<Text className="text-muted text-[13px] font-pretendard-regular">
							{filteredData.length}개의 전시
						</Text>
					</View>
					<View className="flex-row gap-2 pb-3">
						{FILTER_OPTIONS.map((option) => (
							<Chip
								key={option.value}
								label={option.label}
								active={activeFilter === option.value}
								onPress={() => setActiveFilter(option.value)}
								accessibilityLabel={`${option.label} 필터`}
							/>
						))}
					</View>
					{renderList()}
				</View>
			)}
		</Screen>
	);
}
