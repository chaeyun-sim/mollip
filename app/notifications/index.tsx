import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { Screen } from '@/src/components/layout/Screen';
import { useAuthStore } from '@/src/store/authStore';
import { cn } from '@/src/lib/cn';
import { navigateToNotification } from '@/src/utils/notificationDeepLink';
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

	return (
		<Screen variant="warm" className="px-0">
			<Screen.Header fullBleed>
				<Screen.Header.Back />
				<Screen.Header.Center className="mb-1">알림</Screen.Header.Center>
				<Screen.Header.Right>
					<Pressable
						onPress={() => router.push('/notifications/settings')}
						hitSlop={8}
						accessibilityRole="button"
						accessibilityLabel="알림 설정"
					>
						<Ionicons name="settings-outline" size={22} className="text-black" />
					</Pressable>
				</Screen.Header.Right>
			</Screen.Header>

			{logs === null && (
				<View className="flex-1 items-center justify-center">
					<Text className="font-pretendard-regular text-gray500 text-[14px]">
						불러오는 중이에요
					</Text>
				</View>
			)}

			{logs !== null && logs.length === 0 && (
				<View className="flex-1 items-center justify-center">
					<Text className="font-pretendard-regular text-gray500 text-[14px]">
						아직 받은 알림이 없어요
					</Text>
				</View>
			)}

			{logs !== null && logs.length > 0 && (
				<ScrollView showsVerticalScrollIndicator={false}>
					{logs.map((log) => (
						<Pressable
							key={log.id}
							onPress={() => handlePressLog(log)}
							accessibilityRole="button"
							accessibilityLabel={`${log.title || log.body}. ${formatRelativeTime(log.created_at)}`}
							style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
							className={cn(
								'flex-row items-start gap-2.5 py-5 px-6',
								!log.read_at && 'bg-primary/10',
							)}
						>
							<View>
								<Ionicons
									name={iconName(log)?.name}
									size={24}
									className={cn('mt-1', iconName(log)?.color)}
								/>
							</View>
							<View className="flex-1 ml-3">
								<View className="flex-row items-center justify-between">
									{log.title && (
										<Text className="font-pretendard-semibold text-gray900 text-base mb-0.5">
											{log.title}
										</Text>
									)}
									<Text className="font-pretendard-regular text-gray500 text-md mt-1">
										{formatRelativeTime(log.created_at)}
									</Text>
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
