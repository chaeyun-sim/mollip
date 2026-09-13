import { useCallback, useState } from 'react';

/** 입력값과 에러를 함께 둔다. 타이핑하면 에러는 꺼진다. */
export function useTextField(initial = '') {
	const [value, setValue] = useState(initial);
	const [error, setError] = useState(false);

	const onChangeText = useCallback((text: string) => {
		setValue(text);
		setError(false);
	}, []);

	return { value, error, setError, onChangeText };
}

/** 멀티라인에서 줄바꿈이 들어오면 전송하고, 그 외에는 onChange에 넘긴다. */
export function useSubmitOnNewline(onSubmit: () => void) {
	return useCallback(
		(onChange: (text: string) => void) => {
			return (text: string) => {
				if (text.endsWith('\n')) {
					onSubmit();
					return;
				}

				onChange(text);
			};
		},
		[onSubmit],
	);
}
