import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';
import { FrameCard } from '@/src/components/archive/FrameCard';
import {
	PendingRecordStrip,
	type PendingRecordItem,
} from '@/src/components/archive/PendingRecordStrip';
import { LoginRequiredPressable } from '@/src/components/auth/LoginRequiredPressable';
import { Button } from '@/src/components/common/Button';
import { CommonHeader } from '@/src/components/common/CommonHeader';
import { EmptyWallIllustration } from '@/src/components/illustration/EmptyWallIllustration';
import { Screen } from '@/src/components/layout/Screen';
import { useExhibitionPosterUrls } from '@/src/hooks/useExhibitionPosterUrls';
import { useSubscription } from '@/src/hooks/useSubscription';
import { useAuthStore } from '@/src/store/authStore';
import { useRecordDraftStore } from '@/src/store/recordDraftStore';
import { dateKeyOf, useVisitStore } from '@/src/store/visitStore';
import { ARCHIVE_STAT_ACCENTS } from '@/src/constants/archivePalette';
import { buildWallMonths, pendingDaysLeft, toWallItem } from '@/src/utils/museumWall';

export default function DiaryScreen() {
	const { t } = useTranslation();

	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { session, authLoading } = useAuthStore(
		useShallow((s) => ({ session: s.session, authLoading: s.isLoading })),
	);
	const { isPremium, isLoading: subscriptionLoading } = useSubscription();
	const startDraft = useRecordDraftStore((s) => s.start);
	const visits = useVisitStore((s) => s.visits);

	// 벽에는 확정 기록, 상단 스트립에는 기록 대기 관람만 쓴다 — 포스터는 한 번에 조회
	const wallVisits = useMemo(
		() =>
			Object.fromEntries(
				Object.entries(visits).filter(
					([, v]) => v.status === 'confirmed' || v.status === 'pending',
				),
			),
		[visits],
	);
	const posterUrls = useExhibitionPosterUrls(wallVisits);
	const months = useMemo(() => buildWallMonths(visits, posterUrls), [visits, posterUrls]);
	const pendingItems = useMemo(
		(): PendingRecordItem[] =>
			Object.entries(visits)
				.filter(([, v]) => v.status === 'pending')
				.map(([key, v]) => ({
					visitKey: key,
					title: toWallItem(key, v).title,
					daysLeft: pendingDaysLeft(v.pendingSince),
				})),
		[visits],
	);

	useEffect(() => {
		useVisitStore.getState().pruneExpiredPending();
	}, []);

	useEffect(() => {
		if (!session || subscriptionLoading || isPremium) return;
		// push로 바꾸면 뒤로가기는 되지만, 다이어리는 !isPremium일 때 null을 리턴하는 화면이라
		// 뒤로 돌아왔을 때 그대로 흰 화면이 된다 — replace로 다이어리 자체를 스택에서 치워야 한다.
		// 뒤로가기가 없다는 문제는 premium.tsx 쪽에서 canGoBack()을 보고 게이트한다.
		router.replace('/settings/premium');
	}, [session, subscriptionLoading, isPremium, router]);

	const handlePressFrame = (visitKey: string) => {
		router.push(`/diary/${dateKeyOf(visitKey)}?visit=${visitKey}`);
	};

	// 도슨트로 남은 관람은 전시·방문일이 정해진 채로 기록 작성에 이어진다
	const handlePressPending = (visitKey: string) => {
		const visit = visits[visitKey];
		startDraft({
			exhibitionId: visit.exhibitionId,
			title: visit.exhibitionTitle ?? '오늘의 전시',
			venue: visit.venue,
			poster: visit.thumbnail ?? posterUrls[visitKey] ?? null,
			fixedDateKey: dateKeyOf(visitKey),
			dateKey: dateKeyOf(visitKey),
			listenedTitles: visit.listened.map((l) => l.title),
		});
		router.push('/diary/record/write');
	};

	const handlePressRecord = () => router.push('/diary/record');

	if (authLoading) return null;

	if (!session) {
		return (
			<Screen variant="warm">
				<Screen.Header>
					<Screen.Header.Left>
						<Screen.Header.Logo />
					</Screen.Header.Left>
					<Screen.Header.Right>
						<View className="flex-row items-center gap-4">
							<LoginRequiredPressable
								onPress={() => router.push('/bookmark')}
								hitSlop={8}
								accessibilityRole="button"
								accessibilityLabel={t('diary.bookmark_a11y')}
								style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
								returnTo="/bookmark"
							>
								<Ionicons name="bookmark-outline" size={24} className="text-gray900" />
							</LoginRequiredPressable>
							<LoginRequiredPressable
								onPress={() => router.push('/notifications')}
								hitSlop={8}
								accessibilityRole="button"
								accessibilityLabel={t('diary.notifications_a11y')}
								style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
								returnTo="/notifications"
							>
								<Ionicons name="notifications-outline" size={24} className="text-gray900" />
							</LoginRequiredPressable>
						</View>
					</Screen.Header.Right>
				</Screen.Header>
				<View className="flex-1 items-center justify-center px-8 py-16">
					<View className="rounded-full bg-bg-light p-5 mb-5">
						<Ionicons name="lock-closed-outline" size={28} color={ARCHIVE_STAT_ACCENTS.visitDays} />
					</View>
					<Text className="text-[20px] text-center mb-2 font-hahmlet-bold text-gray900">
						{t('diary.login_prompt_title')}
					</Text>
					<Text className="text-[14px] text-center leading-[21px] mb-8 font-pretendard-regular text-gray700">
						{t('diary.login_prompt_description')}
					</Text>
					<LoginRequiredPressable
						className="w-full rounded-full py-4 items-center bg-secondary"
						accessibilityRole="button"
						accessibilityLabel={t('diary.login_button')}
						style={({ pressed }) => ({
							opacity: pressed ? 0.9 : 1,
						})}
						onPress={() => router.push('/(tabs)/diary')}
						returnTo="/(tabs)/diary"
					>
						<Text className="text-white text-[15px] font-pretendard-semibold">
							{t('diary.login_button')}
						</Text>
					</LoginRequiredPressable>
				</View>
			</Screen>
		);
	}

	if (subscriptionLoading || !isPremium) return null;

	return (
		<Screen variant="warm">
			<CommonHeader />

			<ScrollView
				showsVerticalScrollIndicator={false}
				bounces={false}
				contentContainerClassName="pb-28"
			>
				{pendingItems.length > 0 && (
					<PendingRecordStrip items={pendingItems} onPress={handlePressPending} />
				)}

				{months.length > 0 ? (
					months.map((month) => (
						<View key={month.monthKey} className="mt-8">
							<View className="mb-4 flex-row items-baseline justify-between">
								<Text className="font-pretendard-bold text-[18px] text-ink">{month.label}</Text>
								<Text className="font-pretendard-regular text-[12px] text-gray600">
									{t('common.count_pieces', { count: month.count })}
								</Text>
							</View>
							<View className="flex-row gap-3">
								{month.columns.map((column, index) => (
									<View key={index} className="flex-1">
										{column.map((item) => (
											<FrameCard key={item.visitKey} item={item} onPress={handlePressFrame} />
										))}
									</View>
								))}
							</View>
						</View>
					))
				) : (
					<View className="mt-20 items-center px-4">
						<EmptyWallIllustration />
						<Text className="font-hahmlet-bold text-[20px] text-ink">
							{t('diary.empty_wall_title')}
						</Text>
						<Text className="mt-2 mb-8 text-center font-pretendard-regular text-[14px] leading-[21px] text-gray600">
							{t('diary.empty_wall_description')}
						</Text>
						<Button
							onPress={handlePressRecord}
							accessibilityLabel={t('diary.record_button')}
							block={false}
						>
							{t('diary.record_button')}
						</Button>
					</View>
				)}
			</ScrollView>

			{months.length > 0 && (
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
						onPress={handlePressRecord}
						accessibilityRole="button"
						accessibilityLabel={t('diary.record_button')}
						accessibilityHint={t('diary.record_a11y_hint')}
						className="h-[52px] flex-row items-center gap-2 rounded-full bg-brand px-5"
						style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
					>
						<Ionicons name="create-outline" size={20} className="text-white" />
						<Text className="text-white text-[15px] font-pretendard-semibold">
							{t('diary.record_button')}
						</Text>
					</Pressable>
				</View>
			)}
		</Screen>
	);
}
