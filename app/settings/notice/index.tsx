import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Screen } from '@/src/components/layout/Screen';
import { type Notice } from '@/src/data/notice';
import { supabase } from '@/src/utils/supabase';
import { router } from 'expo-router';

function formatDate(isoDate: string): string {
	const d = new Date(isoDate);
	return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function NoticeScreen() {
	const [notices, setNotices] = useState<Notice[] | null>(null);

	useEffect(() => {
		supabase
			.from('notices')
			.select('id, title, body, category, created_at')
			.order('created_at', { ascending: false })
			.then(({ data, error }) => {
				if (error) {
					console.warn('[notice] 목록 조회 실패:', error.message);
					setNotices([]);
					return;
				}
				setNotices((data as Notice[] | null) ?? []);
			});
	}, []);

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back />
				<Screen.Header.Center>공지사항</Screen.Header.Center>
			</Screen.Header>

			{notices === null && (
				<View className="flex-1 items-center justify-center">
					<Text className="font-pretendard-regular text-gray500 text-[14px]">
						불러오는 중이에요
					</Text>
				</View>
			)}

			{notices !== null && notices.length === 0 && (
				<View className="flex-1 items-center justify-center">
					<Text className="font-pretendard-regular text-gray500 text-[14px]">
						아직 등록된 공지사항이 없어요
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
							accessibilityLabel={notice.title}
							style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
							className="rounded-2xl bg-white px-4 py-4 shadow-gray900 elevation-[2px]"
						>
							<View className="flex-row items-center justify-between">
								<View className="flex-1 pr-3">
									<Text
										className="font-pretendard-semibold text-gray900 text-base"
										numberOfLines={1}
									>
										{notice.title}
									</Text>
									<Text className="font-pretendard-regular text-gray500 text-[12px] mt-1">
										{formatDate(notice.created_at)}
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
