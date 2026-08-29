import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
	const [copied, setCopied] = useState(false);

	const handleCopyAddress = useCallback(async () => {
		if (!venueAddress) return;
		await Clipboard.setStringAsync(venueAddress);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [venueAddress]);

	return (
		<View className={cn('px-6', hasTopSpacing ? 'pt-8' : 'pt-0')}>
			<Text className="font-pretendard-semibold text-[18px] text-gray-900 mb-4">관람 정보</Text>
			<View className="h-0.5 w-full bg-gray900" />
			{venueAddress && (
				<View
					className="flex-row items-start justify-between gap-28 py-3"
					style={{
						borderBottomWidth: StyleSheet.hairlineWidth,
						borderBottomColor: 'rgba(28,25,23,0.15)',
					}}
				>
					<Text className="text-gray-500 text-[12px] font-pretendard-semibold tracking-wider uppercase pt-1">
						위치
					</Text>
					<View className="flex-1 flex-row items-center justify-end gap-2">
						<Text className="text-gray900 text-[14px] font-pretendard-regular text-right leading-5 flex-1">
							{venueAddress}
						</Text>
						<Pressable
							onPress={handleCopyAddress}
							hitSlop={8}
							accessibilityLabel="주소 복사"
							accessibilityRole="button"
							style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
						>
							<Ionicons
								name={copied ? 'checkmark' : 'copy-outline'}
								size={15}
								color={copied ? '#22c55e' : '#9ca3af'}
							/>
						</Pressable>
					</View>
				</View>
			)}
			{eventSite && <ExhibitionInfoRow label="전시 공간">{eventSite}</ExhibitionInfoRow>}
			<ExhibitionInfoRow label="전화번호">{phone ?? '정보 없음'}</ExhibitionInfoRow>
			<ExhibitionInfoRow label="운영시간">{openHours}</ExhibitionInfoRow>
			<ExhibitionInfoRow label="관람료" isLast>
				{admission.replaceAll(' / ', '\n')}
			</ExhibitionInfoRow>
			<View className="h-0.5 w-full bg-gray900" />
		</View>
	);
}
