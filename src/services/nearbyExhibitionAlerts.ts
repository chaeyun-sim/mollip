import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { AppState, Platform } from 'react-native';
import {
	NEARBY_ALERT_BOUNDARY_ID,
	NEARBY_ALERT_MAX_VENUE_REGIONS,
	NEARBY_ALERT_RADIUS_METERS,
	buildNearbyGeofences,
	canSendNearbyExhibitionAlert,
	filterActiveVenues,
	isExhibitionActive,
	selectNearbyAlertRegions,
	type NearbyAlertDelivery,
	type NearbyAlertRegion,
	type NearbyExhibitionCandidate,
	type NearbyExhibitionVenue,
} from '@/src/utils/nearbyExhibitionAlertPolicy';
import { isExhibitionListingTitle, todayExhibitionDateString } from '@/src/utils/exhibitionSearch';
import { supabase } from '@/src/utils/supabase';

const TASK_NAME = 'mollip-nearby-exhibition-geofence';
const ENABLED_KEY = '@mollip/nearby-exhibition/enabled';
const REGIONS_KEY = '@mollip/nearby-exhibition/regions';
const ARMED_KEY = '@mollip/nearby-exhibition/armed-regions';
const DELIVERIES_KEY = '@mollip/nearby-exhibition/deliveries';
const LAST_FOREGROUND_KEY = '@mollip/nearby-exhibition/last-foreground';
// 경계 이탈 시 백그라운드에서 네트워크 없이 재등록하도록, 마지막으로 받은 진행 중 전시 장소 목록을 기기에 둔다.
const VENUES_KEY = '@mollip/nearby-exhibition/venues';
// 이탈 전(옛 경계 안) 위치를 중심으로 다시 잡지 않도록 짧게 두고, iOS 백그라운드 실행 시간 안에 끝나도록 새 위치 조회에 제한을 둔다.
const BACKGROUND_LOCATION_MAX_AGE_MS = 30 * 1000;
const BACKGROUND_LOCATION_TIMEOUT_MS = 10 * 1000;
const MAX_CACHED_DELIVERIES = 60;
const REGION_REFRESH_DISTANCE_KM = 20;

interface JoinedExhibitionRow {
	id: number;
	title: string;
	start_date: string;
	end_date: string | null;
	museum_id: number | null;
	museums: {
		id: number;
		name: string;
		gps_x: string | null;
		gps_y: string | null;
	} | null;
}

interface StoredRegion extends NearbyAlertRegion {
	exhibitions: (NearbyExhibitionCandidate & { museumId: number; venueName: string })[];
}

interface GeofencingTaskData {
	eventType: Location.GeofencingEventType;
	region: Location.LocationRegion;
}

interface DeliveryHistory {
	deliveries: NearbyAlertDelivery[];
}

/** 사용자에게 그대로 보여줄 수 있는 활성화 실패 사유. needsSettings면 기기 설정 이동을 안내한다. */
export class NearbyAlertSetupError extends Error {
	constructor(
		message: string,
		readonly needsSettings = false,
	) {
		super(message);
		this.name = 'NearbyAlertSetupError';
	}
}

const readJson = async <T>(key: string, fallback: T): Promise<T> => {
	try {
		const value = await AsyncStorage.getItem(key);
		return value ? (JSON.parse(value) as T) : fallback;
	} catch {
		return fallback;
	}
};

const writeJson = async <T>(key: string, value: T): Promise<void> => {
	await AsyncStorage.setItem(key, JSON.stringify(value));
};

const runQueue: { current: Promise<void> } = { current: Promise.resolve() };
const withQueue = async <T>(task: () => Promise<T>): Promise<T> => {
	const previous = runQueue.current;
	let release = () => {};
	runQueue.current = new Promise<void>((resolve) => {
		release = resolve;
	});
	await previous;
	try {
		return await task();
	} finally {
		release();
	}
};

const loadActiveVenues = async (): Promise<NearbyExhibitionVenue[]> => {
	const today = todayExhibitionDateString();
	const { data, error } = await supabase
		.from('exhibitions')
		.select('id, title, start_date, end_date, museum_id, museums!inner(id, name, gps_x, gps_y)')
		.not('museum_id', 'is', null)
		.lte('start_date', today)
		.gte('end_date', today)
		.limit(2000);
	if (error) throw new Error(`전시 정보를 불러오지 못했어요: ${error.message}`);

	const todayDate = new Date();
	const byMuseum = new Map<number, NearbyExhibitionVenue>();
	for (const raw of (data ?? []) as unknown as JoinedExhibitionRow[]) {
		const museum = raw.museums;
		const latitude = Number(museum?.gps_y);
		const longitude = Number(museum?.gps_x);
		const title = raw.title?.trim();
		if (
			!museum ||
			!raw.museum_id ||
			!title ||
			!raw.end_date ||
			!isExhibitionListingTitle(title) ||
			!isExhibitionActive(raw.start_date, raw.end_date, todayDate) ||
			!Number.isFinite(latitude) ||
			!Number.isFinite(longitude) ||
			latitude < -90 ||
			latitude > 90 ||
			longitude < -180 ||
			longitude > 180
		) {
			continue;
		}

		const venue = byMuseum.get(museum.id) ?? {
			museumId: museum.id,
			venueName: museum.name,
			latitude,
			longitude,
			exhibitions: [],
		};
		venue.exhibitions.push({
			id: String(raw.id),
			title,
			startDate: raw.start_date,
			endDate: raw.end_date,
			museumId: museum.id,
			venueName: museum.name,
		});
		byMuseum.set(museum.id, venue);
	}
	return [...byMuseum.values()];
};

export const isNearbyExhibitionAlertEnabled = async (): Promise<boolean> => {
	try {
		return (await AsyncStorage.getItem(ENABLED_KEY)) === 'true';
	} catch (error) {
		console.warn('[nearby-alert] 활성 상태 조회 실패:', error);
		return false;
	}
};

export const enableNearbyExhibitionAlerts = async (): Promise<void> =>
	withQueue(async () => {
		if (Platform.OS === 'android') {
			await Notifications.setNotificationChannelAsync('nearby_exhibition', {
				name: '근처 전시 알림',
				description: '주변 전시관에 도착했을 때 보내는 알림',
				importance: Notifications.AndroidImportance.DEFAULT,
			});
		}
		if (!(await Location.hasServicesEnabledAsync())) {
			throw new NearbyAlertSetupError('기기 위치 서비스를 켜고 다시 시도해 주세요.', true);
		}
		const venues = await loadActiveVenues();
		const location = await Location.getCurrentPositionAsync({
			accuracy: Location.Accuracy.Balanced,
		});
		try {
			await registerRegions(venues, {
				latitude: location.coords.latitude,
				longitude: location.coords.longitude,
			});
			await writeJson(VENUES_KEY, venues);
			await AsyncStorage.setItem(ENABLED_KEY, 'true');
		} catch (error) {
			if (await Location.hasStartedGeofencingAsync(TASK_NAME)) {
				await Location.stopGeofencingAsync(TASK_NAME).catch(() => {});
			}
			await Promise.all([
				AsyncStorage.setItem(ENABLED_KEY, 'false'),
				AsyncStorage.removeItem(REGIONS_KEY),
				AsyncStorage.removeItem(ARMED_KEY),
				AsyncStorage.removeItem(VENUES_KEY),
			]);
			throw error;
		}
	});

export const disableNearbyExhibitionAlerts = async (): Promise<void> =>
	withQueue(async () => {
		await AsyncStorage.setItem(ENABLED_KEY, 'false');
		let stopError: unknown;
		try {
			if (await Location.hasStartedGeofencingAsync(TASK_NAME)) {
				await Location.stopGeofencingAsync(TASK_NAME);
			}
		} catch (error) {
			stopError = error;
		}
		await Promise.all([
			AsyncStorage.removeItem(REGIONS_KEY),
			AsyncStorage.removeItem(ARMED_KEY),
			AsyncStorage.removeItem(VENUES_KEY),
		]);
		if (stopError) throw stopError;
	});

const registerRegions = async (
	venues: NearbyExhibitionVenue[],
	origin: { latitude: number; longitude: number },
): Promise<void> => {
	const nextRegions = selectNearbyAlertRegions(
		venues,
		origin,
		NEARBY_ALERT_MAX_VENUE_REGIONS,
		REGION_REFRESH_DISTANCE_KM,
	) as StoredRegion[];
	const previousRegions = await readJson<StoredRegion[]>(REGIONS_KEY, []);
	const previousArmed = await readJson<Record<string, boolean>>(ARMED_KEY, {});
	const nextArmed: Record<string, boolean> = {};
	for (const region of nextRegions) {
		const distanceMeters = Math.hypot(
			(origin.latitude - region.latitude) * 111_000,
			(origin.longitude - region.longitude) * 111_000 * Math.cos((origin.latitude * Math.PI) / 180),
		);
		// 등록 시 이미 반경 안에 있는 지역은 진입 알림을 보내지 않고, 나간 후 다시 들어와야 활성화한다.
		nextArmed[region.identifier] =
			distanceMeters <= NEARBY_ALERT_RADIUS_METERS
				? false
				: previousRegions.some((prev) => prev.identifier === region.identifier)
					? (previousArmed[region.identifier] ?? true)
					: true;
	}

	await writeJson(REGIONS_KEY, nextRegions);
	await writeJson(ARMED_KEY, nextArmed);
	try {
		// 근처 장소가 없어도 경계 지역은 등록해 이동 후 다시 등록할 수 있게 한다.
		await Location.startGeofencingAsync(TASK_NAME, buildNearbyGeofences(nextRegions, origin));
	} catch (error) {
		await writeJson(REGIONS_KEY, previousRegions);
		await writeJson(ARMED_KEY, previousArmed);
		throw error;
	}
};

/** 근처 전시 알림에 필요한 알림·위치(백그라운드 포함) 권한이 모두 허용되어 있는지 */
export const hasNearbyAlertPermissions = async (): Promise<boolean> => {
	const [foreground, background, notification] = await Promise.all([
		Location.getForegroundPermissionsAsync(),
		Location.getBackgroundPermissionsAsync(),
		Notifications.getPermissionsAsync(),
	]);
	return (
		foreground.status === 'granted' &&
		background.status === 'granted' &&
		(notification.granted ||
			notification.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) &&
		notification.ios?.allowsAlert !== false
	);
};

export const refreshNearbyExhibitionGeofences = async (): Promise<void> => {
	if (!(await isNearbyExhibitionAlertEnabled())) return;
	try {
		if (!(await hasNearbyAlertPermissions())) {
			await disableNearbyExhibitionAlerts();
			return;
		}
		const [venues, location] = await Promise.all([
			loadActiveVenues(),
			Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
		]);
		await withQueue(async () => {
			// 조회 중에 비활성화·로그아웃되었으면 지오펜스를 다시 등록하지 않는다.
			if (!(await isNearbyExhibitionAlertEnabled())) return;
			await registerRegions(venues, {
				latitude: location.coords.latitude,
				longitude: location.coords.longitude,
			});
			await writeJson(VENUES_KEY, venues);
		});
	} catch (error) {
		console.warn('[nearby-alert] 지역 갱신 실패:', error instanceof Error ? error.message : error);
	}
};

/** 경계 지역을 벗어났을 때(백그라운드) — 캐시한 장소 목록과 현재 위치로 가까운 지역을 다시 등록한다. */
const refreshFromBoundaryExit = async (): Promise<void> => {
	if (!(await isNearbyExhibitionAlertEnabled())) return;
	if (!(await hasNearbyAlertPermissions())) {
		await disableNearbyExhibitionAlerts();
		return;
	}
	// 위치를 못 얻으면 예외로 끝내 기존 지역을 그대로 두고, 다음 앱 실행 때 갱신한다.
	const location =
		(await Location.getLastKnownPositionAsync({ maxAge: BACKGROUND_LOCATION_MAX_AGE_MS })) ??
		(await new Promise<Location.LocationObject>((resolve, reject) => {
			const timer = setTimeout(
				() => reject(new Error('background location timeout')),
				BACKGROUND_LOCATION_TIMEOUT_MS,
			);
			Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
				.then(resolve, reject)
				.finally(() => clearTimeout(timer));
		}));
	const venues = filterActiveVenues(
		await readJson<NearbyExhibitionVenue[]>(VENUES_KEY, []),
		new Date(),
	);
	await withQueue(async () => {
		// 위치 조회 중에 비활성화·로그아웃되었으면 다시 등록하지 않는다.
		if (!(await isNearbyExhibitionAlertEnabled())) return;
		await registerRegions(venues, {
			latitude: location.coords.latitude,
			longitude: location.coords.longitude,
		});
	});
};

export const markNearbyAlertForeground = async (): Promise<void> => {
	try {
		await AsyncStorage.setItem(LAST_FOREGROUND_KEY, String(Date.now()));
	} catch (error) {
		console.warn('[nearby-alert] 앱 사용 시간 저장 실패:', error);
	}
};

const deliverNearbyAlert = async (regionIdentifier: string): Promise<void> =>
	withQueue(async () => {
		// 앱을 사용 중일 때는 위치 알림을 표시하지 않는다.
		if (AppState.currentState === 'active') return;
		if (!(await isNearbyExhibitionAlertEnabled())) return;
		const regions = await readJson<StoredRegion[]>(REGIONS_KEY, []);
		const region = regions.find((item) => item.identifier === regionIdentifier);
		if (!region) return;

		const now = Date.now();
		const lastForegroundRaw = await AsyncStorage.getItem(LAST_FOREGROUND_KEY);
		const lastForegroundAt = lastForegroundRaw ? Number(lastForegroundRaw) : null;
		const history = await readJson<DeliveryHistory>(DELIVERIES_KEY, { deliveries: [] });
		const activeExhibitions = region.exhibitions
			.filter((item) => isExhibitionActive(item.startDate, item.endDate, new Date(now)))
			.sort(
				(a, b) =>
					Number(b.museumId === region.museumId) - Number(a.museumId === region.museumId) ||
					a.endDate.localeCompare(b.endDate) ||
					a.title.localeCompare(b.title, 'ko'),
			);
		const representative = activeExhibitions[0];
		if (!representative) return;
		if (
			!canSendNearbyExhibitionAlert({
				exhibitionId: representative.id,
				now,
				deliveries: history.deliveries,
				lastForegroundAt,
			})
		) {
			return;
		}

		await Notifications.scheduleNotificationAsync({
			content: {
				title: representative.title,
				body: `주변에 전시 ${activeExhibitions.length}개가 있어요. 지도에서 둘러보세요.`,
				data: {
					type: 'nearby_exhibition',
					museumId: region.museumId,
					venueName: region.venueName,
					latitude: region.latitude,
					longitude: region.longitude,
					exhibitionId: representative.id,
				},
				categoryIdentifier: 'nearby_exhibition',
				...(Platform.OS === 'android' ? { channelId: 'nearby_exhibition' } : {}),
			},
			trigger: null,
		});
		const deliveries = [
			...history.deliveries.filter((item) => now - item.sentAt < 90 * 24 * 60 * 60 * 1000),
			{ exhibitionId: representative.id, sentAt: now },
		].slice(-MAX_CACHED_DELIVERIES);
		await writeJson(DELIVERIES_KEY, { deliveries });
	});

TaskManager.defineTask<GeofencingTaskData>(TASK_NAME, async ({ data, error }) => {
	if (error || !data?.region?.identifier) return;
	const regionIdentifier = data.region.identifier;
	try {
		// 경계 지역은 알림을 만들지 않고, 벗어날 때 지역 재등록만 한다.
		if (regionIdentifier === NEARBY_ALERT_BOUNDARY_ID) {
			if (data.eventType === Location.GeofencingEventType.Exit) await refreshFromBoundaryExit();
			return;
		}
		const shouldDeliver = await withQueue(async () => {
			const armed = await readJson<Record<string, boolean>>(ARMED_KEY, {});
			if (data.eventType === Location.GeofencingEventType.Exit) {
				armed[regionIdentifier] = true;
				await writeJson(ARMED_KEY, armed);
				return false;
			}
			if (data.eventType !== Location.GeofencingEventType.Enter || !armed[regionIdentifier])
				return false;
			armed[regionIdentifier] = false;
			await writeJson(ARMED_KEY, armed);
			return true;
		});
		if (shouldDeliver) await deliverNearbyAlert(regionIdentifier);
	} catch (taskError) {
		console.warn('[nearby-alert] 지오펜스 이벤트 처리 실패:', taskError);
	}
});
