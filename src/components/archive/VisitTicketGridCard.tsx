import { Image, Pressable, Text, View } from 'react-native';
import { MiniBarcode } from '@/src/components/archive/MiniBarcode';
import { stringToTicketColor } from '@/src/utils/ticketColor';

function formatDateLabel(dateKey: string): string {
	const [y, m, d] = dateKey.split('-');
	return `${y}.${m}.${d}`;
}

export interface VisitTicketGridCardProps {
	dateKey: string;
	title: string;
	imageUrl?: string;
	venue?: string;
	onPress: () => void;
}

export function VisitTicketGridCard({
	dateKey,
	title,
	imageUrl,
	venue,
	onPress,
}: VisitTicketGridCardProps) {
	const dateLabel = formatDateLabel(dateKey);
	const [year, m, _] = dateKey.split('-');
	const ticketColor = stringToTicketColor(venue ?? title);

	return (
		<Pressable
			onPress={onPress}
			accessibilityRole='button'
			accessibilityLabel={`${dateLabel} ${title} 관람 기록`}
			className='w-1/2 rounded-tl-2xl rounded-tr-2xl overflow-hidden bg-[#111]'
			style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
		>
			{/* 이미지 영역 */}
			<View className='p-2 pb-3' style={{ backgroundColor: ticketColor }}>
				<Image
					source={{ uri: imageUrl }}
					className='w-full h-[150px] rounded-xl'
					resizeMode='cover'
				/>
			</View>
			<View className='flex-row items-center relative'>
				<View className='w-[16px] h-[16px] rounded-full bg-[#f4f4f1] -ml-[9px] absolute left-0' style={{ zIndex: 9999 }} />
				<View className='w-[16px] h-[16px] rounded-full bg-[#f4f4f1] -mr-[9px] absolute right-0' style={{ zIndex: 9999 }} />
			</View>

			{/* 정보 영역 */}
			<View
				className='px-3 pt-3 border-t border-[#dbcbae] border-dashed'
				style={{ backgroundColor: ticketColor }}
			>
				<View className='flex-row items-center mb-[6px]'>
					<Text className='text-[14px] text-[#1C1917] font-hahmlet-semibold'>
						{year}
					</Text>
					<View className='flex-1 mx-[6px] bg-[#1C1917] h-[0.5px]' />
					<Text className='text-[14px] text-[#1C1917] font-hahmlet-bold'>{m}</Text>
				</View>
				<View className='mx-auto'>
					<Text
						numberOfLines={2}
						className='text-[17px] w-[120px] text-[#1C1917] text-center pb-[10px] leading-normal tracking-[0.5px] font-hahmlet-bold'
					>
						{venue ?? title.replace(/[\[\]\/]/g, '')}
					</Text>
				</View>
			</View>

			{/* 스텁 */}
			<View className='pt-2 pb-4' style={{ backgroundColor: ticketColor }}>
				<View className='pb-[6px] flex-row items-center justify-center'>
					<MiniBarcode dateKey={dateKey} color='rgba(68,64,60,0.4)' />
				</View>
				<View className='absolute -bottom-1.5 w-full flex-row justify-around'>
					{Array.from({ length: 11 }).map((_, i) => (
						<View className='rounded-full w-3 h-3 bg-[#f4f4f1]' key={i} />
					))}
				</View>
			</View>
		</Pressable>
	);
}
