---
feature-slug: pref-update
author: manager
status: ready-for-review
---

# Handoff — 내 취향 업데이트

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `app/settings/index.tsx` | 계정 섹션에 "내 취향 수정" CardRow 추가 |
| `app/settings/preferences.tsx` | **신규** — 취향 수정 화면 (스와이프 카드) |
| `app/settings/_layout.tsx` | `preferences` Stack.Screen 등록 |

## AC 체크리스트

| 기능 | tsc | 로직 | 컨벤션 | 비고 |
|------|-----|------|--------|------|
| AC-1 설정 진입점 | ✅ 0 errors | ✅ | ✅ | `heart-outline` 아이콘 |
| AC-2 화면 진입 | ✅ | ✅ | ✅ | headerShown: false |
| AC-3 저장 후 back | ✅ | ✅ | ✅ | await + router.back() |
| AC-4 중간 취소 | ✅ | ✅ | ✅ | back → DB 호출 없음 |

## 확인 필요 (시뮬레이터)

1. 설정 → 계정 섹션에 "내 취향 수정" 항목이 보이는지
2. 탭 시 스와이프 카드 화면 진입 + 뒤로가기 동작
3. 카드를 모두 스와이프한 뒤 "저장하기" → 설정으로 복귀
4. 저장 후 Supabase profiles 테이블에서 preferred_genres / preferred_artists 갱신 확인
