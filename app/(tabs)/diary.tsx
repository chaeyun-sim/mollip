import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ArchiveDiaryEmpty } from '@/src/components/archive/ArchiveDiaryEmpty';
import { ArchiveLoginPrompt } from '@/src/components/archive/ArchiveLoginPrompt';
import { DiaryCalendar } from '@/src/components/archive/DiaryCalendar';
import { VisitTicketGrid } from '@/src/components/archive/VisitTicketGrid';
import { Screen } from '@/src/components/layout/Screen';
import { useDayImages } from '@/src/hooks/useDayImages';
import { useAuthStore } from '@/src/store/authStore';
import { useVisitStore } from '@/src/store/visitStore';

type DiaryViewMode = 'grid' | 'calendar';

export default function DiaryScreen() {
	const router = useRouter();
	const session = useAuthStore((s) => s.session);
	const authLoading = useAuthStore((s) => s.isLoading);
	const [diaryViewMode, setDiaryViewMode] = useState<DiaryViewMode>('grid');

	const today = new Date();
	const [calYear, setCalYear] = useState(today.getFullYear());
	const [calMonth, setCalMonth] = useState(today.getMonth() + 1);

	const visits = useVisitStore((s) => s.visits);
	const visitDateKeys = useMemo(
		() => Object.keys(visits).filter((k) => typeof visits[k].exhibitionId === 'string'),
		[visits],
	);

	const dayImages = useDayImages(visits);

	const handleChangeMonth = useCallback(
		(offset: -1 | 1) => {
			setCalMonth((prev) => {
				let m = prev + offset;
				let y = calYear;
				if (m > 12) {
					m = 1;
					y += 1;
				}
				if (m < 1) {
					m = 12;
					y -= 1;
				}
				setCalYear(y);
				return m;
			});
		},
		[calYear],
	);

	const handleSelectDate = useCallback(
		(dateKey: string) => {
			router.push(`/diary/${dateKey}`);
		},
		[router],
	);

	const handleGridTicketPress = useCallback(
		(dateKey: string) => {
			router.push(`/diary/${dateKey}`);
		},
		[router],
	);

	const handleToggleViewMode = useCallback(() => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setDiaryViewMode((prev) => (prev === 'grid' ? 'calendar' : 'grid'));
	}, []);

	const handleLogin = useCallback(() => {
		router.push({
			pathname: '/auth/login',
			params: { returnTo: '/(tabs)/diary' },
		});
	}, [router]);

	if (authLoading) return null;

	if (!session) {
		return (
			<Screen variant="warm">
				<Screen.Header>
					<Screen.Header.Logo />
				</Screen.Header>
				<ArchiveLoginPrompt onLogin={handleLogin} />
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
						<Ionicons name="person-outline" size={24} className="text-primary" />
					</Pressable>
				</Screen.Header.Right>
			</Screen.Header>

			<ScrollView
				showsVerticalScrollIndicator={false}
				bounces={false}
				contentContainerStyle={{ paddingBottom: 48, alignItems: 'stretch' }}
			>
				<View className="flex-row items-end justify-between" style={{ marginBottom: 20 }}>
					<View className="flex-row items-end gap-[6px]">
						<Text
							className="font-hahmlet-bold text-[60px] text-primary tracking-[-1.5px]"
							style={{ lineHeight: 68 }}
						>
							{visitDateKeys.length}
						</Text>
						<Text
							className="font-hahmlet-bold text-[19px] text-primary tracking-[-0.3px] pb-[10px]"
							style={{ lineHeight: 22 }}
						>
							Tickets
						</Text>
					</View>

					{visitDateKeys.length > 0 && (
						<Pressable
							onPress={handleToggleViewMode}
							accessibilityRole="button"
							accessibilityLabel={
								diaryViewMode === 'grid' ? '캘린더 보기로 전환' : '그리드 보기로 전환'
							}
							hitSlop={8}
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
							className="flex-row items-center gap-1 pb-[9px]"
						>
							<Ionicons
								name={diaryViewMode === 'grid' ? 'calendar-outline' : 'grid-outline'}
								size={16}
								className="text-primary"
							/>
							<Text
								className="text-[13px] text-primary"
								style={{ fontFamily: 'Pretendard-Medium' }}
							>
								{diaryViewMode === 'grid' ? '캘린더' : '그리드'}
							</Text>
						</Pressable>
					)}
				</View>

				{!visitDateKeys.length ? (
					<ArchiveDiaryEmpty
						onExplore={() => router.push('/(tabs)/')}
						onMap={() => router.push('/(tabs)/map')}
					/>
				) : diaryViewMode === 'grid' ? (
					<View className="px-1">
						<VisitTicketGrid onPress={handleGridTicketPress} />
						<Text className="font-pretendard-regular text-[11px] text-[rgba(61,43,26,0.28)] tracking-[0.3px] text-center mt-10">
							방문한 전시를 기록하면 티켓이 쌓여요
						</Text>
					</View>
				) : (
					<View className="px-2">
						<DiaryCalendar
							year={calYear}
							month={calMonth}
							markedDates={visitDateKeys}
							dayImages={dayImages}
							onSelectDate={handleSelectDate}
							onChangeMonth={handleChangeMonth}
						/>
					</View>
				)}
			</ScrollView>
		</Screen>
	);
}
