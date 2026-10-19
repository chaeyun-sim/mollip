---
feature-slug: nearby-exhibition-alerts
author: chris
status: in-progress
---

# Dev notes

## Implemented ACs

| AC   | Status | Files                                                                                                |
| ---- | ------ | ---------------------------------------------------------------------------------------------------- |
| AC-1 | Done   | `app/notifications/settings.tsx`, `src/services/nearbyExhibitionAlerts.ts`, `app.config.js`          |
| AC-2 | Done   | `src/services/nearbyExhibitionAlerts.ts`, `src/utils/nearbyExhibitionAlertPolicy.ts`                 |
| AC-3 | Done   | `src/services/nearbyExhibitionAlerts.ts`                                                             |
| AC-4 | Done   | `src/services/nearbyExhibitionAlerts.ts`, `src/utils/nearbyExhibitionAlertPolicy.ts`                 |
| AC-5 | Done   | `app/notifications/settings.tsx`, `src/services/nearbyExhibitionAlerts.ts`, `src/store/authStore.ts` |
| AC-6 | Done   | `app/_layout.tsx`, `src/utils/notificationDeepLink.ts`                                               |
| AC-7 | Done   | `src/services/nearbyExhibitionAlerts.ts`, `app/notifications/settings.tsx`                           |

## Implementation decisions

- Device-only AsyncStorage holds opt-in state, monitored regions, duplicate-event arming, recent delivery history, and last foreground time. Location history is not sent to Supabase.
- Active exhibitions join their museum coordinates (`gps_x` longitude, `gps_y` latitude). Up to 20 venues within 20km are monitored, grouped within 800m.
- A region sends one local notification with the nearest venue's earliest-ending eligible exhibition as the representative and the group count in its body.
- Duplicate enter events are serialized and disarmed until a matching exit. Sending limits are one per 24h, two per rolling seven days, 14 days per representative exhibition, and suppression for one hour after app use.
- Opt-out, permission loss detected at foreground refresh, and logout stop geofencing. Notification taps route to the map with the venue coordinates.

## Changed files

- `app.config.js`
- `app/_layout.tsx`
- `app/notifications/settings.tsx`
- `package.json`, `package-lock.json`
- `src/services/nearbyExhibitionAlerts.ts`
- `src/store/authStore.ts`
- `src/utils/nearbyExhibitionAlertPolicy.ts`
- `src/utils/notificationDeepLink.ts`
- `src/utils/__tests__/nearbyExhibitionAlertPolicy.test.ts`

## Deviations from spec/brief

- The app-use suppression rule is implemented as the one-hour rule specified in the product decisions. Venue groups use a nearest-anchor grouping, so a chain of nearby venues does not merge venues farther than 800m from the anchor.

## Blockers for Taylor (QA)

- Confirm the iOS native build and inspect a real simulator screen. A real-world geofence entry and background delivery still require a physical device and location permission QA.

## Native / env notes

- Added `expo-task-manager`; the iOS app must be rebuilt after installing the module and enabling background location. Android background location permission is enabled in the Expo location plugin.
- iOS monitors at most 20 regions. Android force-quit behavior and device-vendor background restrictions need physical-device verification.
