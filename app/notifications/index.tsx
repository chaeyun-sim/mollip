import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, ScrollView, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { Screen } from '@/src/components/layout/Screen';
import { NotificationPermissionPage } from '@/src/components/notifications/NotificationPermissionPage';
import { useAuthStore } from '@/src/store/authStore';
import { cn } from '@/src/lib/cn';
import { navigateToNotification } from '@/src/utils/notificationDeepLink';
import { arePushNotificationsDisabled } from '@/src/utils/notificationPermissions';
import { supabase } from '@/src/utils/supabase';

interface NotificationLog {
	id: string;
	title: string;
	body: string;
	data: Record<string, unknown> | null;
	read_at: string | null;
	created_at: string;
}

// "방금 전" / "N시간 전" / "N일 전" — 별도 날짜 라이브러리 없이 처리
function formatRelativeTime(isoDate: string): string {
	const diffMs = Date.now() - new Date(isoDate).getTime();
	const diffMin = Math.floor(diffMs / 60000);
	if (diffMin < 1) return '방금 전';
	if (diffMin < 60) return `${diffMin}분 전`;
	const diffHour = Math.floor(diffMin / 60);
	if (diffHour < 24) return `${diffHour}시간 전`;
	const diffDay = Math.floor(diffHour / 24);
	return `${diffDay}일 전`;
}

export default function NotificationsScreen() {
	const router = useRouter();
	const { userId } = useAuthStore(useShallow((s) => ({ userId: s.user?.id })));
	const [logs, setLogs] = useState<NotificationLog[] | null>(null);
	const [pushDisabled, setPushDisabled] = useState<boolean | null>(null);
	const [permissionChecked, setPermissionChecked] = useState(false);
	const checkPushPermission = useCallback(async () => {
		try {
			setPushDisabled(await arePushNotificationsDisabled());
		} catch (error) {
			console.warn('[notifications] 권한 상태 조회 실패:', error);
			setPushDisabled(null);
		} finally {
			setPermissionChecked(true);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			void checkPushPermission();
			const subscription = AppState.addEventListener('change', (state) => {
				if (state === 'active') void checkPushPermission();
			});
			return () => subscription.remove();
		}, [checkPushPermission]),
	);

	const loadLogs = useCallback(() => {
		if (!userId) return;

		supabase
			.from('notification_logs')
			.select('id, title, body, data, read_at, created_at')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.limit(50)
			.then(({ data, error }) => {
				if (error) {
					console.warn('[notifications] 목록 조회 실패:', error.message);
					setLogs([]);
					return;
				}
				setLogs((data as NotificationLog[] | null) ?? []);
			});
	}, [userId]);

	useEffect(() => {
		loadLogs();
	}, [loadLogs]);

	const handlePressLog = useCallback(
		(log: NotificationLog) => {
			if (!log.read_at) {
				const readAt = new Date().toISOString();
				setLogs(
					(prev) => prev?.map((l) => (l.id === log.id ? { ...l, read_at: readAt } : l)) ?? null,
				);
				supabase.from('notification_logs').update({ read_at: readAt }).eq('id', log.id).then();
			}
			void navigateToNotification(router, log.data);
		},
		[router],
	);

	// 읽지 않은 알림을 한 번에 읽음 처리 — 화면은 먼저 갱신하고, 서버 반영이 실패하면 다시 불러온다
	const handleReadAll = useCallback(() => {
		if (!userId) return;

		const readAt = new Date().toISOString();
		setLogs((prev) => prev?.map((l) => (l.read_at ? l : { ...l, read_at: readAt })) ?? null);
		supabase
			.from('notification_logs')
			.update({ read_at: readAt })
			.eq('user_id', userId)
			.is('read_at', null)
			.then(({ error }) => {
				if (!error) return;
				console.warn('[notifications] 전체 읽음 처리 실패:', error.message);
				loadLogs();
			});
	}, [userId, loadLogs]);

	const hasUnread = logs?.some((log) => !log.read_at) ?? false;

	const iconName = (
		log: NotificationLog,
	): { name: keyof typeof Ionicons.glyphMap; color: string } | undefined => {
		switch (log.data?.type) {
			case 'bookmark_deadline':
				return { name: 'heart', color: 'text-error' };
			case 'weekly_recommendation':
				return { name: 'calendar-outline', color: 'text-gray800' };
			case 'visit_review':
				return { name: 'archive', color: 'text-yellow-800' };
			case 'venue_follow':
				return { name: 'bulb-outline', color: 'text-yellow-600' };
			case 'notice':
				switch (log.data?.category) {
					case 'version_update':
						return { name: 'cloud-download-outline', color: 'text-error' };
					case 'terms_update':
						return { name: 'document-text-outline', color: 'text-gray800' };
					default:
						return { name: 'megaphone-outline', color: 'text-gray800' };
				}
		}
	};

	if (permissionChecked && pushDisabled) {
		return <NotificationPermissionPage onPermissionRequested={() => void checkPushPermission()} />;
	}

	return (
		<Screen variant="warm" className="px-0">
			<Screen.Header fullBleed>
				<Screen.Header.Back />
				<Screen.Header.Center className="mb-1">알림</Screen.Header.Center>
				<Screen.Header.Right>
					<View className="flex-row items-center gap-4">
						{hasUnread && (
							<Pressable
								onPress={handleReadAll}
								hitSlop={8}
								accessibilityRole="button"
								accessibilityLabel="모든 알림 읽음 처리"
							>
								<Text className="font-pretendard-medium text-[14px] text-gray700">모두 읽음</Text>
							</Pressable>
						)}
						<Pressable
							onPress={() => router.push('/notifications/settings')}
							hitSlop={8}
							accessibilityRole="button"
							accessibilityLabel="알림 설정"
						>
							<Ionicons name="settings-outline" size={22} className="text-black" />
						</Pressable>
					</View>
				</Screen.Header.Right>
			</Screen.Header>

			{!permissionChecked && (
				<View className="flex-1 items-center justify-center">
					<Text className="font-pretendard-regular text-[14px] text-gray500">
						알림 설정을 확인하고 있어요
					</Text>
				</View>
			)}

			{permissionChecked && logs === null && (
				<View className="flex-1 items-center justify-center">
					<Text className="font-pretendard-regular text-gray500 text-[14px]">
						불러오는 중이에요
					</Text>
				</View>
			)}

			{permissionChecked && logs !== null && logs.length === 0 && (
				<View className="flex-1 items-center justify-center">
					<Text className="font-pretendard-regular text-gray500 text-[14px]">
						아직 받은 알림이 없어요
					</Text>
				</View>
			)}

			{permissionChecked && logs !== null && logs.length > 0 && (
				<ScrollView showsVerticalScrollIndicator={false}>
					{logs.map((log) => (
						<Pressable
							key={log.id}
							onPress={() => handlePressLog(log)}
							accessibilityRole="button"
							accessibilityLabel={`${log.title || log.body}. ${formatRelativeTime(log.created_at)}`}
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
							className={cn('flex-row items-start gap-2.5 py-5 px-6', !log.read_at && 'bg-brand/5')}
						>
							<View>
								<Ionicons
									name={iconName(log)?.name}
									size={24}
									className={cn('mt-1', iconName(log)?.color)}
								/>
							</View>
							<View className="flex-1 ml-3 mt-1.5">
								<View className="flex-row items-center justify-between">
									<Text className="font-pretendard-regular text-gray500 text-md">
										{formatRelativeTime(log.created_at)}
									</Text>
									{!log.read_at && <View className="bg-red-500 w-3 h-3 rounded-full" />}
								</View>
								<Text className="font-pretendard-regular text-gray700 text-base mt-1.5 leading-normal">
									{log.body}
								</Text>
							</View>
						</Pressable>
					))}
				</ScrollView>
			)}
		</Screen>
	);
}
