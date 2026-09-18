import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
	runOnJS,
} from 'react-native-reanimated';

const TOAST_DURATION = 2000;
const FADE_DURATION = 200;

interface ToastOptions {
	/** safe area 하단 기준 오프셋(px). 화면에 하단 FAB·CTA가 있어 기본 위치와 겹칠 때 지정한다. */
	bottomOffset?: number;
}

interface ToastContextValue {
	showToast: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastProviderProps {
	children: ReactNode;
}

/** 하단 safe area 위에 짧게 뜨는 다크 토스트. 중복 호출 시 기존 토스트를 새 메시지로 교체한다. */
export function ToastProvider({ children }: ToastProviderProps) {
	const insets = useSafeAreaInsets();
	const [message, setMessage] = useState<string | null>(null);
	const [bottomOffset, setBottomOffset] = useState(0);
	const opacity = useSharedValue(0);
	const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const clearMessage = useCallback(() => {
		setMessage(null);
	}, []);

	const showToast = useCallback(
		(nextMessage: string, options?: ToastOptions) => {
			if (hideTimer.current) clearTimeout(hideTimer.current);

			setMessage(nextMessage);
			setBottomOffset(options?.bottomOffset ?? 0);
			opacity.set(withTiming(1, { duration: FADE_DURATION }));

			hideTimer.current = setTimeout(() => {
				opacity.set(
					withTiming(0, { duration: FADE_DURATION }, (finished) => {
						if (finished) runOnJS(clearMessage)();
					}),
				);
			}, TOAST_DURATION);
		},
		[clearMessage, opacity],
	);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			{message && (
				<Animated.View
					pointerEvents="none"
					className="absolute left-6 right-6 items-center"
					style={[{ bottom: insets.bottom + 16 + bottomOffset }, animatedStyle]}
				>
					<Text
						className="rounded-full bg-gray900 px-5 py-3 text-center text-[14px] text-gray100 font-pretendard-medium"
						accessibilityLiveRegion="polite"
					>
						{message}
					</Text>
				</Animated.View>
			)}
		</ToastContext.Provider>
	);
}

/** 화면 어디서든 showToast(message)로 토스트를 띄운다. ToastProvider 하위에서만 사용 가능. */
export function useToast() {
	const context = useContext(ToastContext);

	if (!context) {
		throw new Error('useToast는 ToastProvider 내부에서만 사용할 수 있습니다');
	}

	return context;
}
