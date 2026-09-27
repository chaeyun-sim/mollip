export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/** HorizontalSection 등 아직 AsyncStatus를 받는 UI용 */
export function toAsyncStatus(isLoading: boolean, isError: boolean): AsyncStatus {
	if (isLoading) return 'loading';
	if (isError) return 'error';
	return 'success';
}
