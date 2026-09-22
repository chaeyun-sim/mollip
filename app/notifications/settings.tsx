import { useCallback, useEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { Screen } from '@/src/components/layout/Screen';
import { CardRow, SettingsCard } from '@/src/components/mypage';
import { colors } from '@/src/constants/colors';
import { useAuthStore } from '@/src/store/authStore';
import { supabase } from '@/src/utils/supabase';

type NotificationPrefs = {
	weekly_recommendation: boolean;
	visit_review: boolean;
	bookmark_deadline: boolean;
	venue_follow: boolean;
	version_update: boolean;
	terms_update: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
	weekly_recommendation: true,
	visit_review: true,
	bookmark_deadline: true,
	venue_follow: true,
	version_update: true,
	terms_update: true,
};

export default function NotificationSettingsScreen() {
	const { userId } = useAuthStore(useShallow((s) => ({ userId: s.user?.id })));
	const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

	useEffect(() => {
		if (!userId) return;

		supabase
			.from('profiles')
			.select('notification_prefs')
			.eq('id', userId)
			.maybeSingle()
			.then(({ data, error }) => {
				if (error || !data?.notification_prefs) return;
				setPrefs({ ...DEFAULT_PREFS, ...(data.notification_prefs as Partial<NotificationPrefs>) });
			});
	}, [userId]);

	const toggle = useCallback(
		(key: keyof NotificationPrefs) => (value: boolean) => {
			if (!userId) return;

			const next = { ...prefs, [key]: value };
			setPrefs(next);

			supabase
				.from('profiles')
				.update({ notification_prefs: next })
				.eq('id', userId)
				.then(({ error }) => {
					if (error) {
						console.warn('[notification-prefs] 저장 실패:', error.message);
						setPrefs(prefs);
					}
				});
		},
		[prefs, userId],
	);

	const renderSwitch = (
		value: boolean,
		onValueChange: (v: boolean) => void,
		disabled?: boolean,
	) => (
		<Switch
			value={value}
			onValueChange={onValueChange}
			disabled={disabled}
			trackColor={{ false: colors.border, true: colors.gray900 }}
			thumbColor="#FFFFFF"
			ios_backgroundColor={colors.border}
			style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
		/>
	);

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back />
				<Screen.Header.Center>알림 설정</Screen.Header.Center>
			</Screen.Header>

			<View className="pt-2">
				<Text className="font-pretendard-regular text-gray500 text-[13px] leading-[19px] mb-5">
					{`선택한 알림만 보내드릴게요.`}
				</Text>

				<SettingsCard>
					<CardRow label="이번주 추천 전시 알림" description="취향에 맞는 전시를 매주 추천해요">
						{renderSwitch(prefs.weekly_recommendation, toggle('weekly_recommendation'))}
					</CardRow>
					<CardRow
						label="관람 후 리뷰 추천 알림"
						description="전시가 끝나면 다이어리에 기록해보세요"
					>
						{renderSwitch(prefs.visit_review, toggle('visit_review'))}
					</CardRow>
					<CardRow
						label="찜한 전시 마감임박 알림"
						description="찜한 전시가 곧 마감될 때 알려드려요"
					>
						{renderSwitch(prefs.bookmark_deadline, toggle('bookmark_deadline'))}
					</CardRow>
					<CardRow
						label="팔로우한 미술관/박물관 새 소식"
						description="팔로우한 미술관/박물관의 새 전시를 알려드려요"
					>
						{renderSwitch(prefs.venue_follow, toggle('venue_follow'))}
					</CardRow>
					<CardRow label="버전 업데이트 알림" description="꼭 업데이트해야 할 때 알려드려요">
						{renderSwitch(prefs.version_update, toggle('version_update'))}
					</CardRow>
					<CardRow label="약관 개정 알림" description="이용약관이 바뀌면 알려드려요">
						{renderSwitch(prefs.terms_update, toggle('terms_update'))}
					</CardRow>
				</SettingsCard>

				<View className="h-[1px] w-full bg-gray500/30 my-4" />

				<SettingsCard>
					<CardRow
						label="근처 전시 알림"
						description="준비 중이에요 — 조만간 만나보실 수 있어요"
						className="opacity-40"
					>
						{renderSwitch(false, () => {}, true)}
					</CardRow>
					<CardRow
						label="구독 자동 결제 알림"
						description="준비 중이에요 — 조만간 만나보실 수 있어요"
						className="opacity-40"
					>
						{renderSwitch(false, () => {}, true)}
					</CardRow>
				</SettingsCard>
			</View>
		</Screen>
	);
}
