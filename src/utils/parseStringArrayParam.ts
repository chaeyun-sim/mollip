/** 라우트 파라미터로 넘긴 JSON 문자열 배열을 복원한다. 없거나 형식이 틀리면 undefined. */
export const parseStringArrayParam = (raw: string | undefined): string[] | undefined => {
	if (!raw) return undefined;
	try {
		const parsed: unknown = JSON.parse(raw);
		if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) return parsed;
	} catch {
		// 형식이 틀린 파라미터는 무시한다
	}
	return undefined;
};
