import { isInlineImageUri, isManagedVisitPhoto, isRemotePhotoUri } from '../visitPhotoFiles';

describe('visitPhotoFiles URI 분류', () => {
	it('원격 URL과 인라인 data URI를 구분한다', () => {
		expect(isRemotePhotoUri('https://example.com/t.jpg')).toBe(true);
		expect(isRemotePhotoUri('file:///var/ticket.jpg')).toBe(false);
		expect(isInlineImageUri('data:image/jpeg;base64,/9j/4AAQ')).toBe(true);
		expect(isInlineImageUri('file:///var/ticket.jpg')).toBe(false);
	});

	it('문서 디렉터리에 복사한 사진만 managed로 본다', () => {
		expect(isManagedVisitPhoto('file:///data/visit-photos/1.jpg')).toBe(true);
		expect(isManagedVisitPhoto('file:///cache/ImagePicker/1.jpg')).toBe(false);
	});
});
