import { Text, View } from 'react-native';

import {
	ARCHIVE_INK,
	ARCHIVE_MUTED,
} from '@/src/components/archive/archivePalette';
import type { ArchiveStats } from '@/src/hooks/useArchiveStats';

interface ArchiveSummaryHeroProps {
	stats: ArchiveStats;
}

function StatPill({ label, value }: { label: string; value: number }) {
	return (
		<View className='flex-row items-baseline gap-1.5 rounded-full border border-[#E7E5E4] bg-white px-3.5 py-2'>
			<Text
				className='text-[13px] font-pretendard-medium'
				style={{ color: ARCHIVE_MUTED }}
			>
				{label}
			</Text>
			<Text
				className='text-[15px] font-pretendard-semibold'
				style={{ color: ARCHIVE_INK }}
			>
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
				className='text-[26px] leading-[32px] font-hahmlet-bold'
				style={{ color: ARCHIVE_INK }}
			>
				관람 기록
			</Text>
			<Text
				className='text-[14px] mt-2 leading-[21px] font-pretendard-regular'
				style={{ color: ARCHIVE_MUTED }}
			>
				달력에서 날짜를 눌러 그날의 일기를 열어요
			</Text>
		</View>
	);
}
