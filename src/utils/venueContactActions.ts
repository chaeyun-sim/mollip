import { Linking } from 'react-native';

/** 전화번호 → tel: URI (공백·하이픈 제거) */
export function phoneToTelUri(phone: string): string {
	const digits = phone.replace(/[^\d+]/g, '');
	return digits ? `tel:${digits}` : '';
}

export async function openPhoneDialer(phone: string): Promise<boolean> {
	const uri = phoneToTelUri(phone);
	if (!uri) return false;
	const can = await Linking.canOpenURL(uri);
	if (!can) return false;
	await Linking.openURL(uri);
	return true;
}
