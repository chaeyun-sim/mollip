import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { colors } from '@/src/constants/colors';

export default function TabsLayout() {
	const router = useRouter();
	const session = useAuthStore((s) => s.session);
	const authLoading = useAuthStore((s) => s.isLoading);

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: colors.primaryDark,
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
				name="search"
				options={{
					title: '검색',
					tabBarIcon: ({ focused, color, size }) => (
						<Ionicons name={focused ? 'search' : 'search-outline'} size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="exhibitions"
				options={{
					title: '전시',
					tabBarIcon: ({ focused, color, size }) => (
						<Ionicons name={focused ? 'images' : 'images-outline'} size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="index"
				options={{
					title: '둘러보기',
					tabBarIcon: ({ focused, color, size }) => (
						<Ionicons name={focused ? 'compass' : 'compass-outline'} size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="map"
				options={{
					title: '지도',
					tabBarIcon: ({ focused, color, size }) => (
						<Ionicons name={focused ? 'map' : 'map-outline'} size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="diary"
				listeners={{
					tabPress: (e) => {
						if (authLoading || session) return;
						e.preventDefault();
						router.push({
							pathname: '/auth/login',
							params: { returnTo: '/(tabs)/diary' },
						});
					},
				}}
				options={{
					title: '다이어리',
					tabBarIcon: ({ focused, color, size }) => (
						<Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
