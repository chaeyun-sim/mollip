const SENTENCE_END = /[.!?。…]/;

/** 글자 수 상한을 넘으면 상한 안에서 마지막으로 끝난 문장까지만 남긴다 — 끝난 문장이 없으면 상한에서 자른다 */
export const clipToSentence = (text: string, maxLength: number): string => {
	if (text.length <= maxLength) return text;

	const head = text.slice(0, maxLength);
	for (let i = head.length - 1; i > 0; i -= 1) {
		if (SENTENCE_END.test(head[i])) return head.slice(0, i + 1).trim();
	}
	return head;
};
