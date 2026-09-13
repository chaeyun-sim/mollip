import { useEffect, type RefObject } from 'react';
import { AccessibilityInfo, findNodeHandle, View } from 'react-native';

/**
 * message가 바뀔 때마다 보이스오버/톡백에 1회 안내를 발화하고, targetRef로 접근성 포커스를 옮긴다.
 * 트레이 전환·바꾸기 완료 시 선택 결과와 진행 상태를 전달하는 데 쓴다 (AC-7).
 */
export function useAccessibilityAnnouncement(
	message: string | null,
	targetRef: RefObject<View | null>,
) {
	useEffect(() => {
		if (!message) return;

		AccessibilityInfo.announceForAccessibility(message);

		const node = targetRef.current;
		if (!node) return;
		const tag = findNodeHandle(node);
		if (tag) AccessibilityInfo.setAccessibilityFocus(tag);
		// message가 바뀔 때만 재발화한다 — targetRef는 안정적인 ref 객체이므로 의존성에서 제외해도 안전
	}, [message, targetRef]);
}
