import { Ionicons } from '@expo/vector-icons';
import { Pressable, TextInput, View } from 'react-native';

type Props = {
	value: string;
	onChangeText: (text: string) => void;
	placeholder?: string;
};

export function SearchBar({
	value,
	onChangeText,
	placeholder = '검색',
}: Props) {
	return (
		<View
			className='flex-row items-center bg-white rounded-2xl px-3 py-2.5 gap-2'
			style={{
				shadowColor: '#000',
				shadowOpacity: 0.12,
				shadowRadius: 8,
				shadowOffset: { width: 0, height: 2 },
				elevation: 4,
			}}
		>
			<Ionicons name='search' size={16} color='rgba(0,0,0,0.35)' />
			<TextInput
				className='flex-1 text-black text-sm font-pretendard-regular'
				style={{ lineHeight: 0 }}
				placeholder={placeholder}
				placeholderTextColor='rgba(0,0,0,0.3)'
				value={value}
				onChangeText={onChangeText}
				returnKeyType='search'
			/>
			{value.length > 0 && (
				<Pressable
					onPress={() => onChangeText('')}
					hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
					accessibilityLabel='검색어 지우기'
					accessibilityRole='button'
				>
					<Ionicons name='close-circle' size={16} color='rgba(0,0,0,0.3)' />
				</Pressable>
			)}
		</View>
	);
}
