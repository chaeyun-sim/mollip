import { View } from 'react-native';
import { SkeletonBox } from '@/src/components/layout/Loading/SkeletonBox';

interface RouteCandidateCardSkeletonProps {
	/** 아코디언 펼침 상태를 흉내낸 타임라인 표시 여부 (첫 카드만 펼쳐진 모습으로 보여준다) */
	expanded?: boolean;
}

/** RouteCandidateCard + RouteTimeline 형태를 흉내 낸 경로 후보 로딩 스켈레톤. */
export function RouteCandidateCardSkeleton({ expanded = false }: RouteCandidateCardSkeletonProps) {
	return (
		<View className="rounded-[22px] bg-white border border-[rgba(28,25,23,0.06)] overflow-hidden px-4 py-4">
			{/* RouteSummaryHeader 자리 — 아이콘 + 시간 + 거리 */}
			<View className="flex-row items-center gap-2.5">
				<SkeletonBox className="w-9 h-9 rounded-full bg-[#E0DCD5]" />
				<View className="flex-1 gap-1.5">
					<SkeletonBox className="h-[15px] rounded-md bg-[#E0DCD5]" style={{ width: '40%' }} />
					<SkeletonBox className="h-3 rounded-md bg-[#E0DCD5]" style={{ width: '60%' }} />
				</View>
			</View>

			{expanded && (
				<View className="mt-4 pt-4 border-t border-black/[0.06] gap-3">
					{[0, 1, 2].map((row) => (
						<View key={row} className="flex-row items-center gap-3">
							<SkeletonBox className="w-[22px] h-[22px] rounded-full bg-[#E0DCD5]" />
							<View className="flex-1 gap-1">
								<SkeletonBox
									className="h-[13px] rounded-md bg-[#E0DCD5]"
									style={{ width: row === 1 ? '75%' : '55%' }}
								/>
								<SkeletonBox className="h-[11px] rounded-md bg-[#E0DCD5]" style={{ width: '40%' }} />
							</View>
						</View>
					))}
				</View>
			)}
		</View>
	);
}
