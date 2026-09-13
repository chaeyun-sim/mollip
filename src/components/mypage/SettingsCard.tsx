import { View } from 'react-native';
import { colors } from '@/src/constants/colors';
import { ReactNode } from 'react';

interface SettingsCardProps {
	children: ReactNode;
}

export function SettingsCard({ children }: SettingsCardProps) {
	return (
		<View
			className="overflow-hidden"
			style={{
				shadowColor: colors.gray900,
				shadowOpacity: 0.06,
				shadowRadius: 10,
				shadowOffset: { width: 0, height: 2 },
				elevation: 2,
			}}
		>
			{children}
		</View>
	);
}
