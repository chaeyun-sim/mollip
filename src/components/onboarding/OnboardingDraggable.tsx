import { useCallback, useMemo, useRef, type ReactNode } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

interface OnboardingDraggableProps {
	children: ReactNode;
	label: string;
	testID: string;
	disabled?: boolean;
	selected?: boolean;
	draggable?: boolean;
	style?: ViewStyle;
	onPress: (x: number, y: number) => void;
	onDrag: (x: number, y: number, phase: 'start' | 'move' | 'end' | 'cancel') => void;
}

export function OnboardingDraggable({
	children,
	label,
	testID,
	disabled = false,
	selected = false,
	draggable = true,
	style,
	onPress,
	onDrag,
}: OnboardingDraggableProps) {
	const ref = useRef<React.ElementRef<typeof Pressable>>(null);
	const dragging = useRef(false);
	const suppressPress = useRef(false);
	const gesture = useMemo(
		() =>
			Gesture.Pan()
				.enabled(draggable && !disabled)
				.activateAfterLongPress(220)
				.runOnJS(true)
				// gesture-handler는 이 콜백들을 렌더 이후 제스처 이벤트 시점에만 실행한다 — ref 접근은 안전하다
				// eslint-disable-next-line react-hooks/refs
				.onStart((event) => {
					dragging.current = true;
					suppressPress.current = true;
					onDrag(event.absoluteX, event.absoluteY, 'start');
				})
				.onUpdate((event) => onDrag(event.absoluteX, event.absoluteY, 'move'))
				// eslint-disable-next-line react-hooks/refs
				.onEnd((event) => {
					dragging.current = false;
					onDrag(event.absoluteX, event.absoluteY, 'end');
				})
				// eslint-disable-next-line react-hooks/refs
				.onFinalize((event, success) => {
					if (dragging.current && !success) onDrag(event.absoluteX, event.absoluteY, 'cancel');
					dragging.current = false;
				}),
		[draggable, disabled, onDrag],
	);
	const handlePress = useCallback(() => {
		if (suppressPress.current) {
			suppressPress.current = false;
			return;
		}
		ref.current?.measureInWindow((x, y, width, height) => onPress(x + width / 2, y + height / 2));
	}, [onPress]);
	const handlePressIn = useCallback(() => {
		suppressPress.current = false;
	}, []);

	return (
		<GestureDetector gesture={gesture}>
			<Pressable
				ref={ref}
				testID={testID}
				disabled={disabled}
				accessibilityRole="button"
				accessibilityLabel={label}
				accessibilityState={{ disabled, selected }}
				onPress={handlePress}
				onPressIn={handlePressIn}
				style={style}
			>
				{children}
			</Pressable>
		</GestureDetector>
	);
}
