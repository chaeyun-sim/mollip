import { View } from 'react-native';
import { colors } from '@/src/constants/colors';

interface SettingsCardProps {
	children: React.ReactNode;
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
