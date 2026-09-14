import { View } from 'react-native';
import { ReactNode } from 'react';

interface SettingsCardProps {
	children: ReactNode;
}

export function SettingsCard({ children }: SettingsCardProps) {
	return (
		<View
			className="overflow-hidden shadow-gray900 elevation-[2px]"
			style={{
				shadowOpacity: 0.06,
				shadowRadius: 10,
				shadowOffset: { width: 0, height: 2 },
			}}
		>
			{children}
		</View>
	);
}
