import { NETWORK_UNAVAILABLE_MESSAGE, toNetworkUnavailableMessage } from '../networkErrors';

describe('network error presentation', () => {
	it('DNS/captive portal/VPN 등 원시 오류를 노출하지 않고 동일한 복구 문구로 정규화한다', () => {
		expect(toNetworkUnavailableMessage({ body: '<html>login</html>', code: 503 })).toBe(
			NETWORK_UNAVAILABLE_MESSAGE,
		);
		expect(toNetworkUnavailableMessage(new Error('ENOTFOUND revenuecat.com'))).toBe(
			NETWORK_UNAVAILABLE_MESSAGE,
		);
	});
});
