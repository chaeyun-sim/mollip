---
feature-slug: archive-hub-v2
author: sam
status: approved
phase: 2-visual-refresh-v2
---

# Design brief — 아카이브 (v2, 탐색과 분리)

## Sam note (피드백 반영)

- **실패 원인**: Explore `ExploreHomeHero`와 **동일 그라데이션·blob·카드**를 아카이브에 복붙 → 탭 전환 시 “같은 화면 두 번”.
- **2차 실패**: `ExploreSectionTitle` + `#F8F6F2` 설정형 리스트 → **둘러보기 섹션 재탕**, 개성 없음.
- **원칙**: 아카이브 = **개인 장부(ledger)**. 탐색 = **발견(discovery)**. 컴포넌트 **공유 금지** (Explore import ❌).

## Tab bar (ArchiveTabBar)

- **Not** settings `SettingsPillGroup`, **not** grey `rgba(28,25,23,0.06)` bar, **not** ink-black selected chunk.
- **Ref**: journal/or picker — soft surface + clear selection.
- Track `#F8F6F2`, **sliding white thumb** + spring, label ink/muted.


| ❌ | ✅ |
|----|-----|
| `LinearGradient` hero (Explore 동일) | 흰 배경 + **타이포 헤더** |
| `ExploreSectionTitle` | `ArchiveSectionTitle` (아카이브 전용) |
| 최근 관람 리스트 + 달력 **중복** | **달력이 주 콘텐츠** (marked day = 진입) |
| scrapbook/폴라roid 카피 | 달력·일기 UX에 맞는 **짧은 안내** |

## Archive identity

- **헤더**: Hahmlet `관람 기록` + 1줄 muted 안내
- **Stats**: **pill 3개** (border `#E7E5E4`, dot accent 유지) — 카드형 hero 없음
- **Diary tab**: pill → (empty **또는** calendar shell) — **Recent 섹션 없음**
- **Saved tab**: `ArchiveSectionTitle` + 기존 `SavedExhibitions`
- **Calendar**: 흰 shell + border (유지)

## Tokens (색 유지)

`archivePalette.ts` stat dots — 변경 없음.

## Copy

| Element | Text |
|---------|------|
| Page title | 관람 기록 |
| Subtitle | 달력에서 날짜를 눌러 그날의 일기를 열어요 |
| Empty title | 아직 관람 기록이 없어요 |
| Empty body | 전시 가이드를 들으면 이 달력이 채워져요 |
