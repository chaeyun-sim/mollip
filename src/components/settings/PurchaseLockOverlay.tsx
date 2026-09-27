import { useEffect } from 'react';
import { BackHandler, View } from 'react-native';
import { Indicator } from '@/src/components/common/Indicator';
import { usePurchaseLockStore } from '@/src/store/purchaseLockStore';

/**
 * 구매 완료 처리(구독 동기화 + 화면 전환) 중 터치·뒤로가기를 막는 루트 전역 오버레이.
 * app/_layout.tsx에 마운트해 premium 화면이 unmount된 뒤에도 계속 보인다.
 *
 * 네이티브 Modal을 쓰지 않는다. Modal이 떠 있는 채로 router.back()이 실행되고
 * 그 다음 Modal이 닫히면, iOS는 드러난 화면의 터치 전달을 복구하지 못한다.
 * 스크롤과 버튼이 모두 죽은 채로 남는다. 절대 위치 View는 터치를 같은 방식으로
 * 막으면서 네이티브 모달 윈도우를 만들지 않는다.
 * Android 하드웨어 뒤로가기는 BackHandler로 흡수한다. 스와이프 제스처는
 * 루트 Stack과 settings Stack의 gestureEnabled로 막는다.
 */
export function PurchaseLockOverlay() {
	const isLocked = usePurchaseLockStore((s) => s.isLocked);

	useEffect(() => {
		if (!isLocked) return;
		const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
		return () => subscription.remove();
	}, [isLocked]);

	if (!isLocked) return null;

	return (
		<View
			pointerEvents="auto"
			accessibilityViewIsModal
			accessibilityLabel="구매 처리 중"
			className="absolute inset-0 z-50 items-center justify-center bg-black/60"
		>
			<Indicator color="white" size="large" />
		</View>
	);
}
