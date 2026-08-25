import { Text, View } from 'react-native';
import { DeadlineLabel } from './DeadlineLabel';
import { ExhibitionOfficialLink } from './ExhibitionOfficialLink';

interface ExhibitionDetailHeaderProps {
	title: string;
	startDate: string;
	endDate: string;
	webSite?: string;
}

export function ExhibitionDetailHeader({
	title,
	startDate,
	endDate,
	webSite,
}: ExhibitionDetailHeaderProps) {
	return (
		<View className="px-6">
			<Text className="text-gray-900 text-[26px] leading-[34px] font-pretendard-bold">
				{title.trim()}
			</Text>
			<View className="flex-row items-center flex-wrap gap-x-3 gap-y-1 mt-3">
				<Text className="text-gray-400 text-[13px] font-pretendard-regular">
					{startDate} - {endDate}
				</Text>
				<DeadlineLabel endDate={endDate} />
				{webSite && <ExhibitionOfficialLink url={webSite} />}
			</View>
		</View>
	);
}
