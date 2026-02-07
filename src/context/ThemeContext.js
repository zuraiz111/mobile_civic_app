import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

export const lightTheme = {
	dark: false,
	colors: {
		background: '#F3F4F6', // gray-100
		card: '#FFFFFF',
		text: '#1F2937', // gray-800
		textSecondary: '#6B7280', // gray-500
		primary: '#3B82F6', // blue-500
		border: '#E5E7EB', // gray-200
		notification: '#EF4444', // red-500
		success: '#10B981', // emerald-500
		inputBackground: '#F9FAFB', // gray-50
		tabBar: '#FFFFFF',
		tabBarActive: '#3B82F6',
		tabBarInactive: '#9CA3AF',
		icon: '#4B5563', // gray-600
	},
};

export const darkTheme = {
	dark: true,
	colors: {
		background: '#111827', // gray-900
		card: '#1F2937', // gray-800
		text: '#F9FAFB', // gray-50
		textSecondary: '#9CA3AF', // gray-400
		primary: '#60A5FA', // blue-400
		border: '#374151', // gray-700
		notification: '#F87171', // red-400
		success: '#34D399', // emerald-400
		inputBackground: '#374151', // gray-700
		tabBar: '#1F2937',
		tabBarActive: '#60A5FA',
		tabBarInactive: '#6B7280',
		icon: '#D1D5DB', // gray-300
	},
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
	const systemColorScheme = useColorScheme();
	const [isDark, setIsDark] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const loadTheme = React.useCallback(async () => {
		try {
			const savedTheme = await AsyncStorage.getItem('userTheme');
			if (savedTheme !== null) {
				setIsDark(savedTheme === 'dark');
			} else {
				// Default to system preference if no saved theme
				setIsDark(systemColorScheme === 'dark');
			}
		} catch (error) {
			console.error('Failed to load theme:', error);
		} finally {
			setIsLoading(false);
		}
	}, [systemColorScheme]);

	useEffect(() => {
		loadTheme();
	}, [loadTheme]);

	const toggleTheme = async () => {
		try {
			const newTheme = !isDark;
			setIsDark(newTheme);
			await AsyncStorage.setItem('userTheme', newTheme ? 'dark' : 'light');
		} catch (error) {
			console.error('Failed to save theme:', error);
		}
	};

	const theme = isDark ? darkTheme : lightTheme;

	return (
		<ThemeContext.Provider value={{ theme, isDark, toggleTheme, isLoading }}>
			<StatusBar style={isDark ? 'light' : 'dark'} />
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = () => useContext(ThemeContext);

