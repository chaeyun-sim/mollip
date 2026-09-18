import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { cn } from '@/src/lib/cn';
import { ExternalMapSheet, type ExternalMapTarget } from '@/src/components/map/ExternalMapSheet';
import { ExhibitionInfoRow } from './ExhibitionInfoRow';
import { Exhibition } from '@/src/data/exhibitions';
import { getDdayLabel } from '@/src/utils/exhibitionSearch';
import {
	buildWeeklyHours,
	formatTodayOpenStatus,
	parseParkingAlternatives,
} from '@/src/utils/exhibitionVenueInfo';

interface ExhibitionVenueInfoProps extends Exhibition {
	hasTopSpacing: boolean;
}

export function ExhibitionVenueInfo({ hasTopSpacing, ...exhibition }: ExhibitionVenueInfoProps) {
	const [copiedAddress, setCopiedAddress] = useState(false);
	const [copiedPhone, setCopiedPhone] = useState(false);
	const [showHours, setShowHours] = useState(false);
	const [externalMapTarget, setExternalMapTarget] = useState<ExternalMapTarget | null>(null);

	const ddayLabel = getDdayLabel(exhibition);
	const parking = exhibition.museum?.parking;
	const openHours = exhibition.openHours;
	const closedDays = exhibition.museum?.closedDays;
	const parkingAlternatives = useMemo(() => parseParkingAlternatives(parking), [parking]);
	// 요금 안내 괄호를 잘라내 검색하기 좋은 시설명만 남긴다 (예: "오페라하우스 주차장(평일 10분당 1,000원)" → "오페라하우스 주차장")
	const parkingSummaryLabel = useMemo(
		() => parkingAlternatives.summary.replace(/\(.*$/, '').trim() || parkingAlternatives.summary,
		[parkingAlternatives.summary],
	);
	// "전용" 주차장은 검색할 대안이 없으면 외부 지도로 보낼 필요가 없어 안내 아이콘을 숨긴다.
	const showParkingSummaryMapIcon = !(
		parkingAlternatives.summary.startsWith('전용') && parkingAlternatives.alternatives.length === 0
	);
	const todayOpenStatus = useMemo(
		() => formatTodayOpenStatus(openHours, closedDays),
		[openHours, closedDays],
	);
	const weeklyHours = useMemo(
		() => buildWeeklyHours(openHours, closedDays),
		[openHours, closedDays],
	);

	const handleCopy = useCallback(
		async (text: string | undefined, setCopied: (copied: boolean) => void) => {
			if (!text) return;
			await Clipboard.setStringAsync(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		},
		[],
	);

	return (
		<View
			className={cn('px-6', hasTopSpacing ? 'pt-3' : 'pt-0')}
			style={{ zIndex: 100, elevation: 100 }}
		>
			<View className="bg-gray100 rounded-2xl" style={{ zIndex: 100, elevation: 100 }}>
				<ExhibitionInfoRow label="기간">
					{exhibition.startDate} ~ {exhibition.endDate}{' '}
					{ddayLabel && <Text className="text-error">D-{ddayLabel}</Text>}
				</ExhibitionInfoRow>
				{exhibition.venueAddress && (
					<ExhibitionInfoRow
						icon={
							<Ionicons
								name={copiedAddress ? 'checkmark' : 'copy-outline'}
								size={15}
								color={copiedAddress ? '#22c55e' : '#9ca3af'}
							/>
						}
						label="위치"
						onPress={() => handleCopy(exhibition.venueAddress, setCopiedAddress)}
					>
						{exhibition.venueAddress}
					</ExhibitionInfoRow>
				)}
				<ExhibitionInfoRow
					label="전화번호"
					onPress={() => handleCopy(exhibition.phone, setCopiedPhone)}
					icon={
						<Ionicons
							name={copiedPhone ? 'checkmark' : 'copy-outline'}
							size={15}
							color={copiedPhone ? '#22c55e' : '#9ca3af'}
						/>
					}
				>
					{exhibition.phone ?? '정보 없음'}{' '}
				</ExhibitionInfoRow>
				<View
					className="relative flex-row items-center gap-3 py-3.5 border-b border-gray300"
					style={{ zIndex: 200, elevation: 200 }}
				>
					<View className="flex-1 pt-1">
						<Text className="text-gray500 text-[11px] font-pretendard-medium tracking-wider uppercase">
							운영시간
						</Text>
						<Pressable
							onPress={() => setShowHours((prev) => !prev)}
							hitSlop={8}
							className="flex-row items-center gap-2 mt-0.5"
							accessibilityRole="button"
							accessibilityLabel="요일별 운영시간 보기"
							accessibilityState={{ expanded: showHours }}
						>
							<Text className="text-gray900 text-[14px] font-pretendard-regular leading-5">
								{todayOpenStatus}
							</Text>
							<Ionicons
								name={showHours ? 'chevron-up' : 'chevron-down'}
								size={17}
								className="text-gray500"
							/>
						</Pressable>
						{showHours && (
							<View
								className="absolute left-0 right-0 top-[58px] rounded-[8px] bg-white px-4 py-2.5 gap-2 shadow-black elevation-lg"
								style={{ zIndex: 999, elevation: 999 }}
							>
								{weeklyHours.map((entry) => (
									<View key={entry.day} className="flex-row items-center justify-between py-1">
										<Text className="text-gray500 text-[13px] font-pretendard-semibold">
											{entry.day}
										</Text>
										<Text
											className={cn(
												'text-[14px] font-pretendard-medium',
												entry.hours === '휴관' ? 'text-error' : 'text-gray900',
											)}
										>
											{entry.hours}
										</Text>
									</View>
								))}
							</View>
						)}
					</View>
				</View>
				{exhibition.admission !== '없음' && (
					<ExhibitionInfoRow label="관람료" isLast={!exhibition.museum?.parking}>
						{exhibition.admission}
					</ExhibitionInfoRow>
				)}
				{exhibition.museum?.parking && (
					<View className="py-3.5 w-full">
						<Text className="text-gray500 text-[11px] font-pretendard-medium tracking-wider uppercase">
							주차 정보
						</Text>
						{parkingAlternatives.summary && (
							<Pressable
								onPress={() => setExternalMapTarget({ label: parkingSummaryLabel })}
								hitSlop={4}
								className="flex-row items-center gap-2 mt-0.5"
								accessibilityRole="button"
								accessibilityLabel={`${parkingSummaryLabel} 외부 지도 앱에서 보기`}
							>
								<Text className="text-gray900 text-[14px] font-pretendard-regular leading-5">
									{parkingAlternatives.summary}
								</Text>
								{showParkingSummaryMapIcon && (
									<Ionicons
										name="map-outline"
										size={17}
										className="text-gray500"
										style={{ marginTop: 1 }}
									/>
								)}
							</Pressable>
						)}
						{parkingAlternatives.alternatives.length > 0 && (
							<View className="flex-row flex-wrap gap-2 mt-2">
								{parkingAlternatives.alternatives.map((name) => (
									<Pressable
										key={name}
										onPress={() => setExternalMapTarget({ label: name })}
										hitSlop={4}
										style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
										className="flex-row items-center gap-1 rounded-full bg-white px-3 py-2"
										accessibilityRole="button"
										accessibilityLabel={`${name} 외부 지도 앱에서 검색`}
									>
										<Ionicons name="map-outline" size={13} className="text-gray600" />
										<Text className="text-gray700 text-[13px] font-pretendard-medium">{name}</Text>
									</Pressable>
								))}
							</View>
						)}
					</View>
				)}
			</View>
			{externalMapTarget && (
				<ExternalMapSheet target={externalMapTarget} onClose={() => setExternalMapTarget(null)} />
			)}
		</View>
	);
}
