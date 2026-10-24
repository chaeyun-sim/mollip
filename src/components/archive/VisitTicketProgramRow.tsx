import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector, type GestureType } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import type { ListenedItem } from '@/src/store/visitStore';

interface VisitTicketProgramRowProps {
	index: number;
	item: ListenedItem;
	onPress?: () => void;
	/** 티켓 플립 제스처 — 재생 탭이 뒤집기와 같이 먹지 않게 막는다 */
	blockGestures?: GestureType[];
}

export function VisitTicketProgramRow({
	index,
	item,
	onPress,
	blockGestures,
}: VisitTicketProgramRowProps) {
	const label = onPress
		? `${index + 1}번, ${item.title}, 해설 듣기`
		: `${index + 1}번, ${item.title}`;

	const playTap = useMemo(() => {
		if (!onPress) return null;
		const tap = Gesture.Tap().onEnd(() => {
			scheduleOnRN(onPress);
		});
		if (blockGestures && blockGestures.length > 0) {
			tap.blocksExternalGesture(...blockGestures);
		}
		return tap;
	}, [blockGestures, onPress]);

	const body = (
		<>
			<Text className="w-6 text-[13px] font-pretendard-medium text-gray500">{index + 1}</Text>
			<Text
				className="flex-1 text-[14px] leading-[19px] font-pretendard-semibold text-gray900"
				numberOfLines={2}
			>
				{item.title}
			</Text>
			{onPress && <Ionicons name="play-circle-outline" size={22} className="text-gray700" />}
		</>
	);

	if (!onPress || !playTap) {
		return (
			<View
				className="flex-row items-center py-3 border-b border-[#F5F5F4]"
				accessibilityLabel={label}
			>
				{body}
			</View>
		);
	}

	return (
		<GestureDetector gesture={playTap}>
			<View
				accessibilityRole="button"
				accessibilityLabel={label}
				className="flex-row items-center py-3 border-b border-[#F5F5F4]"
			>
				{body}
			</View>
		</GestureDetector>
	);
}
