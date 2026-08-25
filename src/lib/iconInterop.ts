import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';

/**
 * 벡터 아이콘은 폰트 글리프라 기본적으로 className이 안 먹는다.
 * className의 색상 유틸(text-*)을 style.color로 매핑해 color prop처럼 동작하게 등록한다.
 * 앱 시작 시 한 번만 import되면 되므로 app/_layout.tsx 최상단에서 import한다.
 */
const iconInteropOptions = {
	className: {
		target: 'style',
		nativeStyleToProp: { color: true },
	},
} as const;

cssInterop(Ionicons, iconInteropOptions);
cssInterop(MaterialCommunityIcons, iconInteropOptions);
