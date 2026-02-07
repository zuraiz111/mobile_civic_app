import React, { useState, useEffect, useRef } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
	Alert,
	SafeAreaView,
	Keyboard,
	TouchableWithoutFeedback,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { useTheme } from '../../src/context/ThemeContext';
import { registerCitizen, getUserProfile } from '../../src/services/userService';

const OTP_LENGTH = 4;

export default function OTPVerification() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const { login } = useApp();
	const { theme } = useTheme();

	const { phone, mode, firstName, lastName, gender } = params;

	const [otp, setOtp] = useState(new Array(OTP_LENGTH).fill(''));
	const [loading, setLoading] = useState(false);
	const [timer, setTimer] = useState(30);
	const inputRefs = useRef([]);

	useEffect(() => {
		// Focus first input on mount
		if (inputRefs.current[0]) {
			inputRefs.current[0].focus();
		}

		// Start timer
		const interval = setInterval(() => {
			setTimer((prev) => (prev > 0 ? prev - 1 : 0));
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	const handleOtpChange = (text, index) => {
		const newOtp = [...otp];
		newOtp[index] = text;
		setOtp(newOtp);

		// Move to next input if text is entered
		if (text && index < OTP_LENGTH - 1) {
			inputRefs.current[index + 1].focus();
		}
	};

	const handleKeyPress = (e, index) => {
		// Move to previous input on backspace if current is empty
		if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
			inputRefs.current[index - 1].focus();
		}
	};

	const handleVerify = async () => {
		const otpCode = otp.join('');
		if (otpCode.length < OTP_LENGTH) {
			Alert.alert('Error', 'Please enter the complete verification code.');
			return;
		}

		setLoading(true);

		try {
			// BYPASS VALIDATION: Accept any OTP
			// In a real app, verify against Firebase Auth or backend here.

			let userData;

			if (mode === 'register') {
				// Register new user
				userData = await registerCitizen(phone, {
					firstName,
					lastName,
					gender,
					// uid will be null for now since we are bypassing Auth
				});
			} else {
				// Login existing user
				userData = await getUserProfile(phone);
				if (!userData) {
					throw new Error('User not found');
				}
			}

			// Restore session
			await login(userData);

			// Redirect to home
			// Using replace to prevent going back to auth screens
			router.replace('/(user)/home');
		} catch (error) {
			console.error('Verification error:', error);
			Alert.alert('Error', 'Verification failed. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const handleResend = () => {
		if (timer === 0) {
			setTimer(30);
			Alert.alert(
				'Code Sent',
				'A new verification code has been sent to your phone.',
			);
			// In real app, trigger SMS resend here
		}
	};

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			<Stack.Screen options={{ headerShown: false }} />
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					style={styles.content}
				>
					<View style={styles.header}>
						<Text style={[styles.title, { color: theme.colors.text }]}>
							Verification
						</Text>
						<Text
							style={[
								styles.subtitle,
								{ color: theme.colors.textSecondary },
							]}
						>
							We sent a code to{' '}
							<Text
								style={[
									styles.phoneNumber,
									{ color: theme.colors.text },
								]}
							>
								{phone}
							</Text>
						</Text>
						<Text
							style={[
								styles.instruction,
								{ color: theme.colors.textSecondary },
							]}
						>
							Enter the code below to verify your account.
						</Text>
					</View>

					<View style={styles.otpContainer}>
						{otp.map((digit, index) => (
							<TextInput
								key={index}
								ref={(ref) => (inputRefs.current[index] = ref)}
								style={[
									styles.otpInput,
									{
										backgroundColor:
											theme.colors.inputBackground,
										borderColor: theme.colors.border,
										color: theme.colors.text,
									},
									digit
										? [
												styles.otpInputFilled,
												{
													borderColor:
														theme.colors.primary,
													backgroundColor:
														theme.colors.card,
												},
											]
										: null,
									otp.length === OTP_LENGTH &&
									index === OTP_LENGTH - 1 &&
									digit
										? [
												styles.otpInputFilled,
												{
													borderColor:
														theme.colors.primary,
													backgroundColor:
														theme.colors.card,
												},
											]
										: null,
								]}
								value={digit}
								onChangeText={(text) =>
									handleOtpChange(text, index)
								}
								onKeyPress={(e) => handleKeyPress(e, index)}
								keyboardType="number-pad"
								maxLength={1}
								selectTextOnFocus
								editable={!loading}
							/>
						))}
					</View>

					<View style={styles.resendContainer}>
						<Text
							style={[
								styles.resendText,
								{ color: theme.colors.textSecondary },
							]}
						>
							{"Didn't receive code? " }
						</Text>
						<TouchableOpacity
							onPress={handleResend}
							disabled={timer > 0}
						>
							<Text
								style={[
									styles.resendLink,
									{ color: theme.colors.primary },
									timer > 0 && [
										styles.resendDisabled,
										{ color: theme.colors.textSecondary },
									],
								]}
							>
								{timer > 0 ? `Resend in ${timer}s` : 'Resend'}
							</Text>
						</TouchableOpacity>
					</View>

					<TouchableOpacity
						style={[
							styles.verifyButton,
							{ backgroundColor: theme.colors.primary },
							loading && styles.buttonDisabled,
						]}
						onPress={handleVerify}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={styles.verifyButtonText}>
								Verify & Continue
							</Text>
						)}
					</TouchableOpacity>
				</KeyboardAvoidingView>
			</TouchableWithoutFeedback>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	content: {
		flex: 1,
		padding: 24,
		justifyContent: 'center',
	},
	header: {
		marginBottom: 40,
		alignItems: 'center',
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 12,
	},
	subtitle: {
		fontSize: 16,
		color: '#666',
		textAlign: 'center',
		marginBottom: 8,
	},
	phoneNumber: {
		fontWeight: 'bold',
		color: '#333',
	},
	instruction: {
		fontSize: 14,
		color: '#999',
		textAlign: 'center',
	},
	otpContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 40,
		paddingHorizontal: 20,
	},
	otpInput: {
		width: 60,
		height: 60,
		borderWidth: 1.5,
		borderColor: '#ddd',
		borderRadius: 12,
		fontSize: 24,
		fontWeight: 'bold',
		textAlign: 'center',
		backgroundColor: '#f9f9f9',
		color: '#333',
	},
	otpInputFilled: {
		borderColor: '#007AFF',
		backgroundColor: '#fff',
	},
	resendContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginBottom: 30,
	},
	resendText: {
		fontSize: 14,
		color: '#666',
	},
	resendLink: {
		fontSize: 14,
		color: '#007AFF',
		fontWeight: '600',
	},
	resendDisabled: {
		color: '#999',
	},
	verifyButton: {
		backgroundColor: '#007AFF',
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	buttonDisabled: {
		backgroundColor: '#aaccff',
	},
	verifyButtonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '600',
	},
});
