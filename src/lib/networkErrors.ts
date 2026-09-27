/** 네트워크 원인(DNS, captive portal, VPN 차단, timeout)을 화면에 안전하게 표현한다. */
export const NETWORK_UNAVAILABLE_MESSAGE = '인터넷 연결을 확인해 주세요.';

/** 서버 원문·HTML·SDK 내부 오류를 노출하지 않고 복구 가능한 안내로 정규화한다. */
export function toNetworkUnavailableMessage(_error: unknown): string {
	return NETWORK_UNAVAILABLE_MESSAGE;
}
