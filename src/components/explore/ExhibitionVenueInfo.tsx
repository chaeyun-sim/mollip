import { Text, View } from 'react-native';

import { cn } from '@/src/lib/cn';
import { ExhibitionInfoRow } from './ExhibitionInfoRow';

interface ExhibitionVenueInfoProps {
	venueAddress?: string;
	eventSite?: string;
	phone?: string | null;
	openHours: string;
	admission: string;
	hasTopSpacing: boolean;
}

export function ExhibitionVenueInfo({
	venueAddress,
	eventSite,
	phone,
	openHours,
	admission,
	hasTopSpacing,
}: ExhibitionVenueInfoProps) {
	return (
		<View className={cn('px-6', hasTopSpacing ? 'pt-8' : 'pt-0')}>
			<Text className='font-pretendard-semibold text-[18px] text-gray-900 mb-4'>
				관람 정보
			</Text>
			<View className='h-0.5 w-full bg-[#1C1917]' />
			{venueAddress && (
				<ExhibitionInfoRow label='위치'>{venueAddress}</ExhibitionInfoRow>
			)}
			{eventSite && (
				<ExhibitionInfoRow label='전시 공간'>{eventSite}</ExhibitionInfoRow>
			)}
			<ExhibitionInfoRow label='전화번호'>
				{phone ?? '정보 없음'}
			</ExhibitionInfoRow>
			<ExhibitionInfoRow label='운영시간'>{openHours}</ExhibitionInfoRow>
			<ExhibitionInfoRow label='관람료' isLast>
				{admission.replaceAll(' / ', '\n')}
			</ExhibitionInfoRow>
			<View className='h-0.5 w-full bg-[#1C1917]' />
		</View>
	);
}
