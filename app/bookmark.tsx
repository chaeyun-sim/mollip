import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { BookmarkTabs, type BookmarkTab } from '@/src/components/bookmark/BookmarkTabs';
import { BookmarkedAudioList } from '@/src/components/bookmark/BookmarkedAudioList';
import { BookmarkedExhibitionList } from '@/src/components/bookmark/BookmarkedExhibitionList';
import { Screen } from '@/src/components/layout/Screen';

export default function BookmarkScreen() {
	const router = useRouter();
	const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();

	const tab: BookmarkTab = tabParam === 'audio' ? 'audio' : 'exhibition';

	const handleChangeTab = useCallback(
		(next: BookmarkTab) => {
			router.setParams({ tab: next });
		},
		[router],
	);

	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back color="muted" />
				<Screen.Header.Center>북마크</Screen.Header.Center>
			</Screen.Header>
			<BookmarkTabs tab={tab} onChangeTab={handleChangeTab} className="mt-1 mb-4" />
			{tab === 'audio' ? <BookmarkedAudioList /> : <BookmarkedExhibitionList />}
		</Screen>
	);
}
