import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import { EmptyImagePlaceholder } from '@/src/components/common/EmptyImagePlaceholder';
import { ExploreSectionTitle } from '@/src/components/explore/ExploreHomeSections';
import {
	archiveTintForKey,
	ARCHIVE_INK,
	ARCHIVE_MUTED,
	ARCHIVE_SUBTLE,
} from '@/src/components/archive/archivePalette';
import { useVisitStore } from '@/src/store/visitStore';

interface ArchiveRecentVisitsProps {
	dateKeys: string[];
	onSelectDate: (dateKey: string) => void;
}

function formatDateLine(dateKey: string): {
	primary: string;
	secondary: string;
} {
	const [y, m, d] = dateKey.split('-').map(Number);
	const date = new Date(y, m - 1, d);
	const today = new Date();
	const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);
	const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

	if (dateKey === todayKey)
		return { primary: '오늘', secondary: `${y}년 ${m}월 ${d}일` };
	if (dateKey === yesterdayKey)
		return { primary: '어제', secondary: `${y}년 ${m}월 ${d}일` };
	const weekdays = ['일', '월', '화', '수', '목', '금', '토'] as const;
	return {
		primary: `${m}월 ${d}일`,
		secondary: `${weekdays[date.getDay()]}요일`,
	};
}

export function ArchiveRecentVisits({
	dateKeys,
	onSelectDate,
}: ArchiveRecentVisitsProps) {
	const visits = useVisitStore((s) => s.visits);

	if (dateKeys.length === 0) return null;

	return (
		<View className='mb-5'>
			<ExploreSectionTitle eyebrow='RECENT' title='최근 관람' />

			<View className='rounded-[22px] bg-[#F8F6F2] overflow-hidden'>
				{dateKeys.map((dateKey, index) => {
					const visit = visits[dateKey];
					const title = visit?.exhibitionTitle?.trim() || '관람 기록';
					const imageUrl = visit?.listened.find((l) => l.imageUrl)?.imageUrl;
					const tint = archiveTintForKey(dateKey);
					const { primary, secondary } = formatDateLine(dateKey);
					const isLast = index === dateKeys.length - 1;
					const listenedCount = visit?.listened.length ?? 0;

					return (
						<Pressable
							key={dateKey}
							onPress={() => onSelectDate(dateKey)}
							accessibilityRole='button'
							accessibilityLabel={`${dateKey} ${title} 관람 기록`}
							className='flex-row items-center px-4 py-3.5'
							style={({ pressed }) => ({
								opacity: pressed ? 0.88 : 1,
								borderBottomWidth: isLast ? 0 : 1,
								borderBottomColor: 'rgba(231, 229, 228, 0.85)',
							})}
						>
							<View
								className='overflow-hidden mr-3.5 w-[52px] h-[52px] rounded-[14px]'
								style={{ backgroundColor: tint }}
							>
								{imageUrl ? (
									<Image
										source={{ uri: imageUrl }}
										resizeMode='cover'
										style={{ width: 52, height: 52 }}
									/>
								) : (
									<EmptyImagePlaceholder
										className='items-center justify-center'
										style={{ width: 52, height: 52 }}
										iconSize={22}
									/>
								)}
							</View>

							<View className='flex-1 min-w-0'>
								<View className='flex-row items-baseline gap-2 mb-0.5'>
									<Text
										className='text-[15px] font-pretendard-semibold'
										style={{ color: ARCHIVE_INK }}
									>
										{primary}
									</Text>
									<Text
										className='text-[12px] font-pretendard-regular'
										style={{ color: ARCHIVE_SUBTLE }}
									>
										{secondary}
									</Text>
								</View>
								<Text
									className='text-[14px] leading-[19px] font-pretendard-medium'
									numberOfLines={1}
									style={{ color: ARCHIVE_INK }}
								>
									{title}
								</Text>
								{listenedCount > 0 ? (
									<Text
										className='text-[12px] mt-1 font-pretendard-regular'
										style={{ color: ARCHIVE_MUTED }}
									>
										들은 작품 {listenedCount}개
									</Text>
								) : null}
							</View>

							<Ionicons name='chevron-forward' size={18} color='#D6D3D1' />
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}
