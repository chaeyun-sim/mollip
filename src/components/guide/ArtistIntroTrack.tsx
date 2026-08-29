import { useEffect, useRef } from 'react';
import {
	AccessibilityInfo,
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ImageFallback } from '@/src/components/common/ImageFallback';
import { colors } from '@/src/constants/colors';
import { cn } from '@/src/lib/cn';

export type ArtistIntroTrackStatus = 'loading' | 'ready' | 'failed';

const SUBTITLE: Record<ArtistIntroTrackStatus, string> = {
	loading: '해설을 준비하고 있어요',
	ready: '작가의 시선으로 전시 보기',
	failed: '해설을 불러오지 못했어요 · 탭해서 다시 시도',
};

interface ArtistIntroTrackProps {
	artist: string;
	imageUrl: string | undefined;
	status: ArtistIntroTrackStatus;
	onPress: () => void;
}

/** 몰입 모드 재생목록 최상단에 고정되는 작가 소개 인트로 트랙 (대기/활성/실패 3상태). */
export function ArtistIntroTrack({ artist, imageUrl, status, onPress }: ArtistIntroTrackProps) {
	const prevStatusRef = useRef(status);

	// 생성 완료는 우측 컨트롤 스왑으로만 드러나므로, 보조기술 사용자에게는 별도로 알린다.
	useEffect(() => {
		if (prevStatusRef.current === 'loading' && status === 'ready') {
			AccessibilityInfo.announceForAccessibility('작가 소개 해설이 준비됐어요');
		}

		prevStatusRef.current = status;
	}, [status]);

	const isLoading = status === 'loading';
	const isFailed = status === 'failed';
	const accessibilityLabel = resolveAccessibilityLabel();

	function resolveAccessibilityLabel() {
		if (isLoading) return '작가 소개 해설 준비 중';

		if (isFailed) return '작가 소개 해설 다시 생성';

		return `작가 소개 재생, ${artist}`;
	}

	// 세 상태 모두 26×26 슬롯을 유지해 전환 시 레이아웃 시프트가 없다.
	function renderControl() {
		if (isLoading) {
			return <ActivityIndicator size="small" color={colors.gray500} />;
		}

		return (
			<Ionicons
				name={isFailed ? 'refresh-outline' : 'play-circle-outline'}
				size={26}
				className={cn(isFailed ? 'text-gray600' : 'text-primary')}
			/>
		);
	}

	return (
		<View>
			<Pressable
				className="flex-row items-center gap-4 rounded-2xl bg-white/6 px-3 py-4"
				onPress={onPress}
				disabled={isLoading}
				accessibilityRole="button"
				accessibilityLabel={accessibilityLabel}
				accessibilityHint={status === 'ready' ? '작가 소개 해설 화면으로 이동해요' : undefined}
				accessibilityState={{ disabled: isLoading, busy: isLoading }}
				style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
			>
				<ImageFallback
					heroImageUri={imageUrl}
					className={cn('w-14 h-14 rounded-[10px]', isLoading && 'opacity-60')}
					iconSize={22}
					resizeMode="cover"
				/>
				<View className="flex-1 gap-1">
					<View className="flex-row">
						<View className="flex-row items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5">
							<Ionicons name="person-outline" size={12} className="text-primary" />
							<Text className="text-[11px] font-pretendard-semibold text-primary">작가 소개</Text>
						</View>
					</View>
					<Text
						className={cn(
							'font-pretendard-semibold text-on-dark text-[15px]',
							isLoading && 'opacity-60',
						)}
						numberOfLines={1}
					>
						{artist}
					</Text>
					<Text
						className={cn(
							'font-pretendard-regular text-[13px]',
							isFailed ? 'text-error' : 'text-gray600',
						)}
						numberOfLines={1}
					>
						{SUBTITLE[status]}
					</Text>
				</View>
				<View className="w-[26px] h-[26px] items-center justify-center">{renderControl()}</View>
			</Pressable>
			<View
				className="mt-3 border-b-white/6"
				style={{ borderBottomWidth: StyleSheet.hairlineWidth }}
			/>
		</View>
	);
}
