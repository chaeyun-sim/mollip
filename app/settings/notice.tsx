import { Screen } from '@/src/components/layout/Screen';

export default function NoticeScreen() {
	return (
		<Screen variant="warm">
			<Screen.Header>
				<Screen.Header.Back />
				<Screen.Header.Center>공지사항</Screen.Header.Center>
			</Screen.Header>
		</Screen>
	);
}
