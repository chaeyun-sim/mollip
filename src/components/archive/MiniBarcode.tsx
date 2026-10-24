import { useMemo } from 'react';
import { View } from 'react-native';

interface MiniBarcodeProps {
	dateKey: string;
	color: string;
	length?: number;
}

export function MiniBarcode({ dateKey, color, length = 48 }: MiniBarcodeProps) {
	const widths = useMemo(() => {
		const seed = dateKey.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
		return Array.from({ length }, (_, i) => ((seed + i * 7) % 3) + 1);
	}, [dateKey, length]);

	return (
		<View className="flex-row items-end gap-[1px]">
			{widths.map((w, i) => (
				<View key={i} className="h-[72px]" style={{ width: w, backgroundColor: color }} />
			))}
		</View>
	);
}
