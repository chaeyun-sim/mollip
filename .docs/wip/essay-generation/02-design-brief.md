---
feature-slug: essay-generation
author: sam
status: draft
---

# Design brief — 감상 에세이 생성 (rev2 — 한줄평/감상문 통합)

## Design intent

- rev1은 "한줄평"(2단계, 짧은 텍스트)과 "감상 생성"(신규 3단계, 별도 UI 블록)을 분리해 4단계 흐름(별점→한줄평→감상생성→서명)으로 구현했다. rev2는 이 둘을 **하나의 입력칸**으로 합쳐 다시 3단계(별점→감상평→서명)로 되돌린다 — `01-spec.md` AC-1, AC-11.
- 핵심 변경은 "별도 단계가 사라지고 한 입력칸이 두 작성 방식(직접 쓰기/생성하기)을 모두 흡수한다"는 것이다. rev1의 `EssayStageSection`(idle/streaming/done/error 4-상태 블록)은 **폐기**하고, 그 대신 "감상평" `TextInput` 하나가 **자기 자신의 시각 상태**(일반/잠금/에러)로 표현한다. 별도 화면 전환이나 블록 등장/퇴장이 아니라 같은 입력칸의 스타일이 바뀌는 것이므로, rev1보다 훨씬 가벼운 컴포넌트가 된다.
- 그럼에도 `ReceiptSummary.tsx`가 이미 245줄·6개 UI 블록을 담고 있다는 사정(rev1 Alex 지적, `component-convention.md` §9.4)은 그대로다. 따라서 신규 통합 입력 UI(라벨+토글+TextInput+상태별 보조 UI+완료 버튼)는 `EssayStageSection.tsx`를 대체하는 신규 서브컴포넌트 `EssayInputSection.tsx`(named export, `src/components/archive/`)로 추출한다. `ReceiptSummary`는 이 컴포넌트에게 props를 pass-through하는 얇은 조립 역할만 한다(rev1과 동일 원칙, 컴포넌트 이름과 내부 구조만 달라짐).
- `useEssayStream`(rev1에서 만든 훅)의 SSE 델타 누적 로직은 그대로 재사용한다(spec 확정 사항). 다만 소비 방식이 바뀐다 — rev1은 그 값을 읽기 전용 `Text`에 렌더링했지만, rev2는 controlled `TextInput`의 `value`로 바인딩한다. 시각적으로 "생성 중"임을 알려주는 요소(로딩 인디케이터, 옅은 배경 톤)는 입력칸 **안이 아니라 입력칸 주변**(배경색 변화 + 작은 인디케이터)으로 표현해, 스트리밍 텍스트 자체는 입력칸 값으로 자연스럽게 채워지게 한다.
- 시각적 톤은 영수증 카드의 기존 언어를 그대로 쓴다: 흰 카드 배경, `border-t border-dashed border-gray300`로 단계 구분, 단계 헤더는 `text-[13px] text-gray600 font-pretendard-medium` 중앙 정렬(별점 단계 헤더와 동일 톤). 새로운 색상·컴포넌트 언어를 도입하지 않는다. 다만 rev1의 한 줄짜리 밑줄 입력칸(`border-b`)은 이제 여러 줄 문단을 담아야 하므로, 카드 톤에 맞는 **박스형 텍스트영역**(`rounded-2xl border` + 톤온톤 배경)으로 바뀐다 — 아래 §Layout & components 참고.

## Tokens (defaults)

- Background: `#F8F6F2`(`bg-gray100`, Screen warm variant) / 카드 `#FFFFFF`(`bg-white`)
- Ink: `#1C1917`(`text-gray900`)
- Muted: `#A8A29E`(`text-gray500`, placeholder) / `#78716C`(`text-gray600`, 보조 텍스트/헤더)
- Divider: `#E7E5E4`(`border-gray300`, 점선 구분선)
- 입력칸 일반 배경: `#F8F6F2`(`bg-gray100`) — 흰 카드 위에 살짝 톤을 준 박스
- 입력칸 잠금(streaming) 배경: `#F2EFE9`(`bg-gray200`, 톤온톤) — 일반 상태보다 한 단계 더 진한 톤으로 "지금은 만질 수 없음"을 전달
- 입력칸 에러 보더: `#EF4444`(`border-error`, 그래픽 요소 3:1 기준 3.76:1 충족 — 텍스트에는 쓰지 않음, 아래 §Accessibility 참고)
- 토글 active: `#625876`(`bg-primary-dark`, 흰 텍스트)
- 토글 inactive: `#F2EFE9`(`bg-gray200`) + `#57534E`(`text-gray700`)
- 토글 disabled(재생성 5회 소진): `#C7C3BD`(`bg-gray400`) + 흰 텍스트(disabled 표준 조합, DESIGN_SYSTEM.md §1.3)
- 완료(다음) 버튼: `#625876`(`bg-primary-dark`, 흰 텍스트 — 기존 "확정하고 보관하기" 버튼과 동일 톤)
- Error(아이콘 전용, 텍스트 금지): `#EF4444`(`text-error`) — 흰 배경 대비 3.76:1로 본문 텍스트 AA 기준(4.5:1) 미달, 그래픽 요소 3:1은 충족하므로 **아이콘·보더에만** 사용
- Error(텍스트): `#57534E`(`text-gray700`, 흰 배경 대비 7.63:1) — 에러 메시지 본문 텍스트는 이 토큰 사용
- Font: `font-pretendard-*`(본문/버튼), `font-hahmlet-bold`(전시명 타이틀만, 변경 없음)
- Radius: 입력 박스 `rounded-2xl`, 버튼 `rounded-2xl`(pill에 가까운 큰 radius, 기존 CTA와 통일)

## Layout & components

카드 내부 단계 순서(rev1의 4단계에서 3단계로 단순화): `전시 정보 → 오늘의 프로그램 → 장소/시간 → [1단계] 별점 → [2단계] 감상평(통합 입력) → [3단계] 서명`. 각 단계는 `border-t border-dashed border-gray300 mt-3 pt-4`로 구분(기존 규칙 유지).

**컴포넌트 분리(구조 변경, must-follow)**: `EssayStageSection.tsx`는 삭제한다. 그 자리를 대체하는 `src/components/archive/EssayInputSection.tsx`(named export)는 rev1처럼 "한줄평 입력칸 아래 별도로 나타나는 블록"이 아니라, **한줄평 입력칸이 있던 그 자리에 통째로 대체 삽입**된다. `ReceiptSummary`는 이 컴포넌트에 essay 관련 props(§Component contract)를 pass-through만 한다 — 로직 소유는 여전히 `confirm-visits.tsx`(controlled 패턴, rev1과 동일 원칙).

| 영역                                                     | 설명                                                                                                                                                                                                                                                | 재사용 컴포넌트 / 신규                   |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 감상평 섹션 헤더 + 토글                                  | "감상평" 라벨(작은 헤더, 기존 "한줄평" 라벨 자리 대체) + "직접 쓰기"/"생성하기" 2-세그먼트 토글을 같은 행에 배치(라벨 좌측, 토글 우측 — 좁은 화면에서 줄바꿈 허용)                                                                                  | 신규, `EssayInputSection` 내부 블록      |
| 입력칸 — 일반(직접 쓰기 중, 또는 생성 완료 후 편집 가능) | `rounded-2xl border border-gray300 bg-gray100` 박스, 여러 줄(`multiline`, 최소 3줄 높이 ~72px, 내용에 따라 자동 확장, 최대 약 6줄 이후 내부 스크롤)                                                                                                 | 신규, 기존 `TextInput`을 박스형으로 변경 |
| 입력칸 — 잠금(생성 스트리밍 중)                          | 동일 박스, 배경만 `bg-gray200`로 전환 + 박스 우측 상단에 작은 `ActivityIndicator`(`size="small"`, `color={colors.primaryDark}`) 배지. 스트리밍 델타가 `value`로 그대로 채워지므로 텍스트 자체는 박스 안에서 실시간으로 늘어난다. `editable={false}` | 신규                                     |
| 입력칸 — 에러                                            | 동일 박스, `border-error`(2px)로 테두리만 강조 + 박스 아래 경고 아이콘(`text-error`) + 에러 메시지(`text-gray700`) + "다시 시도"/"직접 쓰기로 전환" 텍스트 링크 2개(hitSlop 16)                                                                     | 신규                                     |
| 재생성 상한 안내                                         | 토글 "생성하기" 세그먼트 아래(또는 우측)에 작은 헬퍼 텍스트로 남은 횟수 표시(`text-[11px] text-gray500`) — 5회 소진 시 세그먼트가 `bg-gray400`(disabled 톤)로 바뀌고 헬퍼 텍스트가 안내 문구로 교체                                                 | 신규                                     |
| 완료(다음) 버튼                                          | 입력칸 아래 우측 정렬 "다음" 버튼(주 버튼, `bg-primary-dark` pill, `py-3 px-6`). 감상평 섹션이 나타나면(별점 매긴 직후) 항상 노출되며, 스트리밍 중에는 `disabled`(터치 무시 + `opacity-40`)로 시각적 비활성화                                       | 신규                                     |
| 서명 (기존 3→4단계, 이제 3단계)                          | 변경 없음 — 부모가 `onEssayNext`("다음" 버튼 탭, 유일한 실질 트리거 — §Component contract `onEssayNext` 참고) 호출 시 `signatureStageReady`를 true로 세팅하는 연결 순서만 변경                                                                      | `SignaturePad` 기존 그대로               |

## Component contract (props — controlled 패턴)

기존 `ReceiptSummary`와 동일하게 controlled 패턴을 유지한다 — `streamChat()` 호출(재료 조립 + SSE 수신)은 `confirm-visits.tsx`가 소유하는 `useEssayStream` 훅이 담당하고, `EssayInputSection`은 결과값과 콜백만 props로 받는다(component-convention.md §4 SRP).

`ReceiptSummaryProps`에서 essay 관련 필드는 아래로 재정의된다(rev1 대비 변경: `essayStageReady` 제거 — 별도 게이트 없이 별점 직후 바로 나타남, `onMemoDone`/`memo`/`onMemoChange`/`onMemoFocus` 제거 — 감상평 필드로 통합):

```ts
interface ReceiptSummaryProps {
	// ...exhibitionTitle/venue/dateLabel/listenedTitles/visitedAt/rating/onRatingChange/
	//    signatureStageReady/onStrokeChange/stamped 변경 없음

	/** 감상평 텍스트 — 직접 입력값이자 스트리밍 중 누적값, 완성된 값 모두 이 하나로 표현된다 */
	essayText: string;
	/** 사용자가 직접 타이핑할 때 — 스트리밍 중(stage==='streaming')에는 입력칸이 잠겨 있어 호출되지 않는다 */
	onEssayTextChange: (text: string) => void;
	/** 감상평 스트리밍 단계 — useEssayStream의 stage를 단일 소스로 그대로 전달(rev1 Risks 항목 유지) */
	essayStage: EssayStage; // 'idle' | 'streaming' | 'done' | 'error' — 'idle'과 'done'은 시각적으로 동일(일반 편집 가능 상태)
	/** 토글의 현재 선택 상태 — "직접 쓰기"/"생성하기" accessibilityState({ selected })의 유일한 소스(§Accessibility). essayStage(생성 진행 단계)와는 다른 축이므로 별도 필드로 분리한다. 전환 규칙은 아래 §States "토글 선택 상태" 참고 */
	essayInputMode: 'write' | 'generate';
	/** "생성하기"를 누른 횟수(0~5) — 토글 헬퍼 텍스트("N/5")와 5회 소진 시 disabled 처리에 사용 */
	essayGenerateCount: number;
	/** 현재 에러가 "재생성 상한(5회) 소진"으로 인한 것인지 여부 — Copy 표의 에러 메시지 2종("감상 생성에 실패했어요" vs "잠시 후 다시 시도해 주세요")을 구분하는 유일한 소스. essayGenerateCount(재생성 카운터)와는 별개인 네트워크/서버 재시도 소진 여부를 나타내며, essayStage==='error'일 때만 의미를 가지므로 optional이 아닌 필수 boolean으로 선언해 error 상태에서 값 누락을 방지한다(rev1 iteration 2 Suggestion 반영 — discriminated union 대신 필수 필드로 타입 레벨 보장을 강화) */
	essayRetriesExhausted: boolean;
	/** "생성하기" 토글 세그먼트를 눌렀을 때 — idle/done/error 상태에서 모두 호출 가능(재생성 포함), streaming 중에는 비활성 */
	onEssayGenerate: () => void;
	/** "직접 쓰기" 토글 세그먼트를 눌렀을 때 — error 상태를 해제하고 입력칸에 포커스를 되돌리는 용도로도 쓰인다(AC-10) */
	onEssayWriteMode: () => void;
	/** 에러 상태의 "다시 시도" 링크 — onEssayGenerate와 동일 동작이되 별도 콜백으로 분리(위치가 다름) */
	onEssayRetry: () => void;
	/** 감상평 입력칸에 포커스될 때 — 부모가 키보드 위로 스크롤시키는 데 쓴다(rev1 onMemoFocus 역할 계승) */
	onEssayFocus?: () => void;
	/**
	 * "다음" 버튼의 유일한 실질 트리거(AC-11). 입력칸이 `multiline`이므로 RN에서 엔터 키는 기본적으로 줄바꿈을 삽입하고
	 * `onSubmitEditing`(키보드 "완료")은 플랫폼(특히 Android)에 따라 안정적으로 발화하지 않는다 — 문단 중간 줄바꿈과
	 * "완료" 의도를 엔터 하나로 구분할 방법이 없다. 따라서 이 컴포넌트는 `returnKeyType`/`onSubmitEditing`을 감상평
	 * `TextInput`에 연결하지 않는다(AC-11의 "키보드 완료 키" 경로는 멀티라인 입력에서 사실상 도달 불가능함을 인지하고
	 * 의도적으로 미구현 — Chris는 이를 버그로 오인해 별도 대응을 시도할 필요 없음). "다음" 버튼 탭이 서명 단계로
	 * 진입하는 유일한 실질 경로다. 스트리밍 중에는 호출되지 않도록 부모/컴포넌트 양쪽에서 가드(AC-12).
	 */
	onEssayNext: () => void;
}
```

**`EssayInputSection`의 props는 위 essay 관련 10개 필드(`essayText`~`onEssayNext`) + `stamped`와 동일하다** — `ReceiptSummary`는 그대로 pass-through한다.

**`onMemoDone` 폐기, `onEssayNext`로 대체**: rev1의 `onMemoDone`(의미가 이미 한 번 바뀐 이력이 있는 이름)은 완전히 폐기하고 `onEssayNext`로 새로 명명한다 — "감상평 섹션 완료 → 서명 진입"이라는 단일 의미만 가지므로 개명 이력에 따른 혼란을 끊는다(spec Feature breakdown #8과 일치).

**재생성 카운터 소유**: `essayGenerateCount`는 `confirm-visits.tsx`가 소유하며 "생성하기"를 누를 때마다(정상 생성이든 에러 후 재시도든 구분 없이) 1씩 증가한다. 이 단일 카운터 방식은 `01-spec.md` Open questions 확정 섹션이 **Chris 구현 판단으로 위임하며 권장한 안**("하나의 카드 세션 동안 '생성하기' 버튼을 누른 총 횟수를 5회로 제한하는 단일 카운터 — 정상 재생성과 오류 재시도를 구분하지 않는 편이 단순함")을 Sam이 디자인 확정값으로 채택한 것이다 — spec 자체가 이 값을 확정한 것은 아니므로 "spec 확정 사항"이 아니라 "Sam이 spec의 권장안을 채택함"으로 정확히 표기한다. `EssayInputSection`은 `essayGenerateCount >= 5`일 때 토글 "생성하기" 세그먼트를 disabled로 렌더링하고 `onEssayGenerate`를 호출하지 않는다(AC-15). 네트워크/서버 재시도 소진 여부는 이 카운터와 별개인 `essayRetriesExhausted`(§Component contract)로 나타낸다(§4 Blocker 대응).

## Copy (KO)

| Element                                                                                                                                        | Text                                           |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 감상평 라벨(작은 헤더)                                                                                                                         | 감상평                                         |
| 감상평 placeholder                                                                                                                             | 오늘 관람의 감상을 남겨보세요                  |
| 토글 — 직접 쓰기                                                                                                                               | 직접 쓰기                                      |
| 토글 — 생성하기(잔여 있음)                                                                                                                     | 생성하기                                       |
| 토글 헬퍼 텍스트(잔여 있음)                                                                                                                    | {5 - essayGenerateCount}회 더 생성할 수 있어요 |
| 토글 헬퍼 텍스트(소진)                                                                                                                         | 오늘은 더 생성할 수 없어요                     |
| 잠금 상태 배지(작은 텍스트, 인디케이터 옆)                                                                                                     | 생성 중                                        |
| 에러 메시지(재시도 가능 — `essayRetriesExhausted === false`)                                                                                   | 감상 생성에 실패했어요                         |
| 에러 메시지(재시도 소진 — `essayRetriesExhausted === true`. 네트워크/서버 오류 자체 재시도 카운트, `essayGenerateCount`(재생성 카운트)와 별개) | 잠시 후 다시 시도해 주세요                     |
| 에러 상태 — 재시도 링크                                                                                                                        | 다시 시도                                      |
| 에러 상태 — 직접 쓰기 전환 링크                                                                                                                | 직접 쓰기로 전환                               |
| 완료 버튼                                                                                                                                      | 다음                                           |

## States

- **일반(직접 쓰기 / idle / done 공통)**: `rounded-2xl border border-gray300 bg-gray100` 박스, `editable={true}`, placeholder 또는 현재 텍스트 표시. 별점을 처음 매긴 순간 입력칸에 자동 포커스(rev1 `hasFocusedMemoRef` 패턴 그대로 유지, spec Open Questions 확정). 생성 완료 직후에도 이 상태로 돌아와 자유 편집 가능(AC-7) — rev1처럼 별도 "완료" 화면이 없다.
- **잠금(streaming)**: 박스 배경 `bg-gray200`로 전환, `editable={false}`, 박스 우측 상단에 작은 `ActivityIndicator` + "생성 중" 텍스트 배지. 토글의 두 세그먼트 모두 이 상태에서는 비활성(재입력/재생성 요청 방지). "다음" 버튼도 비활성(AC-12). 스트리밍 델타가 도착할 때마다 박스 안 텍스트가 점진적으로("주루루룩") 늘어난다(AC-6, `CHAR_INTERVAL_MS` 문자 단위 표시 패턴 재사용).
- **에러**: `editable={true}`(AC-10 — 사용자가 바로 직접 쓸 수 있어야 함), 박스 테두리만 `border-error`(2px)로 강조. 박스 아래 경고 아이콘 + 에러 메시지 + "다시 시도"/"직접 쓰기로 전환" 링크 2개. `essayRetriesExhausted`에 따라 에러 메시지 문구가 전환된다 — `false`면 "감상 생성에 실패했어요"(다시 시도 가능), `true`면 "잠시 후 다시 시도해 주세요"(§Copy 참고). "직접 쓰기로 전환"을 누르면 에러 상태가 해제되고 입력칸에 포커스가 돌아간다(내용은 에러 발생 직전 값 유지 — 스트리밍이 일부 도착했다면 그 델타까지는 남아있을 수 있음, 정확한 폐기 범위는 Chris 구현 판단).
- **재생성 5회 소진**: 토글 "생성하기" 세그먼트가 `bg-gray400` + 흰 텍스트(disabled 표준 조합)로 바뀌고 탭해도 반응하지 않으며, 헬퍼 텍스트가 "오늘은 더 생성할 수 없어요"로 바뀐다(AC-15). "직접 쓰기"는 계속 사용 가능.
- **토글 선택 상태(`essayInputMode`)**: `essayStage`(생성 진행 단계)와는 별도 축으로, 두 세그먼트 중 어느 쪽이 시각적으로 active인지를 결정한다. 기본값은 `'write'`(자동 포커스와 함께). 사용자가 "생성하기"를 탭하면 즉시 `essayInputMode='generate'`로 전환되고, 그 상태로 스트리밍이 시작·완료된다 — **생성 완료(`essayStage==='done'`) 후에도 `essayInputMode`는 `'generate'`로 유지**되며 자동으로 `'write'`로 돌아가지 않는다(생성된 텍스트를 계속 자유 편집할 수 있으므로, "생성하기"가 순간 액션이 아니라 이 입력칸의 출처를 나타내는 지속 상태이기 때문). 사용자가 입력칸을 직접 탭하거나 "직접 쓰기" 세그먼트를 눌러야만(`onEssayWriteMode`) `essayInputMode='write'`로 되돌아간다. 에러 상태에서 "직접 쓰기로 전환" 링크를 누르는 것도 동일하게 `onEssayWriteMode`를 호출해 `'write'`로 전환한다(§Component contract, §6 Blocker 대응).
- **stamped(확정 완료) 상태**: 다른 단계와 동일 규칙 — 값은 유지하고 인터랙션 요소만 숨긴다. 입력칸은 `editable={false}`이지만 마지막 감상평 텍스트를 그대로 표시하고, 토글/재생성 헬퍼 텍스트/"다음" 버튼은 `{!stamped && ...}`로 숨긴다. 다이어리 등에서 확정된 카드를 다시 조회할 때 감상평이 사라지는 회귀를 막기 위함(rev1과 동일 원칙 계승).

## Accessibility

- 감상평 `TextInput`: `accessibilityLabel="감상평 입력"`(기존 한줄평 입력칸의 accessibilityLabel을 대체) + 잠금 상태에서 `accessibilityState={{ disabled: true }}`.
- 토글 두 세그먼트: 각각 `accessibilityRole="button"` + `accessibilityState={{ selected, disabled }}` — "직접 쓰기" 세그먼트는 `selected={essayInputMode === 'write'}`, "생성하기" 세그먼트는 `selected={essayInputMode === 'generate'}`로, 값 소스는 §Component contract `essayInputMode`(§6 Blocker 대응). 텍스트는 `text-[14px] font-pretendard-medium`(고정 — line-height ≈ 20px)로 명시하고, 세로 패딩은 `py-3.5`로 확정한다 — 20(텍스트) + 14(상)×2 = 48pt ≥ 44pt(Apple HIG), 여유 4pt 확보. `py-3`(48px 미만 가능성)는 채택하지 않는다. 별도 hitSlop 불필요.
- 에러 상태 텍스트 링크("다시 시도"/"직접 쓰기로 전환"): `accessibilityRole="button"` + `accessibilityLabel` + `hitSlop={16}`(rev1 Alex 지적으로 확정된 33pt 미달 문제 재발 방지 — 계산 근거는 rev1 브리프와 동일: `text-[12px]` 렌더 높이 ~17px + hitSlop 16×2 = 49pt, 44pt 기준 대비 5pt 여유).
- "다음" 버튼: 기존 CTA와 동일하게 `py-3` 이상, 44pt 이상 확보. 스트리밍 중 비활성화 시에도 `accessibilityState={{ disabled: true }}`를 함께 둬 스크린리더 사용자에게 전달한다.
- 스트리밍 중 텍스트 갱신: 화면 낭독기가 매 델타마다 반복 낭독하지 않도록 `accessibilityLiveRegion` 등 실시간 알림은 걸지 않는다(rev1 `description.tsx`와 동일 기조) — 입력칸이 잠겨 포커스를 옮기지 않는 한 낭독기가 스트리밍 중간값을 계속 읽지 않는다.
- Contrast: `bg-primary-dark` + `text-white`(토글 active, 완료 버튼) 6.61:1 통과. 토글 inactive `bg-gray200`(#F2EFE9) + `text-gray700`(#57534E)의 실제 인접 배경(흰 카드가 아니라 `bg-gray200` 자체)으로 재계산한 대비는 **6.66:1**(순백 배경 기준 7.63:1보다 약 13% 낮음)이며 AA 4.5:1 기준을 상회한다.
- Contrast(에러): `text-error`(#EF4444)는 흰 배경 대비 3.76:1로 본문 텍스트 AA 기준(4.5:1) 미달 — rev1과 동일하게 **아이콘·보더에만** 사용하고, 에러 메시지 본문 텍스트는 `text-gray700`(7.63:1)로 렌더링한다. 입력 박스의 에러 보더(`border-error`, 2px)는 그래픽 요소이므로 WCAG 비텍스트 대비 기준 3:1 적용 — 실제 인접 배경은 흰 카드가 아니라 입력 박스 배경 `bg-gray100`(#F8F6F2)이므로, 이 배경 기준 재계산 대비는 **3.49:1**(흰 배경 기준 3.76:1보다 낮음)로 3:1 기준은 여전히 통과한다.

## Prototype scope

- [x] Static layout only (일반 / 잠금 / 에러 / 5회 소진 4개 시각 상태를 정적 스크린샷으로 확인)
- [x] Navigation wired (별점 → 감상평 → "다음" → 서명 단계 전환 흐름, rev1 대비 단계 하나 단순화)
- [ ] Fake data / stub API (실제 `streamChat` 연동은 Chris 구현 단계에서 진행 — 프로토타입은 상태만 시뮬레이션)

## Out of design scope

- 감상평 버전 히스토리/되돌리기 UI — spec Non-goals에 따라 이번 범위 아님("생성하기" 재실행 시 조용히 대체, 확인 다이얼로그 없음 — spec Open Questions 확정 사항).
- 감상평 TTS 재생 버튼 — spec Non-goals에 따라 이번 범위 아님.
- 기존 `confirmed` 상태 rev1 기록의 마이그레이션 UI(데이터 이관은 `memo`/`essay` 필드 병합 로직으로 처리되며 화면 UI 변경은 없음) — spec Open Questions 확정 사항이나 UI 산출물은 없음.
- `app/diary/[date].tsx`의 기존 "메모 편집 모달" UI 변경 — 이번 spec은 `confirm-visits` 큐 진행 중에만 적용되며, 확정 후 조회/편집 화면의 카피·레이아웃은 이번 범위에 포함하지 않는다(rev1과 동일 스코프 경계).
