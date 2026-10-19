---
feature-slug: nearby-exhibition-alerts
author: taylor
status: ready-for-manager
---

# QA report

## Summary

- P0: 0 known blockers in code and simulator flow
- Tier: L
- Date: 2026-10-18
- Physical-device background geofence delivery remains manual QA required.

## QA checks

- Q1: `npx tsc --noEmit` — passed, 0 errors.
- Q2: `npm test -- --runInBand --silent` — passed, 50 suites / 381 tests. Jest reported its existing open-handle warning after tests; process exited successfully.
- Q3: Policy tests cover venue grouping, 20-region selection, invalid coordinates/dates, current exhibition dates, daily/weekly limits, 14-day cooldown, and recent app use.
- Q4: Settings copy explains location use before opt-in; the control remains off after cancel.
- Q5: Changed app code follows existing component, service, and import conventions; `git diff --check` passed.
- Q6: Inspected simulator screenshots of the settings screen and permission pre-prompt.
- Q7: Maestro opened `/notifications/settings`, tapped the switch, verified the explanatory alert and both actions, cancelled, and verified the setting remained present/off.
- Q8: Verified app launch into the settings deep link and return to the settings screen after cancellation. Map deep-link behavior was code-reviewed but not triggered by a delivered local alert.
- Q9: Region refresh queries at most 2,000 active exhibition rows and registers at most 20 nearby regions; no performance issue found in local policy checks.
- Q10: iOS simulator native build succeeded with Expo Location, Notifications, and Task Manager; `expo run:ios` launched successfully.

## AC matrix

| AC   | Q1 tsc | Q2 jest | Q3 bug | Q4 UX | Q5 conv | Q6 visual | Q7 interact              | Q8 regress                     | Q9 perf | Q10 native |
| ---- | ------ | ------- | ------ | ----- | ------- | --------- | ------------------------ | ------------------------------ | ------- | ---------- |
| AC-1 | Pass   | Pass    | Pass   | Pass  | Pass    | Pass      | Pass                     | Pass                           | Pass    | Pass       |
| AC-2 | Pass   | Pass    | Pass   | Pass  | Pass    | N/A       | Pass (policy)            | N/A                            | Pass    | Pass       |
| AC-3 | Pass   | Pass    | Manual | Pass  | Pass    | N/A       | Manual                   | N/A                            | Pass    | Pass       |
| AC-4 | Pass   | Pass    | Pass   | Pass  | Pass    | N/A       | Pass (policy)            | N/A                            | Pass    | Pass       |
| AC-5 | Pass   | Pass    | Pass   | Pass  | Pass    | N/A       | Code-reviewed            | Code-reviewed (logout cleanup) | Pass    | Pass       |
| AC-6 | Pass   | Pass    | Manual | Pass  | Pass    | N/A       | Manual                   | Manual                         | Pass    | Pass       |
| AC-7 | Pass   | Pass    | Pass   | Pass  | Pass    | Pass      | Pass (cancel/error copy) | Pass                           | Pass    | Pass       |

## Findings

### P0 (ship blocker)

- None found in code, type checks, automated tests, or simulator settings flow.

### P1

- Real-world geofence entry, background execution, actual local notification delivery, notification-tap map camera focus, and OS permission-revocation behavior require physical-device QA. They are not marked passed based on simulator evidence.
- Android build and vendor-specific background behavior were not run in this iOS-focused session. Android force-stopped apps may not resume geofencing until reopened, depending on OS behavior.

### P2

- The full Jest suite reports an existing open-handle warning after all 381 tests pass. This did not fail the run and is not specific to the new policy tests.

## Evidence

| ID  | Path                                                                | Description                                                 |
| --- | ------------------------------------------------------------------- | ----------------------------------------------------------- |
| E1  | `.docs/wip/nearby-exhibition-alerts/evidence/settings.png`          | iPhone 17 Pro simulator, settings screen visually inspected |
| E2  | `.docs/wip/nearby-exhibition-alerts/evidence/permission-prompt.png` | Korean opt-in explanation shown before OS permissions       |
| E3  | `.docs/wip/nearby-exhibition-alerts/evidence/permission-smoke.yaml` | Maestro flow; passed on iPhone 17 Pro simulator             |
| E4  | `.docs/wip/nearby-exhibition-alerts/evidence/prototype.png`         | G4 settings prototype screenshot                            |

## Regression paths walked

1. Open notification settings through the `mollip:///notifications/settings` route, confirm the settings screen, open the nearby-alert explanation, cancel, and confirm the setting is off.
2. Launch the iOS app with the native Task Manager module present; app bundle loaded and settings screen rendered without a red screen.
3. Code-reviewed the existing notification tap routing and map pending-camera integration for the new `nearby_exhibition` payload.

## Return reason

- [ ] Functional
- [ ] Visual
- [ ] Interaction
- [ ] Performance
- [ ] Regression
- [ ] Convention
- [ ] Other

## Recommendation

- [x] Ready for Manager handoff
- [ ] Return to Chris (Dev) (reason above)
