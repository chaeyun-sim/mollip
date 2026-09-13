import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { PanResponder, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export interface SignaturePadHandle {
	clear: () => void;
	/** 그려진 스트로크가 없으면 null */
	getSvg: () => string | null;
}

interface SignaturePadProps {
	width: number;
	height: number;
	onStrokeChange?: (hasStrokes: boolean) => void;
	/** true면 터치를 받지 않는다 — 도장 찍힌 뒤에도 계속 그려지는 걸 막는 용도 */
	disabled?: boolean;
}

const INK_COLOR = '#1C1917';

// 손그림 서명 캡처 — react-native-svg만으로 구현(신규 네이티브 모듈 없음). 서명은 SVG 마크업 문자열로 저장된다.
export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(function SignaturePad(
	{ width, height, onStrokeChange, disabled },
	ref,
) {
	const [paths, setPaths] = useState<string[]>([]);
	const [currentPath, setCurrentPath] = useState('');
	const pathsRef = useRef<string[]>([]);
	const currentPathRef = useRef('');
	const disabledRef = useRef(disabled);
	disabledRef.current = disabled;

	const endStroke = () => {
		if (currentPathRef.current) {
			pathsRef.current = [...pathsRef.current, currentPathRef.current];
			setPaths(pathsRef.current);
			onStrokeChange?.(true);
		}
		currentPathRef.current = '';
		setCurrentPath('');
	};

	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => !disabledRef.current,
			onMoveShouldSetPanResponder: () => !disabledRef.current,
			// 부모 ScrollView보다 먼저 터치를 가져온다 — 서명 중 페이지가 밀리지 않게.
			onStartShouldSetPanResponderCapture: () => !disabledRef.current,
			onMoveShouldSetPanResponderCapture: () => !disabledRef.current,
			// 스크롤/스와이프-백 제스처가 그리는 도중에 응답자를 가로채지 못하게 막는다
			// (그렇지 않으면 스트로크가 도중에 끊기거나 사라진 것처럼 보인다)
			onPanResponderTerminationRequest: () => false,
			onShouldBlockNativeResponder: () => true,
			onPanResponderGrant: (evt) => {
				const { locationX, locationY } = evt.nativeEvent;
				// 시작점에 아주 작은 선분을 하나 더 붙여둔다 — 순간 탭처럼 move 이벤트가 하나도
				// 안 잡히는 경우, "M x,y" 단독 경로는 길이가 0이라 화면에 아예 안 그려진다.
				currentPathRef.current = `M${locationX.toFixed(1)},${locationY.toFixed(1)} L${(locationX + 0.1).toFixed(1)},${(locationY + 0.1).toFixed(1)}`;
				setCurrentPath(currentPathRef.current);
			},
			onPanResponderMove: (evt) => {
				const { locationX, locationY } = evt.nativeEvent;
				currentPathRef.current += ` L${locationX.toFixed(1)},${locationY.toFixed(1)}`;
				setCurrentPath(currentPathRef.current);
			},
			onPanResponderRelease: endStroke,
			onPanResponderTerminate: endStroke,
		}),
	).current;

	useImperativeHandle(
		ref,
		() => ({
			clear: () => {
				pathsRef.current = [];
				setPaths([]);
				setCurrentPath('');
				currentPathRef.current = '';
				onStrokeChange?.(false);
			},
			getSvg: () => {
				if (pathsRef.current.length === 0) return null;
				const strokes = pathsRef.current
					.map(
						(d) =>
							`<path d="${d}" stroke="${INK_COLOR}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" />`,
					)
					.join('');
				return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${strokes}</svg>`;
			},
		}),
		[width, height, onStrokeChange],
	);

	const hasStrokes = paths.length > 0 || currentPath.length > 0;

	return (
		<View
			className="rounded-2xl border-[1.5px] border-dashed border-gray300 bg-white overflow-hidden items-center justify-center"
			style={{ width, height }}
			accessibilityLabel="서명 캔버스"
			{...panResponder.panHandlers}
		>
			{!hasStrokes && (
				<Text className="font-nanum-pen text-[22px] text-gray500">여기에 서명해주세요</Text>
			)}
			<Svg width={width} height={height} style={{ position: 'absolute' }}>
				{paths.map((d, i) => (
					<Path
						key={i}
						d={d}
						stroke={INK_COLOR}
						strokeWidth={3}
						fill="none"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				))}
				{currentPath && (
					<Path
						d={currentPath}
						stroke={INK_COLOR}
						strokeWidth={3}
						fill="none"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				)}
			</Svg>
		</View>
	);
});
