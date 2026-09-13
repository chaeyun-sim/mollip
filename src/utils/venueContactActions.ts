import { Linking, Share } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

/** 주소 복사 — 클립보드 실패 시(권한 등) 공유 시트로 대체 */
export async function copyVenueAddress(address: string): Promise<void> {
	try {
		await Clipboard.setStringAsync(address);
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
	} catch {
		await Share.share({ message: address });
	}
}

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
