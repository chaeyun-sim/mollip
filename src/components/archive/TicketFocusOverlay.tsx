import { useCallback, useEffect, useMemo } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import { VisitTicket } from '@/src/components/archive/VisitTicket';
import { useExhibitionDetail } from '@/src/hooks/useExhibitionDetail';
import { useImmersiveStore } from '@/src/store/immersiveStore';
import { useVisitStore, type ListenedItem } from '@/src/store/visitStore';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

function makeDateLabel(dateKey: string): string {
	const [y, m, d] = dateKey.split('-').map(Number);
	const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
	return `${y}.${m}.${d} ${weekday}요일`;
}

interface TicketFocusOverlayProps {
	dateKey: string | null;
	onClose: () => void;
}

/** 티켓 그리드에서 탭 시 나타나는 포커스 오버레이. VisitTicket(플립 가능)을 중앙에 표시. */
export function TicketFocusOverlay({ dateKey, onClose }: TicketFocusOverlayProps) {
	const visible = dateKey !== null;

	// 애니메이션: 등장 시 scale 0.82 → 1, opacity 0 → 1
	const scale = useSharedValue(0.82);
	const opacity = useSharedValue(0);

	useEffect(() => {
		if (visible) {
			scale.value = withTiming(1, {
				duration: 480,
				easing: Easing.out(Easing.cubic),
			});
			opacity.value = withTiming(1, { duration: 380 });
		} else {
			scale.value = 0.82;
			opacity.value = 0;
		}
	}, [visible, scale, opacity]);

	const cardStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
		opacity: opacity.value,
	}));

	// 데이터 로딩 — dateKey가 없으면 훅은 idle 상태
	const visit = useVisitStore((s) => (dateKey ? s.visits[dateKey] : undefined));
	const setVisitMemo = useVisitStore((s) => s.setVisitMemo);
	const playlist = useImmersiveStore((s) => s.playlist);
	const { exhibition: visitExhibition } = useExhibitionDetail(visit?.exhibitionId ?? undefined);

	const exhibition = useMemo(
		() =>
			visitExhibition ?? {
				id: visit?.exhibitionId ?? 'placeholder',
				title: visit?.exhibitionTitle ?? '관람 기록',
				venue: visit?.venue ?? '',
				startDate: '',
				endDate: '',
				description: '',
				posterColor: '#E8E4DC',
				genre: '전시',
				openHours: '',
				admission: '',
				artworks: [],
			},
		[visitExhibition, visit],
	);

	const listenedItems = useMemo((): ListenedItem[] => {
		if (visit?.listened && visit.listened.length > 0) return visit.listened;
		return playlist.map((p) => ({ title: p.title, imageUrl: p.imageUrl }));
	}, [visit?.listened, playlist]);

	const listenedTitles = useMemo(() => listenedItems.map((l) => l.title), [listenedItems]);
	const memo = visit?.memo ?? '';
	const dateLabel = dateKey ? makeDateLabel(dateKey) : '';

	const handleMemoChange = useCallback(
		(text: string) => {
			if (dateKey) setVisitMemo(dateKey, text);
		},
		[dateKey, setVisitMemo],
	);

	if (!dateKey) return null;

	return (
		<Modal
			visible={visible}
			transparent
			animationType='fade'
			statusBarTranslucent
			onRequestClose={onClose}
		>
			{/* 딤 배경 — 탭 시 닫기 */}
			<Pressable
				style={{ flex: 1, backgroundColor: 'rgba(8,6,5,0.88)' }}
				onPress={onClose}
				accessibilityLabel='오버레이 닫기'
				accessibilityRole='button'
			>
				{/* 닫기 버튼 */}
				<View
					className='flex-row items-center justify-between px-5'
					style={{ paddingTop: 56, paddingBottom: 12 }}
				>
					<Text className='font-pretendard-semibold text-[15px] text-[rgba(255,255,255,0.85)]'>
						{dateLabel}
					</Text>
					<Pressable
						onPress={onClose}
						hitSlop={12}
						accessibilityLabel='닫기'
						accessibilityRole='button'
						style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
					>
						<Text className='font-pretendard-regular text-[14px] text-[rgba(255,255,255,0.6)]'>
							닫기 ✕
						</Text>
					</Pressable>
				</View>

				{/* 티켓 카드 — 탭이 카드 내부에서는 닫히지 않도록 stopPropagation */}
				<Animated.View style={[{ flex: 1 }, cardStyle]}>
					<Pressable onPress={(e) => e.stopPropagation()} style={{ flex: 1 }}>
						<ScrollView
							contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48 }}
							showsVerticalScrollIndicator={false}
						>
							<VisitTicket
								exhibition={exhibition}
								listenedTitles={listenedTitles}
								listenedItems={listenedItems}
								dateKey={dateKey}
								dateLabel={dateLabel}
							/>
						</ScrollView>
					</Pressable>
				</Animated.View>
			</Pressable>
		</Modal>
	);
}
