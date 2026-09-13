import { Image, View, type ImageSourcePropType } from 'react-native';

interface DiaryStampCellProps {
	source?: ImageSourcePropType;
	color?: string;}

// 캘린더 날짜 셀을 가득 채우는 우표 스타일 썸네일 — 흰 프레임(우표 마진) + 톱니 느낌의 점선 테두리 + 살짝 랜덤 회전.
// VisitStamp(잉크 도장, 관람 완료 표시)와는 다른 컴포넌트 — 이름 혼동 주의.
export function DiaryStampCell({ source, color }: DiaryStampCellProps) {
	return (
		<View
			className="w-full h-full rounded-[2px] bg-white border border-dashed border-gray300 p-[3px]"
			style={{
				shadowColor: '#1C1917',
				shadowOpacity: 0.18,
				shadowRadius: 3,
				shadowOffset: { width: 0, height: 2 },
			}}
		>
			{source ? (
				<Image source={source} resizeMode="cover" className="flex-1 rounded-[1px]" />
			) : (
				<View className="flex-1 rounded-[1px]" style={{ backgroundColor: color }} />
			)}
		</View>
	);
}
