import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';

export default function UserLayout() {
	const { theme } = useTheme();

	return (
		<Tabs
			screenOptions={{
				tabBarShowLabel: true,
				tabBarActiveTintColor: theme.colors.primary,
				tabBarInactiveTintColor: theme.colors.textSecondary,
				tabBarStyle: {
					height: 90,
					paddingBottom: 10,
					backgroundColor: theme.colors.card,
					borderTopWidth: 1,
					borderTopColor: theme.colors.border,
					elevation: 0,
					shadowOpacity: 0,
				},
				tabBarLabelStyle: {
					fontSize: 12,
					fontWeight: '600',
				},
				headerStyle: {
					backgroundColor: theme.colors.background,
				},
				headerTintColor: theme.colors.text,
			}}
		>
			<Tabs.Screen
				name="home"
				options={{
					title: 'Home',
					headerShown: false,
					tabBarIcon: ({ color, focused }) => (
						<Ionicons
							name={focused ? 'home' : 'home-outline'}
							size={24}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="reports"
				options={{
					title: 'Reports',
					headerShown: false,
					tabBarIcon: ({ color, focused }) => (
						<Ionicons
							name={focused ? 'clipboard' : 'clipboard-outline'}
							size={24}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="create"
				options={{
					title: 'Create',
					tabBarLabel: () => null,
					headerShown: false,
					tabBarIcon: () => (
						<View
							style={[
								styles.createButton,
								{ backgroundColor: theme.colors.primary },
							]}
						>
							<Ionicons name="add" size={32} color="white" />
						</View>
					),
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: 'Profile',
					headerShown: false,
					tabBarIcon: ({ color, focused }) => (
						<Ionicons
							name={focused ? 'person' : 'person-outline'}
							size={24}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="notifications"
				options={{
					title: 'Alerts',
					headerShown: false,
					tabBarIcon: ({ color, focused }) => (
						<Ionicons
							name={
								focused ? 'notifications' : 'notifications-outline'
							}
							size={24}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="report-detail"
				options={{
					href: null,
					headerShown: false,
				}}
			/>
		</Tabs>
	);
}

const styles = StyleSheet.create({
	createButton: {
		width: 56,
		height: 56,
		borderRadius: 28,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 20,
		shadowColor: '#22c55e',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 6,
		elevation: 8,
	},
});
