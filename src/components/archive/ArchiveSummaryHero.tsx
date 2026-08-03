import { Text, View } from 'react-native';

import { ARCHIVE_INK, ARCHIVE_MUTED } from '@/src/components/archive/archivePalette';
import type { ArchiveStats } from '@/src/hooks/useArchiveStats';

interface ArchiveSummaryHeroProps {
	stats: ArchiveStats;
}

function StatPill({ label, value }: { label: string; value: number }) {
	return (
		<View className='flex-row items-baseline gap-1.5 rounded-full border border-[#E7E5E4] bg-white px-3.5 py-2'>
			<Text className='text-[13px]' style={{ fontFamily: 'Pretendard-Medium', color: ARCHIVE_MUTED }}>
				{label}
			</Text>
			<Text className='text-[15px]' style={{ fontFamily: 'Pretendard-SemiBold', color: ARCHIVE_INK }}>
				{value}
			</Text>
		</View>
	);
}

/** 아카이브 상단 — Explore hero와 다른 ledger 헤더 (그라데이션 카드 없음) */
export function ArchiveSummaryHero({ stats }: ArchiveSummaryHeroProps) {
	return (
		<View className='mb-5'>
			<Text
				className='text-[26px] leading-[32px]'
				style={{ fontFamily: 'Hahmlet_700Bold', color: ARCHIVE_INK }}
			>
				관람 기록
			</Text>
			<Text
				className='text-[14px] mt-2 leading-[21px]'
				style={{ fontFamily: 'Pretendard-Regular', color: ARCHIVE_MUTED }}
			>
				달력에서 날짜를 눌러 그날의 일기를 열어요
			</Text>
		</View>
	);
}
