import { Text, View } from 'react-native';

// 코드로 그린 관람 완료 도장
export function VisitStamp() {
	return (
		<View className='items-center justify-center rounded-full w-[78px] h-[78px] rotate-[-14deg] opacity-85 border-orange-700 border-[2.5px]'>
			<View className='items-center justify-center rounded-full w-[66px] h-[66px] border-orange-700 border'>
				<Text className='text-[13px] font-hahmlet-bold text-orange-700'>관람 완료</Text>
			</View>
		</View>
	);
}
