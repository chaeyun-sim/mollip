import { Switch, Text, View } from 'react-native';

import { colors } from '@/src/constants/colors';

export interface NotificationPreferenceRowProps {
	label: string;
	value: boolean;
	onValueChange: (value: boolean) => void;
	disabled?: boolean;
}

export function NotificationPreferenceRow({
	label,
	value,
	onValueChange,
	disabled = false,
}: NotificationPreferenceRowProps) {
	return (
		<View className="min-h-16 flex-row items-center justify-between py-3">
			<Text className="flex-1 pr-3 font-pretendard-medium text-gray900 text-base">{label}</Text>
			<Switch
				value={value}
				onValueChange={onValueChange}
				disabled={disabled}
				trackColor={{ false: colors.divider, true: colors.gray900 }}
				thumbColor="#FFFFFF"
				ios_backgroundColor={colors.divider}
				style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
				accessibilityLabel={label}
				accessibilityRole="switch"
				accessibilityState={{ checked: value, disabled }}
				className="mt-[5px]"
			/>
		</View>
	);
}
