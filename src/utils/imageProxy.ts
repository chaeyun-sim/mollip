const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

// 핫링크 방지(User-Agent 검사)나 iOS ATS가 막는 평문 HTTP 이미지가 있어,
// image-proxy Edge Function을 거쳐 항상 우리 도메인의 HTTPS로 받아온다.
export function proxiedImageUrl(url: string | null | undefined): string | null {
	if (!url) return null;
	if (!SUPABASE_URL) return url;

	return `${SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(url)}`;
}
