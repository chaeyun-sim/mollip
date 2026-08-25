import { Text, View } from 'react-native';

import { VisitStamp } from '@/src/components/archive/VisitStamp';
import { cn } from '@/src/lib/cn';

export const STUB_HEIGHT = 112;
/** 절취선 행(노치 20 + 점선) — 앞·뒤 동일 Y 고정용 */
export const PERFORATION_HEIGHT = 24;

// 절취선: 양옆 노치 + 점선
function Perforation() {
	return (
		<View className="flex-row items-center" style={{ height: PERFORATION_HEIGHT }}>
			<View className="rounded-full w-[20px] h-[20px] ml-[-10px] bg-[#110F0E]" />
			<View className="mx-2 flex-1 border-b-[1.5px] border-dashed border-divider" />
			<View className="rounded-full w-[20px] h-[20px] mr-[-10px] bg-[#110F0E]" />
		</View>
	);
}

interface TicketStubFrontProps {
	bars: number[];
	ticketNo: string;
}

function TicketStubFront({ bars, ticketNo }: TicketStubFrontProps) {
	return (
		<View className="flex-row items-center justify-between px-6" style={{ height: STUB_HEIGHT }}>
			<View>
				<View className="flex-row items-end" accessibilityLabel="장식용 바코드">
					{bars.map((w, i) => (
						<View
							key={i}
							className={cn('mr-0.5 bg-primary', i % 4 === 0 ? 'h-[30px]' : 'h-[24px]')}
							style={{ width: w }}
						/>
					))}
				</View>
				<Text className="mt-1.5 text-[10px] tracking-[4px] text-tertiary font-pretendard-medium">
					{ticketNo}
				</Text>
			</View>
			<VisitStamp />
		</View>
	);
}

interface TicketStubBackProps {
	ticketNo: string;
}

function TicketStubBack({ ticketNo }: TicketStubBackProps) {
	return (
		<View className="flex-row items-center justify-between px-6" style={{ height: STUB_HEIGHT }}>
			<View>
				<Text className="text-[10px] tracking-[3px] text-muted font-pretendard-semibold">
					MUSEUM TICKET
				</Text>
				<Text className="mt-1 text-[10px] tracking-[3px] text-stone-300 font-pretendard-semibold">
					ADMIT ONE
				</Text>
			</View>
			<Text className="text-[10px] tracking-[4px] text-tertiary font-pretendard-medium">
				{ticketNo}
			</Text>
		</View>
	);
}

interface VisitTicketFooterProps {
	variant: 'front' | 'back';
	bars: number[];
	ticketNo: string;
}

/** 절취선 + 티켓 스텁(앞면: 바코드+도장, 뒷면: MUSEUM TICKET 라벨) */
export function VisitTicketFooter({ variant, bars, ticketNo }: VisitTicketFooterProps) {
	return (
		<>
			<Perforation />
			{variant === 'front' ? (
				<TicketStubFront bars={bars} ticketNo={ticketNo} />
			) : (
				<TicketStubBack ticketNo={ticketNo} />
			)}
		</>
	);
}
