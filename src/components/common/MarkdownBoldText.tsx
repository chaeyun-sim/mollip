import { Text } from 'react-native';

interface MarkdownBoldTextProps {
	text: string;
	style: object;
	className: string;
}

/** `**bold**` 구간만 SemiBold로 렌더 */
export function MarkdownBoldText({ text, style, className }: MarkdownBoldTextProps) {
	const parts = text.split(/\*\*(.+?)\*\*/g);
	return (
		<Text style={style} className={className}>
			{parts.map((part, i) =>
				i % 2 === 1 ? (
					<Text key={i} style={{ fontFamily: 'Pretendard-SemiBold' }}>
						{part}
					</Text>
				) : (
					part
				),
			)}
		</Text>
	);
}
