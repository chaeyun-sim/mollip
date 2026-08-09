import { View } from 'react-native';

function miniBarWidths(dateKey: string): number[] {
	const seed = dateKey.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
	return Array.from({ length: 48 }, (_, i) => ((seed + i * 7) % 3) + 1);
}

interface MiniBarcodeProps {
	dateKey: string;
	color: string;
}

export function MiniBarcode({ dateKey, color }: MiniBarcodeProps) {
	const widths = miniBarWidths(dateKey);
	return (
		<View className='flex-row items-end gap-[1px]'>
			{widths.map((w, i) => (
				<View
					key={i}
					style={{ width: w, height: 22, backgroundColor: color }}
				/>
			))}
		</View>
	);
}
