# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md @.claude/rules/commit-convention.md @.claude/rules/component-convention.md

## Development Workflow (MANDATORY)

The user gives ONE instruction and must NEVER need to re-check the result themselves. Claude owns the entire verification loop: implement → verify → self-fix → re-verify, and only reports back with evidence.

Work is done in per-feature cycles. NEVER batch multiple features and test them at the end — implement ONE feature, verify it, then move to the next:

```
[ 기획(Plan) ] → [ 디자인(Design) ] → [ 개발(기능 1) → 검증 루프 ] → [ 개발(기능 2) → 검증 루프 ] → … → [ 최종 종합 검증 ]
```

1. **기획 (Plan)** — Clarify intent and scope before touching code. If the request is ambiguous, ask via AskUserQuestion first. Break the work into feature-sized units here.
2. **디자인 (Design)** — Match the existing design language (warm neutral palette `#F8F6F2`/`#F2EFE9`, ink `#1C1917`, Pretendard/Hahmlet, rounded cards). For new UI, propose the direction before implementing. Design based on web accessibilities.
3. **개발 (Implement)** — ONE feature at a time. Follow `component-convention.md`. Read files before editing.
4. **검증 루프 (Verification Loop)** — Run immediately after EACH feature, not once at the end.

### Verification Checks (ALL required per feature)

1. **Type check** — `npx tsc --noEmit` passes with zero errors.
2. **Visual check** — Capture the iOS simulator with `xcrun simctl io booted screenshot <path>`, open and inspect the image. Confirm the change is actually rendered (layout, colors, text) — a screenshot that was taken but not inspected does not count.
3. **Interaction check** — Actually exercise the changed behavior, not just look at it: tap/scroll/type via simulator control (`xcrun simctl`, browser/E2E tooling when applicable) and confirm the expected state change (navigation, toggle, list update).
4. **Regression check** — Visit adjacent screens on the navigation path to/from the changed screen and confirm they still render and behave correctly.
5. **Native modules** — If a native module was added/removed: `cd ios && pod install`, then rebuild with `npx expo run:ios` (JS reload alone will NOT register native views — expect "Unimplemented component" otherwise).

### Self-Fix Loop (automatic — do NOT ask the user)

- If ANY check fails: diagnose the cause, fix it, and re-run ALL checks from the top.
- Repeat up to **5 iterations** per feature without reporting intermediate failures to the user.
- Only after 5 failed iterations: stop, report what failed, what was tried, and the suspected root cause, then wait for instructions.
- NEVER carry a broken feature forward to the next feature.

### Final Integrated Verification (before commit / before declaring the whole task done)

After all features pass individually: run `npx tsc --noEmit` once more and walk the main affected flow end-to-end in the app (screenshot evidence). Multi-feature work is not "done" until this passes.

### Completion Report (evidence checklist)

Report completion ONLY with an evidence checklist per feature, e.g.:

| 기능 | tsc | 스크린샷 | 인터랙션 | 회귀 |
|---|---|---|---|---|
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
```

No linter or test runner is configured yet.

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
