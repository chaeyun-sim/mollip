import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

import { getAuthRedirectUri, parseAuthCallbackParams } from '@/src/utils/authRedirect';
import { supabase } from '@/src/utils/supabase';

WebBrowser.maybeCompleteAuthSession();

export async function createSessionFromUrl(url: string): Promise<void> {
	const params = parseAuthCallbackParams(url);
	const errorCode = params.error ?? params.error_code;
	if (errorCode) throw new Error(errorCode);

	if (params.code) {
		const { error } = await supabase.auth.exchangeCodeForSession(params.code);
		if (error) throw error;
		return;
	}

	const access_token = params.access_token;
	const refresh_token = params.refresh_token;
	if (!access_token || !refresh_token) {
		throw new Error('OAuth 응답에 토큰이 없습니다');
	}
	const { error } = await supabase.auth.setSession({ access_token, refresh_token });
	if (error) throw error;
}

export async function signInWithKakao(): Promise<void> {
	const redirectTo = getAuthRedirectUri();
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: 'kakao',
		options: { redirectTo, skipBrowserRedirect: true },
	});
	if (error) throw error;
	if (!data?.url) throw new Error('카카오 로그인 URL을 받지 못했습니다');

	const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
	if (result.type !== 'success') {
		throw new Error('카카오 로그인이 취소되었습니다');
	}
	await createSessionFromUrl(result.url);
}

export async function signInWithApple(): Promise<void> {
	if (Platform.OS !== 'ios') {
		throw new Error('Apple 로그인은 iOS에서만 사용할 수 있습니다');
	}
	const available = await AppleAuthentication.isAvailableAsync();
	if (!available) throw new Error('Apple 로그인을 사용할 수 없습니다');

	let credential: AppleAuthentication.AppleAuthenticationCredential;
	try {
		credential = await AppleAuthentication.signInAsync({
			requestedScopes: [
				AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
				AppleAuthentication.AppleAuthenticationScope.EMAIL,
			],
		});
	} catch (e) {
		if (e && typeof e === 'object' && 'code' in e && e.code === 'ERR_REQUEST_CANCELED') {
			throw new Error('Apple 로그인이 취소되었습니다');
		}
		throw e;
	}
	if (!credential.identityToken) {
		throw new Error('Apple identity token이 없습니다');
	}
	const { error } = await supabase.auth.signInWithIdToken({
		provider: 'apple',
		token: credential.identityToken,
	});
	if (error) throw error;
}
