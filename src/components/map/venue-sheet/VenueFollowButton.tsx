import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
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
	const { t } = useTranslation();

	const isDisabled = !isSupported || isLoading;
	const accessibilityLabel = isFollowed
		? t('map.venue.follow_on_a11y', { name: venueName })
		: t('map.venue.follow_off_a11y', { name: venueName });
	const accessibilityHint = !isSupported
		? t('map.venue.follow_unsupported_hint')
		: isFollowed
			? t('map.venue.follow_on_hint')
			: t('map.venue.follow_off_hint');

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
					className={isSupported ? (isFollowed ? 'text-brand' : 'text-gray700') : 'text-gray400'}
				/>
			)}
		</Pressable>
	);
}
