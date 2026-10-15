import { useEffect, useState } from 'react';

const DEFAULT_DURATION_MS = 700;

/** 0에서 target까지 숫자가 올라가는 값 — target이 바뀌면 다시 센다 (ease-out) */
export function useCountUp(target: number, { duration = DEFAULT_DURATION_MS, delay = 0 } = {}) {
	const [value, setValue] = useState(0);

	useEffect(() => {
		let frame = 0;
		let start: number | null = null;

		const tick = (now: number) => {
			if (start === null) start = now;
			const progress = Math.min(1, Math.max(0, (now - start - delay) / duration));
			const eased = 1 - (1 - progress) ** 3;
			setValue(Math.round(target * eased));
			if (progress < 1) frame = requestAnimationFrame(tick);
		};

		setValue(0);
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [target, duration, delay]);

	return value;
}
