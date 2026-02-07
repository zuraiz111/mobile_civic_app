import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../src/context/AppContext';
import { useLanguage } from '../src/context/LanguageContext';
import { useTheme } from '../src/context/ThemeContext';

export default function WelcomeScreen() {
	const router = useRouter();
	const { setIsAdmin, currentUser } = useApp();
	const { t } = useLanguage();
	const { theme } = useTheme();

	const handleCitizenMode = () => {
		setIsAdmin(false);
		if (currentUser) {
			router.push('/(user)/home');
		} else {
			router.push('/(auth)/phone-login');
		}
	};

	const handleAdminMode = () => {
		router.push('/(admin)/login');
	};

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			<View style={styles.content}>
				<View style={styles.header}>
					<View
						style={[
							styles.logoContainer,
							{ backgroundColor: theme.colors.card },
						]}
					>
						<Text style={styles.emoji}>🏛️</Text>
					</View>
					<Text style={[styles.title, { color: theme.colors.primary }]}>
						CitizenConnect
					</Text>
					<Text
						style={[
							styles.subtitle,
							{ color: theme.colors.textSecondary },
						]}
					>
						{t('reportTrackResolve')}
					</Text>
				</View>

				<View style={styles.buttons}>
					<TouchableOpacity
						style={[
							styles.citizenButton,
							{
								backgroundColor: theme.colors.primary,
								shadowColor: theme.colors.primary,
							},
						]}
						onPress={handleCitizenMode}
					>
						<Text style={styles.buttonText}>{t('getStarted')}</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.adminButton,
							{
								backgroundColor: theme.colors.card,
								borderColor: theme.colors.border,
							},
						]}
						onPress={handleAdminMode}
					>
						<Text
							style={[
								styles.adminButtonText,
								{ color: theme.colors.text },
							]}
						>
							{t('adminDashboard')}
						</Text>
					</TouchableOpacity>
				</View>

				<Text
					style={[styles.footer, { color: theme.colors.textSecondary }]}
				>
					Version 1.0.0
				</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#ffffff',
	},
	content: {
		flex: 1,
		paddingHorizontal: 32,
		justifyContent: 'center',
	},
	header: {
		alignItems: 'center',
		marginBottom: 60,
	},
	logoContainer: {
		width: 120,
		height: 120,
		backgroundColor: '#f0fdf4',
		borderRadius: 60,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 24,
	},
	emoji: {
		fontSize: 60,
	},
	title: {
		fontSize: 36,
		fontWeight: '800',
		color: '#166534',
		marginBottom: 12,
		letterSpacing: -0.5,
	},
	subtitle: {
		fontSize: 18,
		color: '#64748b',
		textAlign: 'center',
		lineHeight: 26,
		maxWidth: '80%',
	},
	buttons: {
		gap: 16,
		width: '100%',
	},
	citizenButton: {
		backgroundColor: '#22c55e',
		paddingVertical: 20,
		borderRadius: 12,
		alignItems: 'center',
		shadowColor: '#22c55e',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 12,
		elevation: 5,
	},
	adminButton: {
		backgroundColor: '#f8fafc',
		paddingVertical: 20,
		borderRadius: 12,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#e2e8f0',
	},
	buttonText: {
		fontSize: 18,
		fontWeight: '700',
		color: '#ffffff',
	},
	adminButtonText: {
		fontSize: 18,
		fontWeight: '600',
		color: '#475569',
	},
	footer: {
		position: 'absolute',
		bottom: 40,
		left: 0,
		right: 0,
		textAlign: 'center',
		color: '#94a3b8',
		fontSize: 14,
	},
});
