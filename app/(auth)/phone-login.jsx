import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { checkUserExists } from '../../src/services/userService';

export default function PhoneLoginScreen() {
	const router = useRouter();
	const { theme } = useTheme();

	const [phone, setPhone] = useState('');
	const [loading, setLoading] = useState(false);

	const handleContinue = async () => {
		if (!phone.trim()) {
			Alert.alert('Required', 'Please enter your phone number');
			return;
		}

		// Basic phone validation (at least 10 digits)
		if (phone.trim().length < 10) {
			Alert.alert('Invalid', 'Please enter a valid phone number');
			return;
		}

		setLoading(true);

		try {
			const exists = await checkUserExists(phone.trim());

			if (exists) {
				// User exists -> Login Flow
				router.push({
					pathname: '/(auth)/otp-verification',
					params: { phone: phone.trim(), mode: 'login' },
				});
			} else {
				// User new -> Registration Flow
				router.push({
					pathname: '/(auth)/register',
					params: { phone: phone.trim() },
				});
			}
		} catch (error) {
			console.error('Check user error:', error);
			Alert.alert(
				'Error',
				'Failed to verify phone number. Please try again.',
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.keyboardView}
			>
				<View style={styles.content}>
					{/* Logo & Branding */}
					<View style={styles.header}>
						<View
							style={[
								styles.logoCircle,
								{
									backgroundColor: theme.colors.primary,
									shadowColor: theme.colors.primary,
								},
							]}
						>
							<Ionicons name="call" size={40} color="#fff" />
						</View>
						<Text
							style={[styles.appName, { color: theme.colors.text }]}
						>
							Welcome Back
						</Text>
						<Text
							style={[
								styles.tagline,
								{ color: theme.colors.textSecondary },
							]}
						>
							Enter your mobile number to continue
						</Text>
					</View>

					{/* Form Card */}
					<View
						style={[
							styles.card,
							{ backgroundColor: theme.colors.card },
						]}
					>
						<View style={styles.labelRow}>
							<Text
								style={[styles.label, { color: theme.colors.text }]}
							>
								Mobile Number
							</Text>
						</View>
						<View
							style={[
								styles.inputWrapper,
								{
									backgroundColor: theme.colors.inputBackground,
									borderColor: theme.colors.border,
								},
							]}
						>
							<Ionicons
								name="call-outline"
								size={20}
								color={theme.colors.textSecondary}
								style={styles.inputIcon}
							/>
							<TextInput
								style={[styles.input, { color: theme.colors.text }]}
								placeholder="+92 300 0000000"
								placeholderTextColor={theme.colors.textSecondary}
								keyboardType="phone-pad"
								value={phone}
								onChangeText={setPhone}
								editable={!loading}
								autoFocus={true}
							/>
						</View>

						<TouchableOpacity
							style={[
								styles.button,
								{
									backgroundColor: theme.colors.primary,
									shadowColor: theme.colors.primary,
								},
								loading && styles.buttonDisabled,
							]}
							onPress={handleContinue}
							disabled={loading}
							activeOpacity={0.8}
						>
							{loading ? (
								<ActivityIndicator color="#fff" />
							) : (
								<>
									<Text style={styles.buttonText}>Continue</Text>
									<Ionicons
										name="arrow-forward"
										size={20}
										color="#fff"
										style={{ marginLeft: 8 }}
									/>
								</>
							)}
						</TouchableOpacity>

						<Text
							style={[
								styles.helpText,
								{ color: theme.colors.textSecondary },
							]}
						>
							{"We'll send you a verification code to this number."}
						</Text>
					</View>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f0fdf4',
	},
	keyboardView: {
		flex: 1,
	},
	content: {
		flex: 1,
		padding: 24,
		justifyContent: 'center',
	},
	header: {
		alignItems: 'center',
		marginBottom: 40,
	},
	logoCircle: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: '#22c55e',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16,
		shadowColor: '#22c55e',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.3,
		shadowRadius: 16,
		elevation: 8,
	},
	appName: {
		fontSize: 28,
		fontWeight: 'bold',
		color: '#111827',
		marginBottom: 8,
	},
	tagline: {
		fontSize: 16,
		color: '#6b7280',
		textAlign: 'center',
	},
	card: {
		backgroundColor: '#ffffff',
		borderRadius: 24,
		padding: 24,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 12,
		elevation: 5,
	},
	labelRow: {
		marginBottom: 8,
	},
	label: {
		fontSize: 14,
		fontWeight: '600',
		color: '#374151',
	},
	inputWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f9fafb',
		borderWidth: 1.5,
		borderColor: '#e5e7eb',
		borderRadius: 12,
		paddingHorizontal: 14,
		marginBottom: 24,
		height: 56,
	},
	inputIcon: {
		marginRight: 12,
	},
	input: {
		flex: 1,
		fontSize: 18,
		color: '#111827',
		fontWeight: '500',
	},
	button: {
		flexDirection: 'row',
		backgroundColor: '#22c55e',
		borderRadius: 12,
		paddingVertical: 16,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#22c55e',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 4,
	},
	buttonDisabled: {
		opacity: 0.7,
	},
	buttonText: {
		color: '#ffffff',
		fontSize: 18,
		fontWeight: 'bold',
	},
	helpText: {
		marginTop: 16,
		textAlign: 'center',
		color: '#9ca3af',
		fontSize: 13,
	},
});

