import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '@/src/store/authStore';
import { colors } from '@/src/constants/colors';

export default function TabsLayout() {
	const { t } = useTranslation();

	const router = useRouter();
	const { session, authLoading } = useAuthStore(
		useShallow((s) => ({ session: s.session, authLoading: s.isLoading })),
	);

	return (
		<Tabs
			initialRouteName="index"
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: colors.brand,
				tabBarInactiveTintColor: '#9CA3AF',
				tabBarLabelStyle: {
					fontFamily: 'Pretendard-Medium',
					fontSize: 12,
				},
				tabBarStyle: {
					backgroundColor: '#FFFFFF',
					borderTopColor: '#F3F4F6',
					borderTopWidth: 1,
					paddingTop: 4,
				},
				tabBarShowLabel: true,
			}}
		>
			<Tabs.Screen
				name="exhibitions"
				options={{
					title: t('tabs.exhibitions'),
					tabBarIcon: ({ focused, color, size }) => (
						<Ionicons name={focused ? 'images' : 'images-outline'} size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="map"
				options={{
					title: t('tabs.map'),
					tabBarIcon: ({ focused, color, size }) => (
						<Ionicons name={focused ? 'map' : 'map-outline'} size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="index"
				options={{
					title: t('tabs.home'),
					tabBarIcon: ({ focused, color, size }) => (
						<Ionicons name={focused ? 'compass' : 'compass-outline'} size={size} color={color} />
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
					title: t('tabs.diary'),
					tabBarIcon: ({ focused, color, size }) => (
						<Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: t('settings.title'),
					tabBarIcon: ({ focused, color, size }) => (
						<Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
