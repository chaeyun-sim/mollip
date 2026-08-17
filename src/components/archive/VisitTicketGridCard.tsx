import { Pressable, Text, View } from 'react-native';
import { MiniBarcode } from '@/src/components/archive/MiniBarcode';
import { stringToTicketColor } from '@/src/utils/ticketColor';

const CARD_HEIGHT = 124;
const MONTH_KO = [
	'JAN',
	'FEB',
	'MAR',
	'APR',
	'MAY',
	'JUN',
	'JUL',
	'AUG',
	'SEP',
	'OCT',
	'NOV',
	'DEC',
];

function ticketSerial(dateKey: string): string {
	let hash = 5381;
	for (let i = 0; i < dateKey.length; i++) {
		hash = ((hash << 5) + hash) ^ dateKey.charCodeAt(i);
	}
	return String((Math.abs(hash) % 9000) + 1000);
}

export interface VisitTicketGridCardProps {
	dateKey: string;
	title: string;
	venue?: string;
	onPress: () => void;
}

export function VisitTicketGridCard({
	dateKey,
	title,
	venue,
	onPress,
}: VisitTicketGridCardProps) {
	const [year, m, d] = dateKey.split('-');
	const monthLabel = MONTH_KO[parseInt(m, 10) - 1] ?? m;
	const dateLabel = dateKey.split('-').join('.');
	const serial = ticketSerial(dateKey);

	return (
		<Pressable
			onPress={onPress}
			accessibilityRole='button'
			accessibilityLabel={`${dateLabel} ${title} 관람 기록`}
		>
			{({ pressed }) => (
				<View
					className='flex-row'
					style={{
						opacity: pressed ? 0.85 : 1,
						height: CARD_HEIGHT,
					}}
				>
					{/* ── 왼쪽 스텁 ── */}
					<View
						className='items-center justify-center rounded-tl-[14px] rounded-bl-[14px] py-[10px] w-[84px] z-[1] pl-1'
						style={{
							height: CARD_HEIGHT,
							backgroundColor: stringToTicketColor(venue ?? title),
						}}
					>
						<Text className='font-hahmlet-bold text-[16px] leading-[18px] tracking-[1px] text-[#3D2B1A]'>
							{monthLabel}
						</Text>
						<Text className='font-hahmlet text-[26px] leading-[30px] mt-px text-[#3D2B1A]'>
							{d}
						</Text>
						<View className='w-6 h-px my-1 bg-[rgba(61,43,26,0.2)]' />
						<Text className='font-pretendard-regular text-[9px] tracking-[0.5px] text-[rgba(61,43,26,0.42)]'>
							{year}
						</Text>
					</View>

					{/* ── 퍼포레이션 구분선 ── */}
					<View
						className='items-center justify-center overflow-visible w-1.5 border-r-[1px] border-dashed border-[rgba(61,43,26,0.3)]'
						style={{
							height: CARD_HEIGHT,
							backgroundColor: stringToTicketColor(venue ?? title),
						}}
					></View>

					{/* ── 메인 영역 ── */}
					<View
						className='flex-1 flex-row rounded-tr-[14px] rounded-br-[14px] border-l-0 border border-[rgba(61,43,26,0.1)] bg-[#FAF7F2]'
						style={{ height: CARD_HEIGHT }}
					>
						{/* 상단 노치 — bottom-right 1/4원 */}
						<View className='absolute z-10 rounded-full w-6 h-6 -left-3 -top-3 border bg-[#f4f4f1] border-l-transparent border-t-transparent border-r-transparent border-b-[rgba(61,43,26,0.1)] -rotate-45 ml-px' />
						{/* 하단 노치 — top-right 1/4원 */}
						<View className='absolute z-10 rounded-full w-6 h-6 -left-3 -bottom-3 border bg-[#f4f4f1] border-l-transparent border-b-transparent border-r-transparent border-t-[rgba(61,43,26,0.1)] rotate-45 ml-px' />
						{/* 텍스트 정보 */}
						<View
							className='justify-between p-4 w-full'
							style={{ height: CARD_HEIGHT }}
						>
							<View>
								<Text
									numberOfLines={2}
									className='font-hahmlet-bold text-[13.5px] leading-[19px] text-[#3D2B1A]'
								>
									{title.replace(/[\[\]\/]/g, '')}
								</Text>
								{venue && (
									<Text
										numberOfLines={1}
										className='mt-1 font-pretendard-regular text-[10px] mb-0.5 text-[rgba(61,43,26,0.42)]'
									>
										{venue}
									</Text>
								)}
							</View>
							<View className='flex-row items-center justify-between'>
								<Text className='mt-0.5 font-pretendard-regular text-[9px] leading-[12px] text-[rgba(61,43,26,0.42)]'>
									{`${dateLabel}\nNO.${serial}`}
								</Text>
								<View className='items-end pt-px pl-4 pr-[11px]'>
									<MiniBarcode
										dateKey={dateKey}
										color='rgba(61,43,26,0.25)'
										length={40}
									/>
								</View>
							</View>
						</View>
					</View>
				</View>
			)}
		</Pressable>
	);
}
