import { Text } from 'react-native';

interface SectionLabelProps {
	children: string;
}

export function SectionLabel({ children }: SectionLabelProps) {
	return (
		<Text className="font-pretendard-semibold text-[#9C9288] mb-2 ml-1 text-[11px] uppercase tracking-[1.4]">
			{children}
		</Text>
	);
}
