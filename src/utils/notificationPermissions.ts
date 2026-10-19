import * as Notifications from 'expo-notifications';

export async function arePushNotificationsDisabled(): Promise<boolean> {
	const permission = await Notifications.getPermissionsAsync();
	const iosPermission = permission.ios;
	const iosNotificationsDisabled =
		iosPermission?.status === Notifications.IosAuthorizationStatus.DENIED ||
		(iosPermission?.allowsAlert === false &&
			iosPermission?.allowsDisplayInNotificationCenter === false);

	return permission.status !== 'granted' || iosNotificationsDisabled;
}
