import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ArchiveDiaryEmpty } from '@/src/components/archive/ArchiveDiaryEmpty';
import { ArchiveLoginPrompt } from '@/src/components/archive/ArchiveLoginPrompt';
import { ArchiveSectionTitle } from '@/src/components/archive/ArchiveSectionTitle';
import { ArchiveSummaryHero } from '@/src/components/archive/ArchiveSummaryHero';
import { VisitTicketGrid } from '@/src/components/archive/VisitTicketGridCard';
import { ArchiveTabBar } from '@/src/components/archive/ArchiveTabBar';
import { SavedExhibitions } from '@/src/components/archive/SavedExhibitions';
import { Screen } from '@/src/components/layout/Screen';
import { useArchiveStats } from '@/src/hooks/useArchiveStats';
import { useAuthStore } from '@/src/store/authStore';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import { useVisitStore } from '@/src/store/visitStore';

type ArchiveTab = 'diary' | 'saved';

export default function ArchiveScreen() {
	const router = useRouter();
	const session = useAuthStore((s) => s.session);
	const authLoading = useAuthStore((s) => s.isLoading);
	const [tab, setTab] = useState<ArchiveTab>('diary');

	const stats = useArchiveStats();
	const savedCount = useBookmarkStore((s) => s.ids.length);

	const handleSelectDate = useCallback(
		(dateKey: string) => {
			router.push(`/diary/${dateKey}`);
		},
		[router],
	);

	const handlePressExhibition = useCallback(
		(id: string) => {
			router.push(`/(explore)/${id}`);
		},
		[router],
	);

	const handleLogin = useCallback(() => {
		router.push({
			pathname: '/auth/login',
			params: { returnTo: '/(tabs)/archive' },
		});
	}, [router]);

	const visits = useVisitStore((s) => s.visits);
	const hasDiaryRecords = Object.keys(visits).length > 0;

	if (authLoading) {
		return null;
	}

	if (!session) {
		return (
			<Screen variant='warm' className='bg-white'>
				<StatusBar style='dark' />
				<Screen.Header>
					<Screen.Header.Logo />
				</Screen.Header>
				<ArchiveLoginPrompt onLogin={handleLogin} />
			</Screen>
		);
	}

	return (
		<Screen variant='warm' className='bg-white'>
			<StatusBar style='dark' />

			<Screen.Header>
				<Screen.Header.Logo />
			</Screen.Header>

			<ScrollView
				showsVerticalScrollIndicator={false}
				bounces={false}
				contentContainerStyle={{ paddingBottom: 48, alignItems: 'stretch' }}
			>
				<ArchiveSummaryHero stats={stats} />

				<ArchiveTabBar value={tab} onChange={setTab} />

				<View className='mt-6'>
					{tab === 'diary' ? (
						<>
							{!hasDiaryRecords ? (
								<ArchiveDiaryEmpty
									onExplore={() => router.push('/(tabs)/')}
									onMap={() => router.push('/(tabs)/map')}
								/>
							) : (
								<View className='px-1'>
									<VisitTicketGrid onPress={handleSelectDate} />
								</View>
							)}
						</>
					) : (
						<>
							<ArchiveSectionTitle
								title={savedCount > 0 ? `저장한 전시 ${savedCount}개` : '저장한 전시'}
								subtitle='나중에 보고 싶은 전시를 모아두세요'
							/>
							<SavedExhibitions onPressExhibition={handlePressExhibition} />
						</>
					)}
				</View>
			</ScrollView>
		</Screen>
	);
}
