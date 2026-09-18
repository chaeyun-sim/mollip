import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

interface CircleActionButtonProps {
	icon: keyof typeof Ionicons.glyphMap;
	label: string;
	onPress: () => void;
}

/** 전시 상세 히어로 위에 떠있는 원형 아이콘 버튼 — 뒤로가기·공유·루트 보기 등. */
export function CircleActionButton({ icon, label, onPress }: CircleActionButtonProps) {
	return (
		<Pressable
			onPress={onPress}
			hitSlop={8}
			style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
			className="w-11 h-11 rounded-full bg-gray900/30 items-center justify-center shadow-black elevation-sm"
			accessibilityRole="button"
			accessibilityLabel={label}
		>
			<Ionicons name={icon} size={21} color="#FFFFFF" />
		</Pressable>
	);
}
