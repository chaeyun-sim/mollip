import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
	visible: boolean;
	value: Date;
	onChange: (date: Date) => void;
	onDismiss: () => void;
	onReset?: () => void;
	resetLabel?: string;
	confirmLabel?: string;
};

export function DatePickerModal({
	visible,
	value,
	onChange,
	onDismiss,
	onReset,
	resetLabel = '오늘로 초기화',
	confirmLabel = '완료',
}: Props) {
	const insets = useSafeAreaInsets();
	const slideAnim = useRef(new Animated.Value(400)).current;

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
		<Modal visible={visible} transparent animationType='fade'>
			<Pressable
				className='flex-1 justify-end'
				style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
				onPress={onDismiss}
			>
				<Pressable onPress={(e) => e.stopPropagation()}>
					<Animated.View
						className='bg-white rounded-t-3xl'
						style={{ paddingBottom: insets.bottom + 8, transform: [{ translateY: slideAnim }] }}
					>
						<View className='items-center pt-3 pb-1'>
							<View className='w-9 h-1 rounded-full bg-black/15' />
						</View>
						<View className='flex-row justify-between items-center px-5 pt-2 pb-0'>
							{onReset ? (
								<Pressable onPress={() => { onReset(); onDismiss(); }}>
									<Text className='text-sm font-pretendard-medium text-black/40'>{resetLabel}</Text>
								</Pressable>
							) : (
								<View />
							)}
							<Pressable onPress={onDismiss} className='bg-black rounded-full px-4 py-1.5'>
								<Text className='text-sm font-pretendard-semibold text-white'>{confirmLabel}</Text>
							</Pressable>
						</View>
						<View className='w-full flex-row justify-center items-center h-[200px] mt-2'>
							<DateTimePicker
								value={value}
								mode='date'
								display='spinner'
								onValueChange={(_event: any, date: Date) => onChange(date)}
								style={{ height: '100%', width: '100%' }}
							/>
						</View>
					</Animated.View>
				</Pressable>
			</Pressable>
		</Modal>
	);
}
