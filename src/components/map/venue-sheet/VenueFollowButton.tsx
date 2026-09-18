import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable } from 'react-native';

interface VenueFollowButtonProps {
	venueName: string;
	isFollowed: boolean;
	isLoading: boolean;
	isSupported: boolean;
	onPress: () => void;
}

export function VenueFollowButton({
	venueName,
	isFollowed,
	isLoading,
	isSupported,
	onPress,
}: VenueFollowButtonProps) {
	const isDisabled = !isSupported || isLoading;
	const accessibilityLabel = isFollowed
		? `${venueName} 새 전시 알림 받는 중`
		: `${venueName} 새 전시 알림 받기`;
	const accessibilityHint = !isSupported
		? '이 장소는 아직 새 전시 알림을 지원하지 않습니다'
		: isFollowed
			? '두 번 탭하면 새 전시 알림을 해제합니다'
			: '두 번 탭하면 새 전시 알림을 신청합니다';

	return (
		<Pressable
			disabled={isDisabled}
			onPress={onPress}
			style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
			className="w-11 h-11 shrink-0 items-center justify-center rounded-full bg-gray200"
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			accessibilityHint={accessibilityHint}
			accessibilityState={{ checked: isFollowed, disabled: isDisabled, busy: isLoading }}
		>
			{isLoading ? (
				<ActivityIndicator size="small" className="text-gray700" />
			) : (
				<Ionicons
					name={isFollowed ? 'heart' : 'heart-outline'}
					size={22}
					className={
						isSupported ? (isFollowed ? 'text-primary-dark' : 'text-gray700') : 'text-gray400'
					}
				/>
			)}
		</Pressable>
	);
}
