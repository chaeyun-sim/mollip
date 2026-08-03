# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md @.claude/rules/commit-convention.md @.claude/rules/component-convention.md @.claude/rules/feature-pipeline.md

## Agent team (feature work)

Named roles and handoff rules live in **AGENTS.md**. **Manager** runs the pipeline; only Manager asks the user for confirmation at **G6** (`06-handoff-to-user.md`).

| Name | Role |
|------|------|
| Manager | 검수 · orchestrator |
| John (PM) | 기획 |
| Sam (Design) | 디자인 |
| Alex (Design QA) | 디자인 QA |
| Chris (Dev) | 개발 |
| Taylor (QA) | 개발 QA |

Tier **S** = Chris → Taylor only. Tier **M/L** = `.claude/rules/feature-pipeline.md`. Templates: `.docs/templates/feature/`.

## Development Workflow (MANDATORY)

The user gives ONE instruction and must NEVER need to re-check the result themselves. **Manager** owns the end-to-end loop through QA; **Chris** owns implement → verify → self-fix per AC. Report to the user only after **G6** (or after 5 failed fix iterations on one AC).

### Tier L/M pipeline (new UI / flows)

```
John(01-spec) → Sam(02-design-brief) → Alex(03-design-review) ⟲ max 3
  → 프로토타입 시뮬 스모크 → Chris(AC별 개발) ⟲ Taylor(QA) → Manager(06-handoff) → 사용자 확인
```

Work in **one AC at a time** for implementation. NEVER batch multiple ACs and test only at the end.

### Tier S (small change)

```
[ Chris: 변경 ] → [ Taylor: 검증 루프 ] → (commit은 사용자 요청 시)
```

### Role summary (same session or subagents)

1. **John (PM)** — Scope, ACs, `.docs/wip/{slug}/01-spec.md` for M/L. Ambiguity → Manager uses AskUserQuestion.
2. **Sam (Design)** — Design language, `02-design-brief.md`, a11y.
3. **Alex (Design QA)** — Brief review loop (feature-pipeline.md).
4. **Chris (Dev)** — ONE AC at a time, `component-convention.md`.
5. **Taylor (QA)** — Verification after EACH AC (feature-pipeline.md §4).

### Verification Checks (ALL required per AC — Taylor)

Core checks (tier S and every AC in M/L):

1. **Type check** — `npx tsc --noEmit` passes with zero errors.
2. **Tests** — `npm test` when suites exist.
3. **Visual check** — Capture the iOS simulator with `xcrun simctl io booted screenshot <path>`, open and inspect the image. Confirm the change is actually rendered (layout, colors, text) — a screenshot that was taken but not inspected does not count.
4. **Interaction check** — Actually exercise the changed behavior, not just look at it: tap/scroll/type via simulator control (`xcrun simctl`, browser/E2E tooling when applicable) and confirm the expected state change (navigation, toggle, list update).
5. **Regression check** — Visit adjacent screens on the navigation path to/from the changed screen and confirm they still render and behave correctly.
6. **Convention** — `.claude/rules/component-convention.md` (file structure, imports).
7. **Native modules** — If a native module was added/removed: `cd ios && pod install`, then rebuild with `npx expo run:ios` (JS reload alone will NOT register native views — expect "Unimplemented component" otherwise).

### Self-Fix Loop (automatic — do NOT ask the user)

- If ANY check fails: diagnose the cause, fix it, and re-run ALL checks from the top.
- Repeat up to **5 iterations** per AC without reporting intermediate failures to the user.
- Only after 5 failed iterations: stop, report what failed, what was tried, and the suspected root cause, then wait for instructions.
- NEVER carry a broken AC forward to the next AC.

### Final Integrated Verification (before commit / before G6 handoff)

After all features pass individually: run `npx tsc --noEmit` once more and walk the main affected flow end-to-end in the app (screenshot evidence). Multi-feature work is not "done" until this passes.

### Completion Report (evidence checklist — Taylor → Manager → user at G6)

Tier M/L: fill `05-qa-report.md` then `06-handoff-to-user.md`. Tier S: report inline with the same table.

Report completion ONLY with an evidence checklist per AC, e.g.:

| 기능   | tsc         | 스크린샷      | 인터랙션       | 회귀           |
| ------ | ----------- | ------------- | -------------- | -------------- |
| 기능 A | ✅ 0 errors | `<path>` 확인 | 탭 → 이동 확인 | 인접 화면 정상 |

"Done" without this table is a defect. If a check was skipped (e.g., simulator not booted), state it explicitly instead of implying it passed.

## Project Overview

A React Native / Expo mobile app that acts as a museum audio guide. Users photograph or manually enter artwork info, the app calls AI backends to generate a Korean art description, displays it with a typewriter animation, and reads it aloud via ElevenLabs TTS. Users can then chat with an AI docent about the artwork.

## Development Commands

```bash
# Start the dev server (choose platform in terminal)
npx expo start

# Platform-specific shortcuts
npx expo start --ios
npx expo start --android

# Install dependencies
npm install

# Tests
npm test
```

Jest covers exhibition search utils; extend tests when adding domain logic.

## Environment Setup

Copy `.env.example` to `.env` and fill in:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Both variables are used at runtime in `src/utils/api.ts` to call Supabase Edge Functions.

## Architecture

### App Flow

```
index (home) → create-description (image/manual input) → description (AI text + TTS playback)
                                                                ↓
                                                           chat (AI docent Q&A)
settings → settings/voice, settings/account
```

Navigation is file-based via **expo-router** (`app/` directory).

### State Architecture

Two layers of state, used for distinct purposes:

1. **`src/store.ts` — plain mutable object (not reactive)** Holds transient session data passed between screens: `imageBase64`, `extractedText`, `artworkDescription`, `inputMode`, `manualTitle`, `manualArtist`. Mutated directly (e.g., `store.artworkDescription = text`). Not persisted.

2. **Zustand stores (reactive)**
   - `src/store/chatStore.ts` — chat message list + history array for API calls
   - `src/store/settingsStore.ts` — `voiceId`, `voiceSpeed`, `fontSize`

### Backend: Supabase Edge Functions

All AI/TTS calls go through Edge Functions in `supabase/functions/`. The client never calls external AI APIs directly.

| Edge Function        | Purpose                                                  |
| -------------------- | -------------------------------------------------------- |
| `extract-text`       | OCR via Anthropic (image → artwork text)                 |
| `stream-description` | Streaming Anthropic response for the artwork description |
| `stream-chat`        | Streaming Anthropic chat with docent system prompt       |
| `voices`             | Proxy to ElevenLabs voice list                           |
| `tts`                | Proxy to ElevenLabs TTS, returns audio blob              |

SSE streaming from Anthropic is parsed in `src/utils/api.ts` (`readSSEStream`), which yields `text_delta` chunks from `content_block_delta` events.

### TTS: `src/hooks/useTTS.ts`

- Uses `expo-audio` for playback
- Fetches TTS as base64 data URI via the `tts` Edge Function
- In-memory cache keyed by `voiceId::voiceSpeed::cleanedText` to avoid re-fetching
- Calls `preload()` automatically when streaming finishes so audio is ready before the user taps play

### Styling

NativeWind (Tailwind for React Native) + Pretendard font family (Light/Regular/Medium/SemiBold/Bold). Font family is always applied via `style={{ fontFamily: 'Pretendard-*' }}` since NativeWind does not handle custom fonts. Colors use inline `style` props for anything not covered by Tailwind utilities.

### Layout Components

`src/components/layout/Screen.tsx` and `ScreenHeader.tsx` provide the base layout primitives used across all screens.
