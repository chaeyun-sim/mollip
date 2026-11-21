import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Screen } from '@/src/components/layout/Screen';
import { formatNoticeDate, hasEnglishNotice, localizeNotice, type Notice } from '@/src/data/notice';
import { supabase } from '@/src/utils/supabase';
import { router } from 'expo-router';

export default function NoticeScreen() {
	const { t, i18n } = useTranslation();

	const [notices, setNotices] = useState<Notice[] | null>(null);

	const isEn = i18n.language === 'en';

	useEffect(() => {
		supabase
			.from('notices')
			.select('id, title, body, title_en, body_en, category, created_at')
			.order('created_at', { ascending: false })
			.then(({ data, error }) => {
				if (error) {
					console.warn('[notice] 목록 조회 실패:', error.message);
					setNotices([]);
					return;
				}
				const rows = (data as Notice[] | null) ?? [];
				// 영어 화면에서는 영문이 있는 공지만 보여준다
				setNotices(isEn ? rows.filter(hasEnglishNotice) : rows);
			});
	}, [isEn]);

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back />
				<Screen.Header.Center>{t('settings.notice')}</Screen.Header.Center>
			</Screen.Header>

			{notices === null && (
				<View className="flex-1 items-center justify-center">
					<Text className="font-pretendard-regular text-gray500 text-[14px]">
						{t('notice.loading')}
					</Text>
				</View>
			)}

			{notices !== null && notices.length === 0 && (
				<View className="flex-1 items-center justify-center">
					<Text className="font-pretendard-regular text-gray500 text-[14px]">
						{t('notice.empty')}
					</Text>
				</View>
			)}

			{notices !== null && notices.length > 0 && (
				<ScrollView
					showsVerticalScrollIndicator={false}
					className="mt-2"
					contentContainerClassName="gap-3"
				>
					{notices.map((notice) => (
						<Pressable
							key={notice.id}
							onPress={() => router.push(`/settings/notice/${notice.id}`)}
							accessibilityRole="button"
							accessibilityLabel={localizeNotice(notice, isEn).title}
							style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
							className="rounded-2xl bg-white px-4 py-4 shadow-gray900 elevation-[2px]"
						>
							<View className="flex-row items-center justify-between">
								<View className="flex-1 pr-3">
									<Text
										className="font-pretendard-semibold text-gray900 text-base"
										numberOfLines={1}
									>
										{localizeNotice(notice, isEn).title}
									</Text>
									<Text className="font-pretendard-regular text-gray500 text-[12px] mt-1">
										{formatNoticeDate(notice.created_at, isEn)}
									</Text>
								</View>
								<Ionicons name="chevron-forward" size={18} className="text-gray500" />
							</View>
						</Pressable>
					))}
				</ScrollView>
			)}
		</Screen>
	);
}
