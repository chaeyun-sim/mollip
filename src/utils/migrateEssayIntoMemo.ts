interface EssayMemoFields {
	memo?: string;
	essay?: string;
}

/**
 * rev1 확정 기록의 `essay`를 `memo`로 이관한다.
 * memo가 비어있으면 essay를 쓰고, 둘 다 값이 있으면 memo를 유지한 채 essay는 버린다.
 */
export function migrateEssayIntoMemo<T extends EssayMemoFields>(visit: T): T {
	if (visit.essay === undefined) return visit;

	const essay = visit.essay;
	const next = { ...visit };
	delete next.essay;

	if (!next.memo?.trim() && essay.trim()) {
		next.memo = essay;
	}

	return next;
}
