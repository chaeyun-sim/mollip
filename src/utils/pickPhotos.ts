import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

/** 앨범에서 사진을 고른다 — 권한이 없으면 안내 후 빈 배열 */
export const pickPhotos = async ({ limit = 1 }: { limit?: number } = {}): Promise<string[]> => {
	const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
	if (!permission.granted) {
		Alert.alert('권한 필요', '사진을 선택하려면 설정에서 사진 접근을 허용해 주세요.');
		return [];
	}

	const result = await ImagePicker.launchImageLibraryAsync({
		quality: 0.8,
		mediaTypes: ['images'],
		allowsMultipleSelection: limit > 1,
		selectionLimit: limit,
	});
	if (result.canceled) return [];
	return result.assets.map((asset) => asset.uri).slice(0, limit);
};
