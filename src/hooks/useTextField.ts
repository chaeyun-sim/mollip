import { useCallback, useState } from 'react';

/** 입력하면 에러를 끄는 필드 상태. 검증은 setError(true)로 호출측에서 한다. */
export function useTextFieldError() {
	const [error, setError] = useState(false);

	const onChangeText = useCallback((write: (text: string) => void) => {
		return (text: string) => {
			setError(false);
			write(text);
		};
	}, []);

	return { error, setError, onChangeText };
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
