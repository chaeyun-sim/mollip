# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md
@.claude/rules/commit-convention.md
@.claude/rules/component-convention.md

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

1. **`src/store.ts` — plain mutable object (not reactive)**
   Holds transient session data passed between screens: `imageBase64`, `extractedText`, `artworkDescription`, `inputMode`, `manualTitle`, `manualArtist`. Mutated directly (e.g., `store.artworkDescription = text`). Not persisted.

2. **Zustand stores (reactive)**
   - `src/store/chatStore.ts` — chat message list + history array for API calls
   - `src/store/settingsStore.ts` — `voiceId`, `voiceSpeed`, `fontSize`

### Backend: Supabase Edge Functions

All AI/TTS calls go through Edge Functions in `supabase/functions/`. The client never calls external AI APIs directly.

| Edge Function | Purpose |
|---|---|
| `extract-text` | OCR via Anthropic (image → artwork text) |
| `stream-description` | Streaming Anthropic response for the artwork description |
| `stream-chat` | Streaming Anthropic chat with docent system prompt |
| `voices` | Proxy to ElevenLabs voice list |
| `tts` | Proxy to ElevenLabs TTS, returns audio blob |

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
