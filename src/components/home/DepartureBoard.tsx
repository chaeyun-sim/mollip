import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { FadeInView } from '@/src/components/common/FadeInView';
import { ScalePressable } from '@/src/components/common/ScalePressable';
import { FlapTile } from '@/src/components/home/FlapTile';
import { SkeletonBox } from '@/src/components/layout/Loading/SkeletonBox';
import { HOME_SIDE_PADDING, HomeSectionHeader } from '@/src/components/home/HomeSectionHeader';
import type { ExhibitionSummary } from '@/src/hooks/queries/useExploreScreenData';
import { useCountUp } from '@/src/hooks/useCountUp';
import { cn } from '@/src/lib/cn';
import type { AsyncStatus } from '@/src/types/asyncStatus.types';
import type { DepartureRow } from '@/src/utils/homeExhibitionMeta';

const SKELETON_ROWS = 3;
/** 플랩 타일이 하나씩 넘어가는 간격 */
const FLAP_STAGGER_MS = 90;
/** 목록 행이 하나씩 떠오르는 간격 */
const ROW_STAGGER_MS = 45;

interface DepartureBoardProps {
	/** 섹션 번호 */
	index: number;
	rows: DepartureRow<ExhibitionSummary>[];
	/** 가장 가까운 last call 일수와 그 날 떠나는 전시 수 — 큰 플랩 문구용 */
	nearest: { daysLeft: number; count: number } | null;
	status: AsyncStatus;
	onPress: (id: string) => void;
}

/** 1 → "내일", 2 → "모레", 그 외 → "n일 뒤" */
const toDayWord = (days: number) => {
	if (days === 1) return '내일';
	if (days === 2) return '모레';
	return `${days}일 뒤`;
};

const getStatusLabel = (row: DepartureRow<ExhibitionSummary>) => {
	if (row.departure === 'last-call') return `${toDayWord(row.days)} 떠나요`;
	if (row.departure === 'boarding') return '머무는 중';
	return '곧 도착해요';
};

/** 곧 떠나는 전시 — 큰 D-day 플랩 + 마감 임박 3 · 진행 중 3 · 개막 예정 2 목록. 대상이 없으면 숨긴다 */
export function DepartureBoard({ index, rows, nearest, status, onPress }: DepartureBoardProps) {
	const router = useRouter();
	// 플랩이 다 넘어간 뒤 'N개'가 0부터 올라간다
	const nearestCount = useCountUp(nearest?.count ?? 0, { delay: FLAP_STAGGER_MS * 3 });

	const isLoading = rows.length === 0 && status === 'loading';
	const today = new Date();

	return (
		(isLoading || rows.length > 0) && (
			<View style={{ marginTop: 28 }}>
				<HomeSectionHeader
					index={index}
					title="DEPARTURES"
					right={
						<Text className="text-gray900 text-[12px] font-pretendard-semibold tracking-[1px]">
							{`${today.getMonth() + 1}/${today.getDate()}`}
						</Text>
					}
				/>

				{/* 큰 플랩 — 가장 가까운 마감 D-day와 한 문장 */}
				{nearest && (
					<View
						className="flex-row items-center gap-[18px]"
						style={{ paddingHorizontal: HOME_SIDE_PADDING }}
						accessible
						accessibilityLabel={`${toDayWord(nearest.daysLeft)} 떠나는 전시가 ${nearest.count}개 있어요`}
					>
						<View className="flex-row gap-1">
							{`D-${nearest.daysLeft}`.split('').map((char, i) => (
								<FlapTile key={i} char={char} delay={i * FLAP_STAGGER_MS} />
							))}
						</View>
						<Text className="flex-1 text-gray900 text-[18px] leading-[26px] font-pretendard-semibold">
							{`곧 떠나는\n전시가 ${nearestCount}개 있어요`}
						</Text>
					</View>
				)}

				<View
					className={cn('border-t border-gray900', nearest ? 'mt-6' : 'mt-1')}
					style={{ marginHorizontal: HOME_SIDE_PADDING }}
				>
					{isLoading
						? Array.from({ length: SKELETON_ROWS }).map((_, i) => (
								<View
									key={i}
									className="flex-row items-center gap-3.5 border-b-[0.5px] border-gray300 py-3.5"
								>
									<SkeletonBox className="h-[14px] w-11 rounded-sm bg-gray300" />
									<SkeletonBox className="h-[14px] flex-1 rounded-sm bg-gray300" />
								</View>
							))
						: rows.map((row, i) => {
								const title = row.title.trim();
								const venue = row.venue.trim() || '장소 정보 없음';
								const statusLabel = getStatusLabel(row);
								const isLastCall = row.departure === 'last-call';
								return (
									<FadeInView key={row.id} delay={i * ROW_STAGGER_MS}>
										<ScalePressable
											onPress={() => onPress(row.id)}
											accessibilityRole="button"
											accessibilityLabel={`${title}, ${venue}, ${row.boardDate}, ${statusLabel}`}
											className="w-full flex-row items-baseline gap-3.5 border-b-[0.5px] border-gray300 py-3.5"
										>
											<View className="flex-row items-baseline gap-3.5 ">
												<Text
													className={cn('w-11 text-[13px] font-pretendard-semibold', {
														'text-brand': isLastCall,
														'text-gray900': row.departure === 'boarding',
														'text-gray600': row.departure === 'on-time',
													})}
												>
													{row.boardDate}
												</Text>
												<View className="flex-1">
													<Text
														numberOfLines={1}
														className="text-gray900 text-[14.5px] font-pretendard-medium"
													>
														{title}
													</Text>
													<Text
														numberOfLines={1}
														className="mt-0.5 text-gray600 text-[11px] font-pretendard-regular"
													>
														{venue}
													</Text>
												</View>
											</View>
										</ScalePressable>
									</FadeInView>
								);
							})}
				</View>

				<Pressable
					onPress={() => router.push({ pathname: '/search', params: { closing: '1' } })}
					hitSlop={8}
					accessibilityRole="button"
					accessibilityLabel="곧 막을 내리는 전시 전체 보기"
					className="mt-3 flex-row items-center self-start ml-6"
					style={({ pressed }) => ({
						marginRight: HOME_SIDE_PADDING,
						opacity: pressed ? 0.6 : 1,
					})}
				>
					<Text className="mr-0.5 text-gray700 text-[13px] font-pretendard-medium">전체 보기</Text>
					<Ionicons name="chevron-forward" size={14} className="text-gray700" />
				</Pressable>
			</View>
		)
	);
}
