import { Text, View } from 'react-native';
import { colors } from '@/src/constants/colors';

interface SettingsSectionProps {
	title: string;
	children: React.ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
	return (
		<View className='mb-6'>
			<Text className='text-[12px] mb-2 px-1 font-pretendard-semibold text-gray-400 tracking-[0.8]'>
				{title.toUpperCase()}
			</Text>
			<View
				className='rounded-3xl overflow-hidden bg-bg-tonal'
				style={{
					shadowColor: colors.primary,
					shadowOpacity: 0.05,
					shadowRadius: 12,
					shadowOffset: { width: 0, height: 4 },
					elevation: 2,
				}}
			>
				{children}
			</View>
		</View>
	);
}
