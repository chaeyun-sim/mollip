import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { DownloadStatus } from '@/src/store/offlineDownloadStore';

interface DownloadStatusBadgeProps {
	status: DownloadStatus;
	/** 실패 배지 탭 시 호출 — 실제 재시도 로직은 AC-4 범위라 아직 시각 표시만 담당한다. */
	onRetry?: () => void;
}

const ACCESSIBILITY_LABEL: Record<Exclude<DownloadStatus, 'idle'>, string> = {
	loading: '다운로드 중',
	done: '다운로드 완료, 오프라인 재생 가능',
	failed: '다운로드 실패, 탭해서 재시도',
};

/**
 * 썸네일 우상단에 겹쳐 표시하는 항목별 다운로드 상태 배지(AC-3).
 * 02-design-brief.md States — idle은 배지를 렌더하지 않는다.
 * 호출부는 반드시 `ImageFallback`을 감싸는 `relative` 부모 View의 형제로 이 컴포넌트를 배치해야 한다
 * (`ImageFallback`의 루트 View가 `overflow-hidden` 고정이라 children으로 넘기면 클리핑된다, iteration 3 Blocker 1).
 */
export function DownloadStatusBadge({ status, onRetry }: DownloadStatusBadgeProps) {
	if (status === 'idle') return null;

	if (status === 'loading') {
		return (
			<View
				className="absolute -top-1 -right-1 w-[28px] h-[28px] rounded-full bg-gray900 items-center justify-center"
				accessibilityLabel={ACCESSIBILITY_LABEL.loading}
				accessibilityRole="image"
			>
				<ActivityIndicator size="small" className="text-gray500" />
			</View>
		);
	}

	if (status === 'failed') {
		return (
			<Pressable
				className="absolute -top-1 -right-1 w-[22px] h-[22px] rounded-full bg-gray900 items-center justify-center"
				onPress={onRetry}
				hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
				accessibilityRole="button"
				accessibilityLabel={ACCESSIBILITY_LABEL.failed}
			>
				<Ionicons name="alert-circle" size={12} className="text-error" />
			</Pressable>
		);
	}

	return (
		<View
			className="absolute -top-1 -right-1 w-[22px] h-[22px] rounded-full bg-gray900 items-center justify-center"
			accessibilityLabel={ACCESSIBILITY_LABEL.done}
			accessibilityRole="image"
		>
			<Ionicons name="checkmark-circle" size={12} className="text-success" />
		</View>
	);
}
