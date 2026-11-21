import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { cn } from '@/src/lib/cn';
import { parseNoticeMarkdown } from '@/src/utils/noticeMarkdown';

interface NoticeBodyProps {
	body: string;
}

/** 공지 본문 — 소제목·목록·문단·굵게만 지원하는 마크다운 subset을 그린다 */
export function NoticeBody({ body }: NoticeBodyProps) {
	const blocks = useMemo(() => parseNoticeMarkdown(body), [body]);

	// 소제목 앞은 넓게, 소제목 바로 뒤·연속 목록은 좁게 띄운다
	const spacingFor = (index: number) => {
		const block = blocks[index];
		const previous = blocks[index - 1];
		if (!previous) return '';
		if (block.type === 'heading') return 'mt-6';
		if (previous.type === 'heading') return 'mt-2';
		if (block.type === 'bullet' && previous.type === 'bullet') return 'mt-1';
		return 'mt-4';
	};

	return (
		<View>
			{blocks.map((block, index) => {
				const spacing = spacingFor(index);
				const content = block.inlines.map((inline, inlineIndex) => (
					<Text
						key={inlineIndex}
						className={cn({ 'font-pretendard-semibold text-gray900': inline.bold })}
					>
						{inline.text}
					</Text>
				));

				return block.type === 'bullet' ? (
					<View key={index} className={cn('flex-row', spacing)}>
						<Text className="w-4 font-pretendard-regular text-[15px] leading-[24px] text-gray700">
							•
						</Text>
						<Text className="flex-1 font-pretendard-regular text-[15px] leading-[24px] text-gray700">
							{content}
						</Text>
					</View>
				) : (
					<Text
						key={index}
						accessibilityRole={block.type === 'heading' ? 'header' : undefined}
						className={cn(
							block.type === 'heading'
								? 'font-pretendard-semibold text-base leading-[24px] text-gray900'
								: 'font-pretendard-regular text-[15px] leading-[24px] text-gray700',
							spacing,
						)}
					>
						{content}
					</Text>
				);
			})}
		</View>
	);
}
