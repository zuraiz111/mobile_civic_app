import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Alert,
	Modal,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

export default function RegistrationScreen() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const { theme } = useTheme();

	// Pre-fill phone from params
	const [phone] = useState(params.phone || '');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [gender, setGender] = useState('');
	const [showGenderModal, setShowGenderModal] = useState(false);

	const handleContinue = () => {
		if (!firstName.trim()) {
			Alert.alert('Required', 'Please enter your first name');
			return;
		}
		if (!lastName.trim()) {
			Alert.alert('Required', 'Please enter your last name');
			return;
		}
		if (!gender) {
			Alert.alert('Required', 'Please select your gender');
			return;
		}

		// Proceed to OTP with registration details
		router.push({
			pathname: '/(auth)/otp-verification',
			params: {
				phone: phone,
				mode: 'register',
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				gender: gender,
			},
		});
	};

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.keyboardView}
			>
				<ScrollView contentContainerStyle={styles.scrollContent}>
					{/* Header */}
					<View style={styles.header}>
						<TouchableOpacity
							onPress={() => router.back()}
							style={styles.backButton}
						>
							<Ionicons
								name="arrow-back"
								size={24}
								color={theme.colors.text}
							/>
						</TouchableOpacity>
						<Text
							style={[
								styles.headerTitle,
								{ color: theme.colors.text },
							]}
						>
							Create Account
						</Text>
						<View style={{ width: 24 }} />
					</View>

					<Text
						style={[
							styles.subtitle,
							{ color: theme.colors.textSecondary },
						]}
					>
						Complete your profile to join CivicPost
					</Text>

					{/* Form */}
					<View style={styles.form}>
						{/* Phone (Read Only) */}
						<View style={styles.labelRow}>
							<Text
								style={[styles.label, { color: theme.colors.text }]}
							>
								Phone Number
							</Text>
							<Ionicons
								name="lock-closed"
								size={12}
								color={theme.colors.textSecondary}
								style={{ marginLeft: 4 }}
							/>
						</View>
						<View
							style={[
								styles.inputWrapper,
								styles.inputDisabled,
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
							<Text
								style={[
									styles.disabledText,
									{ color: theme.colors.textSecondary },
								]}
							>
								{phone}
							</Text>
						</View>

						{/* First Name */}
						<View style={styles.labelRow}>
							<Text
								style={[styles.label, { color: theme.colors.text }]}
							>
								First Name
							</Text>
							<Text style={styles.required}>*</Text>
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
								name="person-outline"
								size={20}
								color={theme.colors.textSecondary}
								style={styles.inputIcon}
							/>
							<TextInput
								style={[styles.input, { color: theme.colors.text }]}
								placeholder="John"
								placeholderTextColor={theme.colors.textSecondary}
								value={firstName}
								onChangeText={setFirstName}
								autoCapitalize="words"
							/>
						</View>

						{/* Last Name */}
						<View style={styles.labelRow}>
							<Text
								style={[styles.label, { color: theme.colors.text }]}
							>
								Last Name
							</Text>
							<Text style={styles.required}>*</Text>
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
								name="person-outline"
								size={20}
								color={theme.colors.textSecondary}
								style={styles.inputIcon}
							/>
							<TextInput
								style={[styles.input, { color: theme.colors.text }]}
								placeholder="Doe"
								placeholderTextColor={theme.colors.textSecondary}
								value={lastName}
								onChangeText={setLastName}
								autoCapitalize="words"
							/>
						</View>

						{/* Gender */}
						<View style={styles.labelRow}>
							<Text
								style={[styles.label, { color: theme.colors.text }]}
							>
								Gender
							</Text>
							<Text style={styles.required}>*</Text>
						</View>
						<TouchableOpacity
							style={[
								styles.inputWrapper,
								{
									backgroundColor: theme.colors.inputBackground,
									borderColor: theme.colors.border,
								},
							]}
							onPress={() => setShowGenderModal(true)}
						>
							<Ionicons
								name={
									gender === 'Male'
										? 'male'
										: gender === 'Female'
											? 'female'
											: gender === 'Other'
												? 'male-female'
												: 'male-female-outline'
								}
								size={20}
								color={theme.colors.textSecondary}
								style={styles.inputIcon}
							/>
							<Text
								style={[
									styles.input,
									styles.dropdownText,
									{
										color: gender
											? theme.colors.text
											: theme.colors.textSecondary,
									},
								]}
							>
								{gender || 'Select Gender'}
							</Text>
							<Ionicons
								name="chevron-down"
								size={20}
								color={theme.colors.textSecondary}
							/>
						</TouchableOpacity>
					</View>

					{/* Submit Button */}
					<View style={styles.footer}>
						<TouchableOpacity
							style={[
								styles.button,
								{ backgroundColor: theme.colors.primary },
							]}
							onPress={handleContinue}
							activeOpacity={0.8}
						>
							<Text style={styles.buttonText}>Submit</Text>
							<Ionicons
								name="arrow-forward"
								size={20}
								color="#fff"
								style={{ marginLeft: 8 }}
							/>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>

			{/* Gender Modal */}
			<Modal
				visible={showGenderModal}
				transparent
				animationType="slide"
				onRequestClose={() => setShowGenderModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View
						style={[
							styles.modalContent,
							{ backgroundColor: theme.colors.card },
						]}
					>
						<View style={styles.modalHeader}>
							<Text
								style={[
									styles.modalTitle,
									{ color: theme.colors.text },
								]}
							>
								Select Gender
							</Text>
							<TouchableOpacity
								onPress={() => setShowGenderModal(false)}
							>
								<Ionicons
									name="close"
									size={24}
									color={theme.colors.textSecondary}
								/>
							</TouchableOpacity>
						</View>

						{GENDER_OPTIONS.map((option) => (
							<TouchableOpacity
								key={option}
								style={[
									styles.modalOption,
									{
										backgroundColor:
											theme.colors.inputBackground,
										borderColor: theme.colors.border,
									},
									gender === option && {
										borderColor: theme.colors.primary,
										backgroundColor: theme.colors.card,
									},
								]}
								onPress={() => {
									setGender(option);
									setShowGenderModal(false);
								}}
							>
								<Ionicons
									name={
										option === 'Male'
											? 'male'
											: option === 'Female'
												? 'female'
												: 'male-female'
									}
									size={22}
									color={
										gender === option
											? theme.colors.primary
											: theme.colors.textSecondary
									}
									style={{ marginRight: 12 }}
								/>
								<Text
									style={[
										styles.modalOptionText,
										{ color: theme.colors.text },
										gender === option && {
											color: theme.colors.primary,
											fontWeight: '600',
										},
									]}
								>
									{option}
								</Text>
								{gender === option && (
									<Ionicons
										name="checkmark-circle"
										size={22}
										color={theme.colors.primary}
									/>
								)}
							</TouchableOpacity>
						))}
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#ffffff',
	},
	keyboardView: {
		flex: 1,
	},
	scrollContent: {
		padding: 24,
		paddingBottom: 40,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 16,
	},
	backButton: {
		padding: 8,
		marginLeft: -8,
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#111827',
	},
	subtitle: {
		fontSize: 16,
		color: '#6b7280',
		marginBottom: 32,
	},
	form: {
		flex: 1,
	},
	labelRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	label: {
		fontSize: 14,
		fontWeight: '600',
		color: '#374151',
	},
	required: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#ef4444',
		marginLeft: 3,
	},
	inputWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f9fafb',
		borderWidth: 1.5,
		borderColor: '#e5e7eb',
		borderRadius: 12,
		paddingHorizontal: 14,
		marginBottom: 20,
		height: 54,
	},
	inputDisabled: {
		backgroundColor: '#f3f4f6',
		borderColor: '#e5e7eb',
	},
	inputIcon: {
		marginRight: 10,
	},
	input: {
		flex: 1,
		fontSize: 16,
		color: '#111827',
	},
	disabledText: {
		flex: 1,
		fontSize: 16,
		color: '#6b7280',
	},
	dropdownText: {
		paddingVertical: 0,
	},
	placeholder: {
		color: '#9ca3af',
	},
	footer: {
		marginTop: 20,
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
	buttonText: {
		color: '#ffffff',
		fontSize: 17,
		fontWeight: 'bold',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-end',
	},
	modalContent: {
		backgroundColor: '#ffffff',
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 24,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 20,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#111827',
	},
	modalOption: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		borderRadius: 12,
		marginBottom: 8,
		backgroundColor: '#f9fafb',
		borderWidth: 1.5,
		borderColor: '#e5e7eb',
	},
	modalOptionActive: {
		backgroundColor: '#f0fdf4',
		borderColor: '#22c55e',
	},
	modalOptionText: {
		flex: 1,
		fontSize: 16,
		color: '#374151',
		fontWeight: '500',
	},
	modalOptionTextActive: {
		color: '#22c55e',
		fontWeight: '600',
	},
});

