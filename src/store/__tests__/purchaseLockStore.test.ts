import { usePurchaseLockStore } from '../purchaseLockStore';

beforeEach(() => {
	usePurchaseLockStore.setState({ isLocked: false });
});

describe('usePurchaseLockStore', () => {
	it('초기 상태는 unlocked다', () => {
		expect(usePurchaseLockStore.getState().isLocked).toBe(false);
	});

	it('lock() 호출 시 isLocked가 true가 된다', () => {
		usePurchaseLockStore.getState().lock();
		expect(usePurchaseLockStore.getState().isLocked).toBe(true);
	});

	it('unlock() 호출 시 isLocked가 false가 된다', () => {
		usePurchaseLockStore.getState().lock();
		usePurchaseLockStore.getState().unlock();
		expect(usePurchaseLockStore.getState().isLocked).toBe(false);
	});

	it('모듈 전역 store이므로 화면 unmount와 무관하게 상태가 유지된다(재구독해도 동일 인스턴스)', () => {
		usePurchaseLockStore.getState().lock();
		// premium 화면이 unmount된 뒤 루트가 다시 구독해도 같은 store 인스턴스를 읽는다.
		expect(usePurchaseLockStore.getState().isLocked).toBe(true);
	});
});
