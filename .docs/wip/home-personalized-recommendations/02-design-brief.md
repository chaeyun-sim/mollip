---
feature-slug: home-personalized-recommendations
author: sam
status: pass
---

# Design brief

## Design intent

홈의 2×2 포스터 그리드와 출발 안내판 뒤에 브랜드 큐레이션 지면을 둔다. Deep Plum 헤더와 포스터 크기를 달리한 흰색 카드로 개인 추천을 구분한다.

## Tokens

- 캔버스 `#FAFAF8`, 카드 `#FFFFFF`, 헤더 `#F3F3F0`, 본문 Kimber `#2D2D23`
- Deep Plum `#5F1D3E`는 섹션 번호에만 제한한다. 순번 배지·화살표는 중립 회색으로 둔다.
- 이미지가 실제 색을 담당한다. 파스텔 장식 면은 추가하지 않는다.
- 카드 경계는 Kimber 10% 투명도, 행 구분은 같은 색의 헤어라인.

## Layout & components

1. Soft neutral 헤더에 동적 섹션 번호, `FOR YOU`, 사용자 이름 기반 제목, 짧은 설명을 배치하고 번호만 Deep Plum으로 표시.
2. 흰색 카드 안에서 첫 전시는 104×138 포스터와 큰 제목, 나머지 두 전시는 52×64 포스터와 간결한 정보.
3. 순번은 작은 중립 배지로, 행 구분선은 얇은 중립색으로 표현.
4. 사진이 없거나 실패해도 `ImageFallback`과 텍스트로 탐색 가능.
5. 카드 전체가 아니라 각 전시 행을 개별 터치 대상으로 사용한다.

## States

- 선호 장르 없음·일치 결과 없음·오류: 섹션 숨김.
- 로딩 중: 별도 빈 카드 없이 앞 섹션을 그대로 표시, 결과가 오면 섹션 등장.
- 결과 1개/2개/3개 이상: 최대 3개를 배치하고 마지막 행에는 구분선 없음.

## Accessibility

- 전시별 `accessibilityRole="button"`, 제목·장소·상태를 포함한 라벨.
- 개별 행 높이 64pt 이상, 제목 최대 2줄, 실제 이미지 위에 텍스트 중첩 없음.
- Kimber와 중립 카드의 본문 대비 확인.

## Prototype scope

실데이터 홈 스크롤 캡처와 전시 행 탭. 계정에 추천 결과가 없으면 정적 시안과 데이터 조건 검증으로 분리한다.
