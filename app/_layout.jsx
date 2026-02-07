import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AppProvider, useApp } from '../src/context/AppContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import CustomSplashScreen from './components/CustomSplashScreen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
	/* reloading the app might cause this to error */
});

function RootLayoutNav() {
	const { isLoading } = useApp();
	const [appReady, setAppReady] = useState(false);

	useEffect(() => {
		if (!isLoading) {
			// Show splash screen for at least 3 seconds
			const timer = setTimeout(() => {
				setAppReady(true);
				SplashScreen.hideAsync().catch(() => {});
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [isLoading]);

	if (!appReady) {
		return <CustomSplashScreen />;
	}

	return (
		<>
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="index" />
				<Stack.Screen name="(auth)" />
				<Stack.Screen name="(user)" />
				<Stack.Screen name="(admin)" />
			</Stack>
		</>
	);
}

export default function RootLayout() {
	return (
		<SafeAreaProvider>
			<LanguageProvider>
				<ThemeProvider>
					<AppProvider>
						<RootLayoutNav />
					</AppProvider>
				</ThemeProvider>
			</LanguageProvider>
		</SafeAreaProvider>
	);
}
