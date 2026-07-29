import { useEffect, useState } from 'react';
import { Image } from 'react-native';

const MIN_RATIO = 0.6; // 세로로 지나치게 긴 이미지 방지
const MAX_RATIO = 1.9; // 가로로 지나치게 넓은 이미지 방지

export function useImageAspectRatio(uri: string | undefined, fallback = 3 / 4): number {
	const [ratio, setRatio] = useState(fallback);

	useEffect(() => {
		if (!uri) return;
		let cancelled = false;
		Image.getSize(
			uri,
			(width, height) => {
				if (cancelled || height <= 0) return;
				const clamped = Math.min(MAX_RATIO, Math.max(MIN_RATIO, width / height));
				setRatio(clamped);
			},
			() => {},
		);
		return () => {
			cancelled = true;
		};
	}, [uri]);

	return ratio;
}
