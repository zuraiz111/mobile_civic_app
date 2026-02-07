import React, { useEffect, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Animated,
	StatusBar,
	Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function CustomSplashScreen() {
	const [fadeAnim] = useState(() => new Animated.Value(0));
	const [scaleAnim] = useState(() => new Animated.Value(0.8));
	const [loaderAnim] = useState(() => new Animated.Value(0));

	useEffect(() => {
		// Ensure status bar is visible but themed during splash
		StatusBar.setBarStyle('dark-content');

		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 1000,
				useNativeDriver: true,
			}),
			Animated.spring(scaleAnim, {
				toValue: 1,
				friction: 4,
				useNativeDriver: true,
			}),
			Animated.timing(loaderAnim, {
				toValue: 1,
				duration: 3000,
				useNativeDriver: false,
			}),
		]).start();
	}, [fadeAnim, loaderAnim, scaleAnim]);

	const loaderWidth = loaderAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ['0%', '100%'],
	});

	return (
		<View style={styles.container}>
			<Animated.View
				style={[
					styles.content,
					{
						opacity: fadeAnim,
						transform: [{ scale: scaleAnim }],
					},
				]}
			>
				<View style={styles.logoContainer}>
					<Text style={styles.logoEmoji}>🏛️</Text>
				</View>
				<Text style={styles.title}>CitizenConnect</Text>
				<View style={styles.loaderContainer}>
					<Animated.View
						style={[styles.loaderBar, { width: loaderWidth }]}
					/>
				</View>
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f0fdf4', // Matching the theme background
		alignItems: 'center',
		justifyContent: 'center',
	},
	content: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	logoContainer: {
		width: 120,
		height: 120,
		backgroundColor: '#ffffff',
		borderRadius: 60,
		alignItems: 'center',
		justifyContent: 'center',
		elevation: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		marginBottom: 20,
	},
	logoEmoji: {
		fontSize: 60,
	},
	title: {
		fontSize: 32,
		fontWeight: 'bold',
		color: '#166534', // Dark green text
		letterSpacing: 1,
	},
	loaderContainer: {
		marginTop: 40,
		width: width * 0.6,
		height: 4,
		backgroundColor: '#dcfce7',
		borderRadius: 2,
		overflow: 'hidden',
	},
	loaderBar: {
		height: '100%',
		backgroundColor: '#22c55e', // Theme primary green
	},
});
