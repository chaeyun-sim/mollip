import { Text, View } from 'react-native';
import type { ArchiveStats } from '@/src/hooks/useArchiveStats';

interface ArchiveSummaryHeroProps {
	stats: ArchiveStats;
}

function StatPill({ label, value }: { label: string; value: number }) {
	return (
		<View className="flex-row items-baseline gap-1.5 rounded-full border border-divider bg-white px-3.5 py-2">
			<Text className="text-[13px] font-pretendard-medium text-gray700">{label}</Text>
			<Text className="text-[15px] font-pretendard-semibold text-gray900">{value}</Text>
		</View>
	);
}

/** 아카이브 상단 — Explore hero와 다른 ledger 헤더 (그라데이션 카드 없음) */
export function ArchiveSummaryHero({ stats }: ArchiveSummaryHeroProps) {
	return (
		<View className="mb-5">
			<Text className="text-[26px] leading-[32px] font-hahmlet-bold text-gray900">관람 기록</Text>
			<Text className="text-[14px] mt-2 leading-[21px] font-pretendard-regular text-gray700">
				달력에서 날짜를 눌러 그날의 일기를 열어요
			</Text>
		</View>
	);
}
