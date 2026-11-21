import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Screen } from '@/src/components/layout/Screen';
import { NoticeBody } from '@/src/components/settings/NoticeBody';
import { formatNoticeDate, hasEnglishNotice, localizeNotice, type Notice } from '@/src/data/notice';
import { supabase } from '@/src/utils/supabase';

export default function NoticeDetailScreen() {
	const { t, i18n } = useTranslation();
	const { id } = useLocalSearchParams<{ id: string }>();
	const [notice, setNotice] = useState<Notice | null | undefined>(undefined);

	const isEn = i18n.language === 'en';

	useEffect(() => {
		if (!id) return;

		supabase
			.from('notices')
			.select('id, title, body, title_en, body_en, category, created_at')
			.eq('id', id)
			.maybeSingle()
			.then(({ data, error }) => {
				if (error) {
					console.warn('[notice-detail] 조회 실패:', error.message);
					setNotice(null);
					return;
				}
				const row = (data as Notice | null) ?? null;
				// 영어 화면에서 영문이 없는 공지는 목록과 같이 숨긴다
				setNotice(row && isEn && !hasEnglishNotice(row) ? null : row);
			});
	}, [id, isEn]);

	const localized = notice ? localizeNotice(notice, isEn) : null;

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back />
				<Screen.Header.Center>{t('notice.detail_title')}</Screen.Header.Center>
			</Screen.Header>

			{notice === undefined && (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator accessibilityRole="progressbar" />
				</View>
			)}

			{notice === null && (
				<View className="flex-1 items-center justify-center">
					<Text className="font-pretendard-regular text-gray500 text-[14px]">
						{t('notice.not_found')}
					</Text>
				</View>
			)}

			{notice && localized && (
				<ScrollView
					showsVerticalScrollIndicator={false}
					className="mt-2"
					contentContainerClassName="pb-10"
				>
					<Text className="font-pretendard-bold text-gray900 text-[20px] leading-[28px] mb-1">
						{localized.title}
					</Text>
					<Text className="font-pretendard-regular text-gray500 text-[12px] mb-5">
						{formatNoticeDate(notice.created_at, isEn)}
					</Text>
					<NoticeBody body={localized.body} />
				</ScrollView>
			)}
		</Screen>
	);
}
