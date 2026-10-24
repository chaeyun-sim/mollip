import { Directory, File, Paths } from 'expo-file-system';

interface VisitPhotoFields {
	thumbnail?: string;
	venuePhotos?: string[];
}

export const VISIT_PHOTO_DIR_NAME = 'visit-photos';

export const getVisitPhotoDirectory = (): Directory => {
	return new Directory(Paths.document, VISIT_PHOTO_DIR_NAME);
};

export const isRemotePhotoUri = (uri: string): boolean => {
	return uri.startsWith('http://') || uri.startsWith('https://');
};

export const isInlineImageUri = (uri: string): boolean => {
	return uri.startsWith('data:');
};

export const isManagedVisitPhoto = (uri: string): boolean => {
	return uri.includes(`/${VISIT_PHOTO_DIR_NAME}/`);
};

const ensureVisitPhotoDirectory = (): Directory => {
	const dir = getVisitPhotoDirectory();
	if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
	return dir;
};

const extensionFromUri = (uri: string): string => {
	if (uri.startsWith('data:image/png')) return 'png';
	if (uri.startsWith('data:image/webp')) return 'webp';
	if (uri.startsWith('data:image/heic')) return 'heic';
	const clean = uri.split('?')[0] ?? uri;
	const match = clean.match(/\.(jpe?g|png|heic|webp)$/i);
	if (!match) return 'jpg';
	return match[1].toLowerCase().replace('jpeg', 'jpg');
};

const extractBase64Payload = (dataUri: string): string => {
	const commaIndex = dataUri.indexOf(',');
	return commaIndex === -1 ? dataUri : dataUri.slice(commaIndex + 1);
};

const nextPhotoFile = (ext: string): File => {
	return new File(
		ensureVisitPhotoDirectory(),
		`${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`,
	);
};

/**
 * 캐시/인라인 이미지를 문서 디렉터리의 .jpg 등으로 복사하고, 그 경로만 반환한다.
 * 원격 URL은 그대로 두고, 복사에 실패하거나 인라인을 파일로 못 바꾸면 null.
 */
export const persistLocalVisitPhoto = (uri: string): string | null => {
	if (!uri) return null;
	if (isRemotePhotoUri(uri)) return uri;
	if (isManagedVisitPhoto(uri)) return uri;

	try {
		if (isInlineImageUri(uri)) {
			const file = nextPhotoFile(extensionFromUri(uri));
			if (file.exists) file.delete();
			file.create();
			file.write(extractBase64Payload(uri), { encoding: 'base64' });
			return file.uri;
		}

		const source = new File(uri);
		if (!source.exists) return null;
		const dest = nextPhotoFile(extensionFromUri(uri));
		if (dest.exists) dest.delete();
		source.copySync(dest);
		return dest.uri;
	} catch (error) {
		console.warn('[visit] persist local photo failed:', error);
		return isInlineImageUri(uri) ? null : uri;
	}
};

export const persistVisitPhotoFields = <T extends VisitPhotoFields>(visit: T): T => {
	const thumbnail = visit.thumbnail
		? (persistLocalVisitPhoto(visit.thumbnail) ?? undefined)
		: undefined;
	const venuePhotos = visit.venuePhotos
		?.map((uri) => persistLocalVisitPhoto(uri))
		.filter((uri): uri is string => Boolean(uri));
	return { ...visit, thumbnail, venuePhotos };
};

export const deleteManagedVisitPhotos = (visit: VisitPhotoFields | undefined): void => {
	if (!visit) return;
	const uris = [visit.thumbnail, ...(visit.venuePhotos ?? [])].filter(
		(uri): uri is string => typeof uri === 'string' && isManagedVisitPhoto(uri),
	);
	for (const uri of uris) {
		try {
			const file = new File(uri);
			if (file.exists) file.delete();
		} catch {
			// 파일이 이미 없으면 무시
		}
	}
};
