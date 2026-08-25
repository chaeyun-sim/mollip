import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DatePickerModalProps {
	/**
	 * 모달 표시 여부
	 */
	visible: boolean;
	/**
	 * 선택된 날짜
	 */
	value: Date;
	/**
	 * 날짜 변경 시 호출되는 함수
	 */
	onChange: (date: Date) => void;
	/**
	 * 모달 닫기 시 호출되는 함수
	 */
	onDismiss: () => void;
	/**
	 * 초기화 버튼 클릭 시 호출되는 함수
	 */
	onReset?: () => void;
	/**
	 * 초기화 버튼 레이블
	 */
	resetLabel?: string;
	/**
	 * 확인 버튼 레이블
	 */
	confirmLabel?: string;
}

export function DatePickerModal({
	visible,
	value,
	onChange,
	onDismiss,
	onReset,
	resetLabel = '오늘로 초기화',
	confirmLabel = '완료',
}: DatePickerModalProps) {
	const insets = useSafeAreaInsets();
	const slideAnim = useRef(new Animated.Value(400)).current;
	const [draft, setDraft] = useState(value);

	// 모달 열릴 때마다 현재 적용된 날짜로 draft 초기화
	useEffect(() => {
		if (visible) setDraft(value);
	}, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (visible) {
			Animated.spring(slideAnim, {
				toValue: 0,
				useNativeDriver: true,
				tension: 65,
				friction: 11,
			}).start();
		} else {
			Animated.timing(slideAnim, {
				toValue: 400,
				duration: 220,
				useNativeDriver: true,
			}).start();
		}
	}, [visible, slideAnim]);

	return (
		<Modal visible={visible} transparent animationType="fade">
			<Pressable className="flex-1 justify-end bg-black/35" onPress={onDismiss}>
				<Pressable onPress={(e) => e.stopPropagation()}>
					<Animated.View
						className="bg-white rounded-t-3xl"
						style={{
							paddingBottom: insets.bottom + 8,
							transform: [{ translateY: slideAnim }],
						}}
					>
						<View className="items-center pt-3 pb-1">
							<View className="w-9 h-1 rounded-full bg-black/15" />
						</View>
						<View className="flex-row justify-between items-center px-5 pt-2 pb-0">
							{onReset ? (
								<Pressable
									onPress={() => {
										onReset();
										onDismiss();
									}}
								>
									<Text className="text-sm font-pretendard-medium text-black/40">{resetLabel}</Text>
								</Pressable>
							) : (
								<View />
							)}
							<Pressable
								onPress={() => {
									onChange(draft);
									onDismiss();
								}}
								className="bg-black rounded-full px-4 py-1.5"
							>
								<Text className="text-sm font-pretendard-semibold text-white">{confirmLabel}</Text>
							</Pressable>
						</View>
						<View className="w-full flex-row justify-center items-center h-[200px] mt-2">
							<DateTimePicker
								value={draft}
								mode="date"
								display="spinner"
								onValueChange={(_event: any, date: Date) => setDraft(date)}
								className="h-full w-full"
							/>
						</View>
					</Animated.View>
				</Pressable>
			</Pressable>
		</Modal>
	);
}
