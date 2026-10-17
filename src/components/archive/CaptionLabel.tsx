import { Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';

interface CaptionLabelProps {
	title: string;
	venue?: string;
	/** "10.09" 형식 */
	dateLabel: string;
	memo?: string;
	className?: string;
}

/** 미술관 작품 캡션 라벨 — 전시명 · 장소와 날짜 · 한 줄 감상 */
export function CaptionLabel({ title, venue, dateLabel, memo, className }: CaptionLabelProps) {
	return (
		<View className={cn('gap-0.5', className)}>
			<Text numberOfLines={1} className="text-center font-hahmlet-semibold text-[13px] text-ink">
				{title}
			</Text>
			<Text
				numberOfLines={1}
				className="mt-1 text-center font-pretendard-regular text-[11px] text-gray600"
			>
				{venue ? `${venue} · ` : ''}
				<Text className="text-editorial">{dateLabel}</Text>
			</Text>
			{/* {memo && (
				<Text
					numberOfLines={2}
					className="mt-1 font-pretendard-regular text-[12px] leading-[17px] text-gray700"
				>
					{memo}
				</Text>
			)} */}
		</View>
	);
}
