/** Supabase OAuth redirect — Dashboard Redirect URLs에 동일 값 등록 */
export function getAuthRedirectUri(): string {
	return 'aaa://auth/callback';
}

/** OAuth callback URL의 query 또는 hash 파라미터 */
export function parseAuthCallbackParams(url: string): Record<string, string> {
	const hashIdx = url.indexOf('#');
	const queryIdx = url.indexOf('?');
	const paramString =
		hashIdx !== -1
			? url.slice(hashIdx + 1)
			: queryIdx !== -1
				? url.slice(queryIdx + 1).split('#')[0]
				: '';
	const params: Record<string, string> = {};
	if (!paramString) return params;
	new URLSearchParams(paramString).forEach((value, key) => {
		params[key] = value;
	});
	return params;
}
