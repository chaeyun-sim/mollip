import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: '#3B82F6',
				tabBarInactiveTintColor: '#9CA3AF',
				tabBarLabelStyle: {
					fontFamily: 'Pretendard-Medium',
					fontSize: 12,
				},
				tabBarStyle: {
					backgroundColor: '#FFFFFF',
					borderTopColor: '#F3F4F6',
					borderTopWidth: 1,
				},
				tabBarShowLabel: true,
			}}
		>
			<Tabs.Screen
				name='search'
				options={{
					title: '검색',
					tabBarIcon: ({ focused, color, size }) => (
						<Ionicons
							name={focused ? 'search' : 'search-outline'}
							size={size}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name='index'
				options={{
					title: '둘러보기',
					tabBarIcon: ({ focused, color, size }) => (
						<Ionicons
							name={focused ? 'compass' : 'compass-outline'}
							size={size}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name='map'
				options={{
					title: '지도',
					tabBarIcon: ({ focused, color, size }) => (
						<Ionicons
							name={focused ? 'map' : 'map-outline'}
							size={size}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name='archive'
				options={{
					title: '아카이브',
					tabBarIcon: ({ focused, color, size }) => (
						<Ionicons
							name={focused ? 'bookmark' : 'bookmark-outline'}
							size={size}
							color={color}
						/>
					),
				}}
			/>
		</Tabs>
	);
}
