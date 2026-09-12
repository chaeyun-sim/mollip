---
feature-slug: archive-hub-v2
author: chris
status: done
---

# Dev notes — archive-hub-v2

## Files

| File | Purpose |
|------|---------|
| `app/(tabs)/archive.tsx` | Hub layout, login gate, tabs |
| `src/hooks/useArchiveStats.ts` | Stats + recent date keys |
| `src/components/archive/ArchiveSummaryHero.tsx` | AC-1 |
| `src/components/archive/ArchiveRecentVisits.tsx` | AC-3 |
| `src/components/archive/ArchiveDiaryEmpty.tsx` | AC-4 |
| `src/components/archive/ArchiveLoginPrompt.tsx` | AC-6 |
| `src/components/settings/SettingsPillGroup.tsx` | `equalWidth` for AC-2 |

## AC mapping

- AC-1: `ArchiveSummaryHero` + `useArchiveStats`
- AC-2: `SettingsPillGroup` equalWidth
- AC-3: `ArchiveRecentVisits` (visit keys only, sorted desc)
- AC-4: `ArchiveDiaryEmpty` when no marked dates
- AC-5: Saved header count + `SavedExhibitions`
- AC-6: `ArchiveLoginPrompt` (removed `router.replace` redirect)

## Notes

- Recent list uses `visitStore` keys only (diary-only days without visit still on calendar via `markedDates`).
