import { Ionicons } from '@expo/vector-icons';
import { Children, Fragment, isValidElement, ReactNode } from 'react';
import { View } from 'react-native';

interface SettingsCardProps {
	children: ReactNode;
	/** 프리미엄 등 아직 열리지 않은 카드 전체 — 내용은 흐리게, 중앙에 자물쇠 아이콘 오버레이 */
	locked?: boolean;
}

export function SettingsCard({ children, locked }: SettingsCardProps) {
	const items = Children.toArray(children).filter(isValidElement);

	return (
		<View
			className="relative overflow-hidden rounded-2xl bg-white px-4 shadow-gray900 elevation-[2px]"
			style={{
				shadowOpacity: 0.06,
				shadowRadius: 10,
				shadowOffset: { width: 0, height: 2 },
			}}
		>
			<View className={locked ? 'opacity-20' : undefined}>
				{items.map((child, index) => (
					<Fragment key={index}>
						{child}
						{index < items.length - 1 && <View className="h-[1px] bg-gray500/15" />}
					</Fragment>
				))}
			</View>
			{locked && (
				<View className="absolute inset-0 items-center justify-center" pointerEvents="none">
					<Ionicons name="lock-closed" size={32} className="text-gray300" />
				</View>
			)}
		</View>
	);
}
