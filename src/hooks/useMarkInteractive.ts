import { useObserve } from 'expo-observe';
import { useEffect } from 'react';

export function useMarkInteractive() {
	const { markInteractive } = useObserve();

	useEffect(() => {
		void markInteractive();
	}, [markInteractive]);
}
