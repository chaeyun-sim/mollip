import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Screen } from '@/src/components/layout/Screen';
import { normalizeNoticeBody, type Notice } from '@/src/data/notice';
import { supabase } from '@/src/utils/supabase';

function formatDate(isoDate: string): string {
	const d = new Date(isoDate);
	return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function NoticeDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const [notice, setNotice] = useState<Notice | null | undefined>(undefined);

	useEffect(() => {
		if (!id) return;

		supabase
			.from('notices')
			.select('id, title, body, category, created_at')
			.eq('id', id)
			.maybeSingle()
			.then(({ data, error }) => {
				if (error) {
					console.warn('[notice-detail] 조회 실패:', error.message);
					setNotice(null);
					return;
				}
				setNotice((data as Notice | null) ?? null);
			});
	}, [id]);

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back />
				<Screen.Header.Center>공지사항 상세</Screen.Header.Center>
			</Screen.Header>

			{notice === undefined && (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator accessibilityRole="progressbar" />
				</View>
			)}

			{notice === null && (
				<View className="flex-1 items-center justify-center">
					<Text className="font-pretendard-regular text-gray500 text-[14px]">
						공지사항을 찾을 수 없어요
					</Text>
				</View>
			)}

			{notice && (
				<ScrollView showsVerticalScrollIndicator={false} className="mt-2">
					<Text className="font-pretendard-semibold text-gray900 text-lg mb-1.5">
						{notice.title}
					</Text>
					<Text className="font-pretendard-regular text-gray500 text-[12px] mb-5">
						{formatDate(notice.created_at)}
					</Text>
					<Text className="font-pretendard-regular text-gray700 text-[17px] leading-relaxed">
						{normalizeNoticeBody(notice.body)}
					</Text>
				</ScrollView>
			)}
		</Screen>
	);
}
