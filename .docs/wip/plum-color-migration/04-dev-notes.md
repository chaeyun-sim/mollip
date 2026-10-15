---
feature-slug: plum-color-migration
author: chris
status: implemented
---

# Dev notes

## AC-1 — 토큰

- `src/constants/colors.ts`를 값 정본으로 정리: Bianco `canvas`, Kimber `ink`, Deep Plum `brand`, 다크용 Light Plum `brand-on-dark`, 따뜻한 표면·장식 팔레트.
- `tailwind.config.js`가 해당 객체를 NativeWind 색으로 가져오도록 명시.
- 기존 gray·배경 별칭은 새 명도값으로 갱신하고, 퍼플·민트 브랜드 토큰은 제거.
- 타입 검사 통과.

## AC-2 — 사용처

- 앱·컴포넌트의 `primary`·`primary-dark`·`accent` 참조를 `brand` 계열로 이관.
- 다크 화면의 채팅·재생목록·결제 CTA는 `brand-on-dark`와 `ink` 글자 조합으로 조정.
- 홈·다이어리의 주요 FAB을 Deep Plum으로 통일.
- 결제 선택 카드의 남은 퍼플 하드코딩을 제거.
- Skeleton 색을 새 회색 단계로 옮기고, 구 블루 강조색을 필요한 브랜드 역할로 교체.
- `Indicator`의 토큰명 color prop이 실제 hex로 해석되도록 수정.
- 교통 노선·작품 이미지·외부 브랜드·도메인 전용 팔레트는 유지.

## 기존 작업과의 관계

작업 시작 전 변경 파일 58개가 이미 있었다. 해당 파일의 기존 기능 변경은 보존하고 컬러 참조만 수정했다. 커밋하지 않았다.
