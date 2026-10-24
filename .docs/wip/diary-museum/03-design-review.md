---
feature-slug: diary-museum
author: alex
iteration: 1
verdict: Pass
---

# Design review

## Verdict

- **Pass** (조건부: 아래 Suggestions 중 S1·S2는 구현 시 반영)
- Iteration: 1 / 3

## Scores (1–5)

| Dimension            | Score   | Notes                                                                                                                                                                                     |
| -------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand & tokens       | 4       | 파스텔·티켓색 배제, Deep Plum은 상세 인용선 한 곳으로 한정 — §1.1 준수. 이미지 없는 면의 `blanket`/`surface-neutral` 교대는 §1.4(Blanket은 장식 면 한정)와 경계라 빈 기록에만 쓰도록 명시 |
| Layout & IA          | 4       | 벽 → 상세 → 작성 흐름이 스펙 AC-1~6과 일치. masonry 3비율 해시 고정으로 재렌더 안정성 확보. 3단계 스텝 중 1단계의 부담(전시+날짜)은 기본값(오늘)으로 완화됨                               |
| Copy & tone          | 4       | "캡션을 달아요"·"걸어보세요" 일관된 전시장 은유. 기존 푸시 문구("다이어리에서 기록해보세요!")와 톤 차이 없음                                                                              |
| Accessibility        | 4       | 액자·대기 카드·스텝·별점 라벨 정의, 모션 감소 대응 포함. 별점 `adjustable` 구현 필요(S1)                                                                                                  |
| **Weighted overall** | **4.0** |                                                                                                                                                                                           |

Pass rule: overall ≥ 4.0 and no dimension < 3 → **Pass**.

## Previous issues addressed

- [x] 해당 없음(1회차)

## Blockers (must fix)

없음.

## Suggestions (nice to have)

1. **S1** 별점 컴포넌트가 이미 `StarRating`에 있으니 `adjustable` 접근성을 거기에 추가하고, 읽기 전용 변형(`readOnly`)도 같은 컴포넌트에서 다룬다 — 새 컴포넌트 신설 금지(component-convention §14).
2. **S2** 액자 마감용 안쪽 매트(white 8px)는 이미지가 흰 배경 포스터일 때 경계가 사라진다 → `border-[0.5px] border-divider` 유지(브리프에 이미 있음)를 코드 리뷰에서 확인.
3. **S3** 기록이 한두 건일 때 masonry가 한쪽 열로 쏠리지 않도록 첫 두 항목은 좌·우 열 고정 배치.
4. **S4** "기록을 기다리는 전시" 스트립의 7일 만료는 기존 `pruneExpiredPending` 호출 시점을 그대로 유지.

## Handoff

- Pass → **Chris (Dev)** 구현 가능. 프로토타입 시뮬 스모크(G4)는 AC-1 완료 직후 수행.
