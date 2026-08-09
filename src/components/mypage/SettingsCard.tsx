import { View } from 'react-native';

interface SettingsCardProps {
	children: React.ReactNode;
}

export function SettingsCard({ children }: SettingsCardProps) {
	return (
		<View
			className='bg-white rounded-2xl overflow-hidden'
			style={{
				shadowColor: '#1C1917',
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
