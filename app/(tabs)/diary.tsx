import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { DiaryCalendar } from '@/src/components/archive/DiaryCalendar';
import { VisitPickerSheet, type VisitPickerEntry } from '@/src/components/archive/VisitPickerSheet';
import { LoginRequiredPressable } from '@/src/components/auth/LoginRequiredPressable';
import { Screen } from '@/src/components/layout/Screen';
import { useDayImages } from '@/src/hooks/useDayImages';
import { useExhibitionPosterUrls } from '@/src/hooks/useExhibitionPosterUrls';
import { useAuthStore } from '@/src/store/authStore';
import { dateKeyOf, useVisitStore } from '@/src/store/visitStore';
import { ARCHIVE_STAT_ACCENTS } from '@/src/constants/archivePalette';
import { colors } from '@/src/constants/colors';
import { WEEKDAYS } from '@/src/constants/week';
import { cn } from '@/src/lib/cn';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DiaryScreen() {
	const router = useRouter();
	const { session, authLoading } = useAuthStore(
		useShallow((s) => ({ session: s.session, authLoading: s.isLoading })),
	);

	const insets = useSafeAreaInsets();

	// 하루에 전시를 여러 개 봤을 때 고를 바텀시트 상태 — dateKey가 세팅되면 present()
	const pickerSheetRef = useRef<BottomSheetModal>(null);
	const [pickerDateKey, setPickerDateKey] = useState<string | null>(null);

	const [{ calYear, calMonth }, setCal] = useState({
		calYear: new Date().getFullYear(),
		calMonth: new Date().getMonth() + 1,
	});

	const visits = useVisitStore((s) => s.visits);
	// visits 키는 "날짜::전시" 복합 키 — 확정된 기록 개수는 날짜 수가 아니라 방문 수다
	const confirmedKeys = useMemo(
		() => Object.keys(visits).filter((k) => visits[k].status === 'confirmed'),
		[visits],
	);
	const pendingCount = useMemo(
		() => Object.keys(visits).filter((k) => visits[k].status === 'pending').length,
		[visits],
	);

	// 캘린더는 날짜 단위 — 하루에 확정 기록이 여러 개여도 그 날짜 하나로 묶어서 표시한다
	const markedDates = useMemo(
		() => [...new Set(confirmedKeys.map((k) => dateKeyOf(k)))],
		[confirmedKeys],
	);
	const confirmedVisits = useMemo(() => {
		const entries = confirmedKeys.map((k) => [k, visits[k]] as const);
		return Object.fromEntries(entries);
	}, [confirmedKeys, visits]);

	const dayImages = useDayImages(confirmedVisits);
	const exhibitionPosterUrls = useExhibitionPosterUrls(confirmedVisits);

	const pickerEntries = useMemo((): VisitPickerEntry[] => {
		if (!pickerDateKey) return [];
		return Object.entries(confirmedVisits)
			.filter(([key]) => dateKeyOf(key) === pickerDateKey)
			.map(([visitKey, visit]) => ({
				visitKey,
				visit,
				imageUrl:
					visit.thumbnail ??
					exhibitionPosterUrls[visitKey] ??
					visit.listened.find((l) => l.imageUrl)?.imageUrl,
			}));
	}, [confirmedVisits, pickerDateKey, exhibitionPosterUrls]);

	const pickerDateLabel = useMemo(() => {
		if (!pickerDateKey) return '';
		const [y, m, d] = pickerDateKey.split('-').map(Number);
		const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
		return `${y}.${m}.${d} ${weekday}요일`;
	}, [pickerDateKey]);

	useEffect(() => {
		useVisitStore.getState().pruneExpiredPending();
	}, []);

	const handleChangeMonth = useCallback((offset: -1 | 1) => {
		setCal((prev) => {
			let calMonth = prev.calMonth + offset;
			let calYear = prev.calYear;
			if (calMonth > 12) {
				calMonth = 1;
				calYear += 1;
			}
			if (calMonth < 1) {
				calMonth = 12;
				calYear -= 1;
			}
			return { calYear, calMonth };
		});
	}, []);

	const handleSelectDate = useCallback(
		(dateKey: string) => {
			const dayVisitKeys = confirmedKeys.filter((k) => dateKeyOf(k) === dateKey);
			// 그날 전시가 1개뿐이면 바로 그 티켓으로, 여러 개면 고르는 시트를 먼저 띄운다
			if (dayVisitKeys.length <= 1) {
				const query = dayVisitKeys[0] ? `?visit=${dayVisitKeys[0]}` : '';
				router.push(`/diary/${dateKey}${query}`);
				return;
			}
			setPickerDateKey(dateKey);
			pickerSheetRef.current?.present();
		},
		[router, confirmedKeys],
	);

	const handlePickVisit = useCallback(
		(visitKey: string) => {
			pickerSheetRef.current?.dismiss();
			if (pickerDateKey) router.push(`/diary/${pickerDateKey}?visit=${visitKey}`);
		},
		[pickerDateKey, router],
	);

	if (authLoading) return null;

	if (!session) {
		return (
			<Screen variant="warm">
				<Screen.Header>
					<Screen.Header.Logo />
				</Screen.Header>
				<View className="flex-1 items-center justify-center px-8 py-16">
					<View className="rounded-full bg-bg-light p-5 mb-5">
						<Ionicons name="lock-closed-outline" size={28} color={ARCHIVE_STAT_ACCENTS.visitDays} />
					</View>
					<Text className="text-[20px] text-center mb-2 font-hahmlet-bold text-gray900">
						로그인하고 관람을 기록해요
					</Text>
					<Text className="text-[14px] text-center leading-[21px] mb-8 font-pretendard-regular text-gray700">
						북마크와 관람 다이어리는 계정에 저장돼요
					</Text>
					<LoginRequiredPressable
						className="w-full rounded-full py-4 items-center bg-secondary"
						accessibilityRole="button"
						accessibilityLabel="로그인하기"
						style={({ pressed }) => ({
							opacity: pressed ? 0.9 : 1,
						})}
						onPress={() => router.push('/(tabs)/diary')}
						returnTo="/(tabs)/diary"
					>
						<Text className="text-white text-[15px] font-pretendard-semibold">로그인하기</Text>
					</LoginRequiredPressable>
				</View>
			</Screen>
		);
	}

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Logo />
				<Screen.Header.Right>
					<Pressable
						onPress={() => router.push('/settings')}
						hitSlop={8}
						accessibilityRole="button"
						accessibilityLabel="마이페이지"
						style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
					>
						<Ionicons name="person-outline" size={24} className="text-gray900" />
					</Pressable>
				</Screen.Header.Right>
			</Screen.Header>

			<Text className="font-pretendard-regular text-gray600 text-[14px] leading-[21px] mb-5">
				{`오디오 가이드로 전시를 관람하거나\n티켓을 인증하면 다이어리에 기록이 생겨요`}
			</Text>

			{pendingCount > 0 && (
				<Pressable
					onPress={() => router.push('/diary/confirm-visits')}
					accessibilityRole="button"
					accessibilityLabel={`미확정 관람 기록 ${pendingCount}개, 확인하러 가기`}
					style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
					className="flex-row items-center rounded-2xl border-[1px] border-dashed border-gray300 bg-bg-tonal px-4 mt-4 py-3.5 mb-5 min-h-[56px]"
				>
					<View className="w-9 h-9 rounded-full items-center justify-center bg-white mr-3">
						<Ionicons name="receipt-outline" size={18} className="text-gray700" />
					</View>
					<View className="flex-1">
						<Text className="font-pretendard-semibold text-[13.5px] text-gray900">
							최근 기록하지 못한 관람이 {pendingCount}개 있어요
						</Text>
						<Text className="mt-0.5 font-pretendard-regular text-[11.5px] text-gray600">
							7일이 지나면 사라져요 · 지금 확인하기
						</Text>
					</View>
					<Ionicons name="chevron-forward" size={16} className="text-gray500" />
				</Pressable>
			)}

			<ScrollView
				showsVerticalScrollIndicator={false}
				bounces={false}
				contentContainerClassName="pb-28 items-stretch"
			>
				<View className={cn('px-2', pendingCount > 0 ? 'mt-4' : 'mt-2')}>
					<DiaryCalendar
						year={calYear}
						month={calMonth}
						markedDates={markedDates}
						dayImages={dayImages}
						onSelectDate={handleSelectDate}
						onChangeMonth={handleChangeMonth}
					/>
				</View>
			</ScrollView>

			<View
				className="absolute right-6 items-end gap-3 shadow-gray900 elevation-lg"
				style={{
					bottom: Math.max(insets.bottom, 16),
					shadowOpacity: 0.28,
					shadowRadius: 14,
					shadowOffset: { width: 0, height: 6 },
				}}
			>
				<Pressable
					onPress={() => router.push('/diary/verify-ticket')}
					accessibilityRole="button"
					accessibilityLabel="티켓 인증"
					accessibilityHint="관람 티켓을 찍어 다이어리에 기록을 남겨요"
					className="h-[58px] w-[58px] items-center justify-center rounded-full bg-secondary"
					style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
				>
					<Ionicons name="ticket" size={26} className="text-bg-tonal" />
				</Pressable>
			</View>

			{/* 하루에 전시를 여러 개 봤을 때 캘린더 우표를 탭하면 뜨는 티켓 선택 시트 */}
			<BottomSheetModal
				ref={pickerSheetRef}
				snapPoints={['45%']}
				enablePanDownToClose
				backgroundStyle={{ backgroundColor: colors.white }}
				handleIndicatorStyle={{ backgroundColor: colors.gray400 }}
				backdropComponent={(props) => (
					<BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
				)}
				onDismiss={() => setPickerDateKey(null)}
			>
				<VisitPickerSheet
					dateLabel={pickerDateLabel}
					entries={pickerEntries}
					onSelect={handlePickVisit}
				/>
			</BottomSheetModal>
		</Screen>
	);
}
