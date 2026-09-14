import { Redirect } from 'expo-router';

export default function AudioBookmarkRedirect() {
	return <Redirect href={{ pathname: '/bookmark', params: { tab: 'audio' } }} />;
}
