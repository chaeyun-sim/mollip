import { Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { cn } from '@/src/lib/cn';
import { formatClockTime } from '@/src/utils/formatDate';

export const STUB_HEIGHT = 130;
/** 절취선 행(노치 20 + 점선) — 앞·뒤 동일 Y 고정용 */
export const PERFORATION_HEIGHT = 24;

interface PerforationProps {
	/** 노치 색 — 티켓 스텁(어두운 배경)은 검정, 흰 카드(영수증 등)는 페이지 배경색을 줘서 "펀치 구멍"처럼 보이게 한다 */
	notchColor?: string;
}

// 절취선: 양옆 노치 + 점선 (ReceiptSummary 등에서도 재사용)
export function Perforation({ notchColor = '#110F0E' }: PerforationProps) {
	return (
		<View className="flex-row items-center" style={{ height: PERFORATION_HEIGHT }}>
			<View
				className="rounded-full w-[20px] h-[20px] ml-[-10px]"
				style={{ backgroundColor: notchColor }}
			/>
			<View className="mx-2 flex-1 border-b-[1.5px] border-dashed border-divider" />
			<View
				className="rounded-full w-[20px] h-[20px] mr-[-10px]"
				style={{ backgroundColor: notchColor }}
			/>
		</View>
	);
}

interface VisitTicketFooterProps {
	variant: 'front' | 'back';
	bars: number[];
	ticketNo: string;
	signatureSvg?: string;
	visitedAt?: { start: string; end: string };
}

/** 절취선 + 티켓 스텁(앞면: 바코드+서명+도장, 뒷면: MUSEUM TICKET 라벨+관람 시간) */
export function VisitTicketFooter({
	variant,
	bars,
	ticketNo,
	signatureSvg,
	visitedAt,
}: VisitTicketFooterProps) {
	return (
		<>
			<Perforation />
			<View className="flex-row items-center justify-between px-6" style={{ height: STUB_HEIGHT }}>
				<View>
					<View className="flex-row items-end" accessibilityLabel="장식용 바코드">
						{bars.map((w, i) => (
							<View
								key={i}
								className={cn('mr-0.5 bg-gray900', i % 4 === 0 ? 'h-[30px]' : 'h-[24px]')}
								style={{ width: w }}
							/>
						))}
					</View>
					<Text className="mt-1.5 text-[10px] tracking-[4px] text-gray600 font-pretendard-medium">
						{ticketNo}
					</Text>
				</View>
				{variant === 'front' ? (
					<View className="relative items-center justify-center">
						{signatureSvg && (
							<View
								className="items-center justify-center ml-6"
								style={{ opacity: 0.8, transform: [{ rotate: '-8deg' }] }}
								pointerEvents="none"
							>
								<SvgXml xml={signatureSvg} width={170} height={80} />
							</View>
						)}
					</View>
				) : (
					<View className="relative items-center justify-center">
						{visitedAt && (
							<Text className="text-center text-[11px] text-gray500 font-pretendard-medium">
								{formatClockTime(visitedAt.start)} - {formatClockTime(visitedAt.end)} 관람
							</Text>
						)}
					</View>
				)}
			</View>
		</>
	);
}
