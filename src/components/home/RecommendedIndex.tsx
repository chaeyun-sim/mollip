import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { ImageFallback } from '@/src/components/common/ImageFallback';
import { ScalePressable } from '@/src/components/common/ScalePressable';
import { HOME_SIDE_PADDING, HomeSectionHeader } from '@/src/components/home/HomeSectionHeader';
import type { ExhibitionSummary } from '@/src/hooks/queries/useExploreScreenData';
import { cn } from '@/src/lib/cn';
import { STATUS_LABELS } from '@/src/utils/exhibitionSearch';

const MAX_ITEMS = 3;

interface RecommendedIndexProps {
	title: string;
	items: ExhibitionSummary[];
	onPress: (id: string) => void;
}

/** 맞춤 추천 — 포스터 크기로 첫 제안을 강조하는 작은 큐레이션 카드. */
export function RecommendedIndex({ title, items, onPress }: RecommendedIndexProps) {
	const visible = items.slice(0, MAX_ITEMS);
	if (visible.length === 0) return null;

	return (
		<View style={{ marginTop: 28 }}>
			<HomeSectionHeader index={3} title="FOR YOU" right={<Ionicons name="heart" />} />
			<View
				className="overflow-hidden rounded-2xl border border-ink/10 bg-white"
				style={{ marginHorizontal: HOME_SIDE_PADDING }}
			>
				<View className="bg-surface-neutral px-5 pt-4 pb-4">
					<Text
						numberOfLines={2}
						className="font-hahmlet-semibold text-ink text-[20px] leading-[28px]"
					>
						{title}
					</Text>
					<Text className="mt-1 font-pretendard-regular text-gray600 text-[12px]">
						선호 장르를 바탕으로 골랐어요
					</Text>
				</View>

				<View className="px-4 pt-1 pb-2">
					{visible.map((item, indexInCard) => {
						const isFirst = indexInCard === 0;
						const titleText = item.title.trim();
						const venue = item.venue.trim() || '장소 정보 없음';
						const status = STATUS_LABELS[item.status];
						return (
							<ScalePressable
								key={item.id}
								onPress={() => onPress(item.id)}
								accessibilityRole="button"
								accessibilityLabel={`${titleText}, ${venue}, ${status}`}
								className={cn('flex-row items-center gap-3 py-3', {
									'border-b border-ink/10': indexInCard < visible.length - 1,
								})}
							>
								<ImageFallback
									heroImageUri={item.thumbnail}
									className={cn('rounded-lg', isFirst ? 'h-[138px] w-[104px]' : 'h-16 w-[52px]')}
									iconSize={isFirst ? 32 : 22}
									useImageProxy
								/>
								<View className="flex-1">
									<Text className="mb-1 self-start rounded-full bg-surface-neutral px-2 py-0.5 font-pretendard-bold text-gray700 text-[10px] tracking-[0.8px]">
										{String(indexInCard + 1).padStart(2, '0')}
									</Text>
									<Text
										numberOfLines={2}
										className={cn(
											'font-pretendard-semibold text-ink leading-[21px]',
											isFirst ? 'text-[16px]' : 'text-[14px]',
										)}
									>
										{titleText}
									</Text>
									<Text
										numberOfLines={1}
										className="mt-1 font-pretendard-regular text-gray600 text-[11px]"
									>
										{`${venue} · ${status}`}
									</Text>
								</View>
								<Ionicons name="chevron-forward" size={16} className="text-gray600" />
							</ScalePressable>
						);
					})}
				</View>
			</View>
		</View>
	);
}
