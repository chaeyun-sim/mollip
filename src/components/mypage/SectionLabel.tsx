import { Text } from 'react-native';

interface SectionLabelProps {
	children: string;
}

export function SectionLabel({ children }: SectionLabelProps) {
	return (
		<Text className="font-pretendard-semibold text-[#9C9288] text-[11px] uppercase tracking-[1.4]">
			{children}
		</Text>
	);
}
