import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

const icons = {
	엘리베이터: 'elevator-passenger',
	전용주차: 'parking',
	휠체어: 'human-wheelchair',
	유모차: 'baby-carriage',
	수유실: 'mother-nurse',
	음성안내: 'headphones',
	오디오가이드: 'headphones',
	장애인화장실: 'toilet',
	전시해설: 'account-tie-voice',
	안내데스크: 'information-slab-circle',
} as const satisfies Record<
	string,
	React.ComponentProps<typeof MaterialCommunityIcons>['name']
>;

interface AccessibilityBadgesProps {
	accessibility: string;
}

export function AccessibilityBadges({ accessibility }: AccessibilityBadgesProps) {
	if (!accessibility.length) return null;

	return (
		<View className='flex-row flex-wrap gap-2'>
			{accessibility.split(', ').map((item) => {
				const itemText = item.trim().split(' ').join('');
				const iconKey = Object.keys(icons).find((key) => itemText.startsWith(key));
				const iconName = iconKey ? icons[iconKey as keyof typeof icons] : undefined;
				return (
					<View
						key={item}
						className='flex-row items-center rounded-full px-2.5 py-1 gap-1.5 bg-[rgba(28,25,23,0.06)]'
					>
						{iconName && (
							<MaterialCommunityIcons name={iconName} size={13} color='#57534E' />
						)}
						{itemText.includes('경사로') && (
							<MaterialCommunityIcons
								name='wheelchair-accessibility'
								size={13}
								color='#57534E'
							/>
						)}
						{itemText.includes('주출입구단차없음') && (
							<MaterialCommunityIcons
								name={accessibility.includes('자동문') ? 'door-sliding-open' : 'door-open'}
								size={13}
								color='#57534E'
							/>
						)}
						{itemText.startsWith('점자') &&
							(itemText === '점자블록' ? (
								<MaterialCommunityIcons name='dots-grid' size={13} color='#57534E' />
							) : (
								<MaterialCommunityIcons name='braille' size={13} color='#57534E' />
							))}
						<Text className='text-[12px] font-pretendard-medium text-[#57534E]'>
							{item.trim()}
						</Text>
					</View>
				);
			})}
		</View>
	);
}
