import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, View } from 'react-native';
import { Chip } from '@/src/components/common/Chip';
import { Result } from '@/src/components/common/Result';
import { ExhibitionResultCard } from '@/src/components/search/ExhibitionResultCard';
import { ExhibitionResultCardSkeleton } from '@/src/components/search/ExhibitionResultCardSkeleton';
import { useBookmarkedExhibitions } from '@/src/hooks/useBookmarkedExhibitions';
import { getExhibitionStatus, type ExhibitionStatus } from '@/src/utils/exhibitionSearch';

type FilterOption = ExhibitionStatus | 'all';

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
	{ value: 'all', label: '전체' },
	{ value: 'ongoing', label: '진행중' },
	{ value: 'upcoming', label: '예정' },
	{ value: 'ended', label: '마감' },
];

export function BookmarkedExhibitionList() {
	const router = useRouter();
	const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
	const { data, isLoading, error } = useBookmarkedExhibitions();

	const handlePress = (id: string) => router.push(`/(explore)/${id}`);

	const filteredData = data.filter((ex) => {
		if (activeFilter === 'all') return true;
		return getExhibitionStatus(ex) === activeFilter;
	});

	if (isLoading) {
		return (
			<View className="flex-1 gap-4 pt-3">
				{Array.from({ length: 5 }).map((_, index) => (
					<ExhibitionResultCardSkeleton key={index} />
				))}
			</View>
		);
	}

	if (error) {
		return (
			<Result
				icon="cloud-offline-outline"
				iconSize={36}
				tone="danger"
				title="전시 정보를 불러오지 못했어요"
			/>
		);
	}

	if (data.length === 0) {
		return (
			<Result
				icon="bookmark-outline"
				iconSize={36}
				title="관심 있는 전시가 없어요"
				description={'전시를 탐색하고 북마크해보세요'}
			/>
		);
	}

	return (
		<View className="flex-1">
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
			{filteredData.length > 0 ? (
				<FlatList
					data={filteredData}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => (
						<ExhibitionResultCard
							result={{
								exhibition: item,
								status: getExhibitionStatus(item),
								distanceKm: null,
							}}
							onPress={handlePress}
						/>
					)}
					ItemSeparatorComponent={() => <View className="h-4" />}
					contentContainerClassName="pt-3 pb-8 px-1"
					showsVerticalScrollIndicator={false}
				/>
			) : (
				<Result icon="bookmark-outline" iconSize={36} title="해당하는 전시가 없어요" />
			)}
		</View>
	);
}
