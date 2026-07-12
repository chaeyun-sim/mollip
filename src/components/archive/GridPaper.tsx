import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

interface GridPaperProps {
	cellSize?: number;
	lineColor?: string;
}

// 다이어리 속지의 모눈종이 패턴. 부모(View) 전체를 덮는 absolute 배경으로 사용한다.
export function GridPaper({
	cellSize = 14,
	lineColor = '#E5E0D3',
}: GridPaperProps) {
	return (
		<Svg
			style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
			width='100%'
			height='100%'
			pointerEvents='none'
		>
			<Defs>
				<Pattern
					id='diary-grid'
					width={cellSize}
					height={cellSize}
					patternUnits='userSpaceOnUse'
				>
					<Path
						d={`M ${cellSize} 0 L 0 0 0 ${cellSize}`}
						fill='none'
						stroke={lineColor}
						strokeWidth={0.8}
					/>
				</Pattern>
			</Defs>
			<Rect width='100%' height='100%' fill='url(#diary-grid)' />
		</Svg>
	);
}
