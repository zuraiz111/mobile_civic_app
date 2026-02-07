import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Alert,
	Modal,
	TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { useTheme } from '../../src/context/ThemeContext';

// Format date
const formatDate = (date) => {
	if (!date) return 'N/A';

	try {
		let d;
		// Handle Firestore Timestamp
		if (
			date &&
			typeof date === 'object' &&
			'toDate' in date &&
			typeof date.toDate === 'function'
		) {
			d = date.toDate();
		}
		// Handle Serialized Firestore Timestamp (from AsyncStorage/JSON)
		else if (date && typeof date === 'object' && 'seconds' in date) {
			d = new Date(date.seconds * 1000);
		}
		// Handle Date object or ISO string
		else {
			d = new Date(date);
		}

		// Check if date is valid
		if (isNaN(d.getTime())) {
			return 'N/A';
		}

		return d.toLocaleDateString('en-US', {
			month: 'short',
			year: 'numeric',
		});
	} catch (error) {
		console.error('Error formatting date:', error);
		return 'N/A';
	}
};

export default function ProfileScreen() {
	const router = useRouter();
	const { currentUser, getUserStats, logout } = useApp();
	const { theme } = useTheme();
	const stats = getUserStats();

	const [editModalVisible, setEditModalVisible] = useState(false);
	const [editedName, setEditedName] = useState(currentUser?.name || '');
	const [editedPhone, setEditedPhone] = useState(currentUser?.phone || '');
	const [saving, setSaving] = useState(false);
	// Handle logout
	const handleLogout = () => {
		Alert.alert('Logout', 'Are you sure you want to logout?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Logout',
				style: 'destructive',
				onPress: async () => {
					try {
						await logout();
						router.replace('/login');
					} catch (error) {
						Alert.alert('Error', 'Failed to logout. Please try again.');
					}
				},
			},
		]);
	};

	// Handle save profile
	const handleSaveProfile = async () => {
		if (!editedName.trim() || !editedPhone.trim()) {
			Alert.alert('Required Fields', 'Please fill in all fields');
			return;
		}

		setSaving(true);

		try {
			// TODO: Implement update user profile
			// await updateUserProfile(currentUser.id, {
			//   name: editedName,
			//   phone: editedPhone,
			// });

			await new Promise((resolve) => setTimeout(resolve, 1000));

			Alert.alert('Success', 'Profile updated successfully', [
				{ text: 'OK', onPress: () => setEditModalVisible(false) },
			]);
		} catch (error) {
			Alert.alert('Error', 'Failed to update profile');
		} finally {
			setSaving(false);
		}
	};

	// Open edit modal
	const handleEditProfile = () => {
		setEditedName(currentUser?.name || '');
		setEditedPhone(currentUser?.phone || '');
		setEditModalVisible(true);
	};

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			{/* Header */}
			<View style={styles.header}>
				<Text style={[styles.headerTitle, { color: theme.colors.text }]}>
					Profile
				</Text>
			</View>

			<ScrollView
				style={styles.scrollView}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.scrollContent}
			>
				{/* Profile Header Card */}
				<View
					style={[
						styles.profileCard,
						{ backgroundColor: theme.colors.card },
					]}
				>
					{/* Profile Picture */}
					<View style={styles.profileImageContainer}>
						<View
							style={[
								styles.profileImage,
								{ backgroundColor: theme.colors.primary },
							]}
						>
							<Text style={styles.profileImageText}>
								{currentUser?.name?.charAt(0).toUpperCase() || 'C'}
							</Text>
						</View>
						<TouchableOpacity
							style={[
								styles.cameraButton,
								{ backgroundColor: theme.colors.primary },
							]}
						>
							<Ionicons name="camera" size={16} color="#fff" />
						</TouchableOpacity>
					</View>

					{/* User Info */}
					<Text
						style={[styles.profileName, { color: theme.colors.text }]}
					>
						{currentUser?.name || 'Citizen'}
					</Text>
					<View
						style={[
							styles.userTypeChip,
							{ backgroundColor: theme.colors.inputBackground },
						]}
					>
						<Ionicons
							name="person"
							size={14}
							color={theme.colors.primary}
						/>
						<Text
							style={[
								styles.userTypeText,
								{ color: theme.colors.primary },
							]}
						>
							Regular Citizen
						</Text>
					</View>
					<View style={styles.memberSince}>
						<Ionicons
							name="calendar-outline"
							size={14}
							color={theme.colors.textSecondary}
						/>
						<Text
							style={[
								styles.memberSinceText,
								{ color: theme.colors.textSecondary },
							]}
						>
							Member since{' '}
							{formatDate(currentUser?.createdAt || new Date())}
						</Text>
					</View>
				</View>

				{/* Contact Information */}
				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text
							style={[
								styles.sectionTitle,
								{ color: theme.colors.text },
							]}
						>
							Contact Information
						</Text>
						<TouchableOpacity
							onPress={handleEditProfile}
							style={styles.editButton}
						>
							<Ionicons
								name="create-outline"
								size={18}
								color={theme.colors.primary}
							/>
							<Text
								style={[
									styles.editButtonText,
									{ color: theme.colors.primary },
								]}
							>
								Edit
							</Text>
						</TouchableOpacity>
					</View>
					<View
						style={[
							styles.card,
							{ backgroundColor: theme.colors.card },
						]}
					>
						<View style={styles.contactItem}>
							<View
								style={[
									styles.contactIconBox,
									{
										backgroundColor:
											theme.colors.inputBackground,
									},
								]}
							>
								<Ionicons
									name="mail"
									size={20}
									color={theme.colors.primary}
								/>
							</View>
							<View style={styles.contactInfo}>
								<Text
									style={[
										styles.contactLabel,
										{ color: theme.colors.textSecondary },
									]}
								>
									Email
								</Text>
								<Text
									style={[
										styles.contactValue,
										{ color: theme.colors.text },
									]}
								>
									{currentUser?.email || 'N/A'}
								</Text>
							</View>
						</View>
						<View
							style={[
								styles.divider,
								{ backgroundColor: theme.colors.border },
							]}
						/>
						<View style={styles.contactItem}>
							<View
								style={[
									styles.contactIconBox,
									{
										backgroundColor:
											theme.colors.inputBackground,
									},
								]}
							>
								<Ionicons
									name="call"
									size={20}
									color={theme.colors.success}
								/>
							</View>
							<View style={styles.contactInfo}>
								<Text
									style={[
										styles.contactLabel,
										{ color: theme.colors.textSecondary },
									]}
								>
									Phone Number
								</Text>
								<Text
									style={[
										styles.contactValue,
										{ color: theme.colors.text },
									]}
								>
									{currentUser?.phone || 'Not provided'}
								</Text>
							</View>
						</View>
					</View>
				</View>

				{/* Activity Summary */}
				<View style={styles.section}>
					<Text
						style={[styles.sectionTitle, { color: theme.colors.text }]}
					>
						Activity & Contribution
					</Text>
					<View style={styles.statsGrid}>
						<View
							style={[
								styles.statCard,
								{ backgroundColor: theme.colors.card },
							]}
						>
							<View
								style={[
									styles.statIconBox,
									{
										backgroundColor: theme.dark
											? '#1e3a8a'
											: '#dbeafe',
									},
								]}
							>
								<Ionicons
									name="document-text"
									size={24}
									color={theme.colors.primary}
								/>
							</View>
							<Text
								style={[
									styles.statValue,
									{ color: theme.colors.text },
								]}
							>
								{stats?.total || 0}
							</Text>
							<Text
								style={[
									styles.statLabel,
									{ color: theme.colors.textSecondary },
								]}
							>
								Total Reports
							</Text>
						</View>

						<View
							style={[
								styles.statCard,
								{ backgroundColor: theme.colors.card },
							]}
						>
							<View
								style={[
									styles.statIconBox,
									{
										backgroundColor: theme.dark
											? '#064e3b'
											: '#d1fae5',
									},
								]}
							>
								<Ionicons
									name="checkmark-circle"
									size={24}
									color={theme.colors.success}
								/>
							</View>
							<Text
								style={[
									styles.statValue,
									{ color: theme.colors.text },
								]}
							>
								{stats?.resolved || 0}
							</Text>
							<Text
								style={[
									styles.statLabel,
									{ color: theme.colors.textSecondary },
								]}
							>
								Resolved
							</Text>
						</View>

						<View
							style={[
								styles.statCard,
								{ backgroundColor: theme.colors.card },
							]}
						>
							<View
								style={[
									styles.statIconBox,
									{
										backgroundColor: theme.dark
											? '#78350f'
											: '#fef3c7',
									},
								]}
							>
								<Ionicons name="time" size={24} color="#f59e0b" />
							</View>
							<Text
								style={[
									styles.statValue,
									{ color: theme.colors.text },
								]}
							>
								{stats?.pending || 0}
							</Text>
							<Text
								style={[
									styles.statLabel,
									{ color: theme.colors.textSecondary },
								]}
							>
								Pending
							</Text>
						</View>
					</View>
				</View>

				{/* Reports Section */}
				<View style={styles.section}>
					<Text
						style={[styles.sectionTitle, { color: theme.colors.text }]}
					>
						My Reports
					</Text>
					<TouchableOpacity
						style={[
							styles.viewReportsButton,
							{ backgroundColor: theme.colors.card },
						]}
						onPress={() => router.push('/(user)/reports')}
					>
						<View style={styles.viewReportsLeft}>
							<View
								style={[
									styles.viewReportsIconBox,
									{
										backgroundColor:
											theme.colors.inputBackground,
									},
								]}
							>
								<Ionicons
									name="folder-open"
									size={22}
									color={theme.colors.primary}
								/>
							</View>
							<View>
								<Text
									style={[
										styles.viewReportsTitle,
										{ color: theme.colors.text },
									]}
								>
									View My Reports
								</Text>
								<Text
									style={[
										styles.viewReportsSubtitle,
										{ color: theme.colors.textSecondary },
									]}
								>
									See all your submitted reports and their status
								</Text>
							</View>
						</View>
						<Ionicons
							name="chevron-forward"
							size={20}
							color={theme.colors.textSecondary}
						/>
					</TouchableOpacity>
				</View>

				{/* Account Actions */}
				<View style={styles.section}>
					<Text
						style={[styles.sectionTitle, { color: theme.colors.text }]}
					>
						Account Settings
					</Text>
					<View
						style={[
							styles.card,
							{ backgroundColor: theme.colors.card },
						]}
					>
						<TouchableOpacity
							style={styles.actionItem}
							onPress={handleEditProfile}
						>
							<View style={styles.actionLeft}>
								<Ionicons
									name="person-outline"
									size={20}
									color={theme.colors.text}
								/>
								<Text
									style={[
										styles.actionText,
										{ color: theme.colors.text },
									]}
								>
									Edit Profile
								</Text>
							</View>
							<Ionicons
								name="chevron-forward"
								size={20}
								color={theme.colors.textSecondary}
							/>
						</TouchableOpacity>

						<View
							style={[
								styles.divider,
								{ backgroundColor: theme.colors.border },
							]}
						/>

						<TouchableOpacity style={styles.actionItem}>
							<View style={styles.actionLeft}>
								<Ionicons
									name="language-outline"
									size={20}
									color={theme.colors.text}
								/>
								<Text
									style={[
										styles.actionText,
										{ color: theme.colors.text },
									]}
								>
									Language
								</Text>
							</View>
							<View style={styles.actionRight}>
								<Text
									style={[
										styles.actionValue,
										{ color: theme.colors.textSecondary },
									]}
								>
									English
								</Text>
								<Ionicons
									name="chevron-forward"
									size={20}
									color={theme.colors.textSecondary}
								/>
							</View>
						</TouchableOpacity>

						<View
							style={[
								styles.divider,
								{ backgroundColor: theme.colors.border },
							]}
						/>

						<TouchableOpacity
							style={styles.actionItem}
							onPress={handleLogout}
						>
							<View style={styles.actionLeft}>
								<Ionicons
									name="log-out-outline"
									size={20}
									color={theme.colors.notification}
								/>
								<Text
									style={[
										styles.actionText,
										{ color: theme.colors.notification },
									]}
								>
									Logout
								</Text>
							</View>
							<Ionicons
								name="chevron-forward"
								size={20}
								color={theme.colors.textSecondary}
							/>
						</TouchableOpacity>
					</View>
				</View>

				<View style={styles.bottomSpacer} />
			</ScrollView>

			{/* Edit Profile Modal */}
			<Modal
				visible={editModalVisible}
				animationType="slide"
				transparent={true}
				onRequestClose={() => setEditModalVisible(false)}
			>
				<View style={styles.modalOverlay}>
					<View
						style={[
							styles.modalContent,
							{ backgroundColor: theme.colors.card },
						]}
					>
						<View
							style={[
								styles.modalHeader,
								{ borderBottomColor: theme.colors.border },
							]}
						>
							<Text
								style={[
									styles.modalTitle,
									{ color: theme.colors.text },
								]}
							>
								Edit Profile
							</Text>
							<TouchableOpacity
								onPress={() => setEditModalVisible(false)}
								style={styles.modalCloseButton}
							>
								<Ionicons
									name="close"
									size={24}
									color={theme.colors.textSecondary}
								/>
							</TouchableOpacity>
						</View>

						<ScrollView
							style={styles.modalScroll}
							showsVerticalScrollIndicator={false}
						>
							<View style={styles.inputGroup}>
								<Text
									style={[
										styles.inputLabel,
										{ color: theme.colors.textSecondary },
									]}
								>
									Full Name *
								</Text>
								<TextInput
									style={[
										styles.input,
										{
											backgroundColor:
												theme.colors.inputBackground,
											borderColor: theme.colors.border,
											color: theme.colors.text,
										},
									]}
									value={editedName}
									onChangeText={setEditedName}
									placeholder="Enter your full name"
									placeholderTextColor={
										theme.colors.textSecondary
									}
								/>
							</View>

							<View style={styles.inputGroup}>
								<Text
									style={[
										styles.inputLabel,
										{ color: theme.colors.textSecondary },
									]}
								>
									Phone Number *
								</Text>
								<TextInput
									style={[
										styles.input,
										{
											backgroundColor:
												theme.colors.inputBackground,
											borderColor: theme.colors.border,
											color: theme.colors.text,
										},
									]}
									value={editedPhone}
									onChangeText={setEditedPhone}
									placeholder="Enter your phone number"
									placeholderTextColor={
										theme.colors.textSecondary
									}
									keyboardType="phone-pad"
								/>
							</View>

							<View style={styles.inputGroup}>
								<Text
									style={[
										styles.inputLabel,
										{ color: theme.colors.textSecondary },
									]}
								>
									Email (Read-only)
								</Text>
								<View
									style={[
										styles.input,
										styles.inputDisabled,
										{
											backgroundColor: theme.colors.border,
											borderColor: theme.colors.border,
										},
									]}
								>
									<Text
										style={[
											styles.inputDisabledText,
											{ color: theme.colors.textSecondary },
										]}
									>
										{currentUser?.email}
									</Text>
								</View>
								<Text
									style={[
										styles.inputHint,
										{ color: theme.colors.textSecondary },
									]}
								>
									Email cannot be changed
								</Text>
							</View>
						</ScrollView>

						<View
							style={[
								styles.modalActions,
								{ borderTopColor: theme.colors.border },
							]}
						>
							<TouchableOpacity
								style={[
									styles.cancelButton,
									{
										backgroundColor:
											theme.colors.inputBackground,
									},
								]}
								onPress={() => setEditModalVisible(false)}
							>
								<Text
									style={[
										styles.cancelButtonText,
										{ color: theme.colors.text },
									]}
								>
									Cancel
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[
									styles.saveButton,
									{ backgroundColor: theme.colors.primary },
									saving && styles.saveButtonDisabled,
								]}
								onPress={handleSaveProfile}
								disabled={saving}
							>
								{saving ? (
									<Text style={styles.saveButtonText}>
										Saving...
									</Text>
								) : (
									<>
										<Ionicons
											name="checkmark"
											size={20}
											color="#fff"
										/>
										<Text style={styles.saveButtonText}>
											Save Changes
										</Text>
									</>
								)}
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f8fafc',
	},

	// Header
	header: {
		paddingHorizontal: 16,
		paddingVertical: 16,
		backgroundColor: '#ffffff',
		borderBottomWidth: 1,
		borderBottomColor: '#f1f5f9',
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: '800',
		color: '#1f2937',
	},

	// Scroll View
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
	},

	// Profile Card
	profileCard: {
		backgroundColor: '#ffffff',
		borderRadius: 16,
		padding: 24,
		alignItems: 'center',
		marginBottom: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 8,
		elevation: 2,
	},
	profileImageContainer: {
		position: 'relative',
		marginBottom: 16,
	},
	profileImage: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: '#3b82f6',
		alignItems: 'center',
		justifyContent: 'center',
	},
	profileImageText: {
		fontSize: 40,
		fontWeight: '700',
		color: '#ffffff',
	},
	cameraButton: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: '#10b981',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 3,
		borderColor: '#ffffff',
	},
	profileName: {
		fontSize: 22,
		fontWeight: '800',
		color: '#1f2937',
		marginBottom: 8,
	},
	userTypeChip: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#eff6ff',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
		gap: 6,
		marginBottom: 12,
	},
	userTypeText: {
		fontSize: 13,
		color: '#3b82f6',
		fontWeight: '600',
	},
	memberSince: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	memberSinceText: {
		fontSize: 13,
		color: '#6b7280',
	},

	// Sections
	section: {
		marginBottom: 20,
	},
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '700',
		color: '#1f2937',
		marginBottom: 12,
	},
	editButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	editButtonText: {
		fontSize: 14,
		color: '#3b82f6',
		fontWeight: '600',
	},

	// Card
	card: {
		backgroundColor: '#ffffff',
		borderRadius: 12,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.04,
		shadowRadius: 4,
		elevation: 2,
	},

	// Contact Items
	contactItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 14,
		paddingVertical: 4,
	},
	contactIconBox: {
		width: 44,
		height: 44,
		borderRadius: 12,
		backgroundColor: '#f8fafc',
		alignItems: 'center',
		justifyContent: 'center',
	},
	contactInfo: {
		flex: 1,
	},
	contactLabel: {
		fontSize: 13,
		color: '#6b7280',
		marginBottom: 4,
	},
	contactValue: {
		fontSize: 15,
		color: '#1f2937',
		fontWeight: '600',
	},
	divider: {
		height: 1,
		backgroundColor: '#f1f5f9',
		marginVertical: 12,
	},

	// Stats Grid
	statsGrid: {
		flexDirection: 'row',
		gap: 12,
	},
	statCard: {
		flex: 1,
		backgroundColor: '#ffffff',
		borderRadius: 12,
		padding: 16,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.04,
		shadowRadius: 4,
		elevation: 2,
	},
	statIconBox: {
		width: 48,
		height: 48,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 12,
	},
	statValue: {
		fontSize: 24,
		fontWeight: '800',
		color: '#1f2937',
		marginBottom: 4,
	},
	statLabel: {
		fontSize: 12,
		color: '#6b7280',
		textAlign: 'center',
	},

	// View Reports Button
	viewReportsButton: {
		backgroundColor: '#ffffff',
		borderRadius: 12,
		padding: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.04,
		shadowRadius: 4,
		elevation: 2,
	},
	viewReportsLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 14,
		flex: 1,
	},
	viewReportsIconBox: {
		width: 44,
		height: 44,
		borderRadius: 12,
		backgroundColor: '#eff6ff',
		alignItems: 'center',
		justifyContent: 'center',
	},
	viewReportsTitle: {
		fontSize: 15,
		fontWeight: '700',
		color: '#1f2937',
		marginBottom: 2,
	},
	viewReportsSubtitle: {
		fontSize: 13,
		color: '#6b7280',
	},

	// Action Items
	actionItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 12,
	},
	actionLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		flex: 1,
	},
	actionText: {
		fontSize: 15,
		color: '#1f2937',
		fontWeight: '500',
	},
	actionRight: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	actionValue: {
		fontSize: 14,
		color: '#6b7280',
	},

	// Modal
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-end',
	},
	modalContent: {
		backgroundColor: '#ffffff',
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		maxHeight: '75%',
		paddingTop: 20,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#f1f5f9',
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: '800',
		color: '#1f2937',
	},
	modalCloseButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#f8fafc',
		alignItems: 'center',
		justifyContent: 'center',
	},
	modalScroll: {
		paddingHorizontal: 20,
		paddingTop: 20,
	},
	inputGroup: {
		marginBottom: 20,
	},
	inputLabel: {
		fontSize: 14,
		fontWeight: '700',
		color: '#374151',
		marginBottom: 8,
	},
	input: {
		backgroundColor: '#f8fafc',
		borderWidth: 1,
		borderColor: '#e5e7eb',
		borderRadius: 12,
		padding: 14,
		fontSize: 15,
		color: '#1f2937',
	},
	inputDisabled: {
		backgroundColor: '#f1f5f9',
		justifyContent: 'center',
	},
	inputDisabledText: {
		fontSize: 15,
		color: '#9ca3af',
	},
	inputHint: {
		fontSize: 12,
		color: '#9ca3af',
		marginTop: 6,
	},
	modalActions: {
		flexDirection: 'row',
		gap: 12,
		padding: 20,
		borderTopWidth: 1,
		borderTopColor: '#f1f5f9',
	},
	cancelButton: {
		flex: 1,
		backgroundColor: '#f8fafc',
		padding: 16,
		borderRadius: 12,
		alignItems: 'center',
	},
	cancelButtonText: {
		fontSize: 15,
		fontWeight: '700',
		color: '#6b7280',
	},
	saveButton: {
		flex: 1,
		backgroundColor: '#3b82f6',
		padding: 16,
		borderRadius: 12,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
	},
	saveButtonDisabled: {
		opacity: 0.6,
	},
	saveButtonText: {
		fontSize: 15,
		fontWeight: '700',
		color: '#ffffff',
	},

	// Spacing
	bottomSpacer: {
		height: 24,
	},
});
// import React from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Alert,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useRouter } from 'expo-router';
// import { useApp } from '../../src/context/AppContext';
// import { useLanguage } from '../../src/context/LanguageContext';

// export default function ProfileScreen() {
//   const router = useRouter();
//   const { currentUser, getUserStats, setIsAdmin } = useApp();
//   const { language, setLanguage, t } = useLanguage();
//   const stats = getUserStats();

//   const handleLogout = () => {
//     Alert.alert(t('logout'), t('logoutConfirm'), [
//       { text: t('cancel'), style: 'cancel' },
//       { text: t('logout'), style: 'destructive', onPress: () => router.replace('/') },
//     ]);
//   };

//   const toggleLanguage = () => {
//     const newLang = language === 'en' ? 'ur' : 'en';
//     setLanguage(newLang);
//   };

//   const handleSwitchToAdmin = () => {
//     router.replace('/(admin)/login');
//   };

//   const menuItems = [
//     {
//       icon: '🌐',
//       label: language === 'en' ? 'اردو (Urdu)' : 'English',
//       onPress: toggleLanguage
//     },
//     {
//       icon: '👤',
//       labelKey: 'switchToAdmin',
//       onPress: handleSwitchToAdmin
//     },
//     { icon: '⚙️', labelKey: 'settings', onPress: () => Alert.alert(t('settings'), t('comingSoon')) },
//     { icon: '🔔', labelKey: 'notifications', onPress: () => router.push('/(user)/notifications') },
//     { icon: '🔒', labelKey: 'privacySecurity', onPress: () => Alert.alert(t('privacySecurity'), t('comingSoon')) },
//     { icon: '❓', labelKey: 'helpSupport', onPress: () => Alert.alert(t('helpSupport'), t('comingSoon')) },
//     { icon: '📄', labelKey: 'termsOfService', onPress: () => Alert.alert(t('termsOfService'), t('comingSoon')) },
//     { icon: '🚪', labelKey: 'logout', onPress: handleLogout, danger: true },
//   ];

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
//         {/* Profile Header */}
//         <View style={styles.profileHeader}>
//           <View style={styles.avatarContainer}>
//             <Text style={styles.avatarText}>👤</Text>
//           </View>
//           <Text style={styles.userName}>{currentUser.name}</Text>
//           <Text style={styles.userEmail}>{currentUser.email}</Text>
//         </View>

//         {/* Stats Card */}
//         <View style={styles.statsCard}>
//           <Text style={styles.statsTitle}>{t('statistics')}</Text>
//           <View style={styles.statsRow}>
//             <View style={styles.statItem}>
//               <Text style={[styles.statNumber, styles.statBlue]}>{stats.total}</Text>
//               <Text style={styles.statLabel}>{t('total')}</Text>
//             </View>
//             <View style={styles.statDivider} />
//             <View style={styles.statItem}>
//               <Text style={[styles.statNumber, styles.statGreen]}>{stats.resolved}</Text>
//               <Text style={styles.statLabel}>{t('resolved')}</Text>
//             </View>
//             <View style={styles.statDivider} />
//             <View style={styles.statItem}>
//               <Text style={[styles.statNumber, styles.statOrange]}>{stats.pending}</Text>
//               <Text style={styles.statLabel}>{t('pending')}</Text>
//             </View>
//           </View>
//         </View>

//         {/* Quick Actions */}
//         <View style={styles.quickActions}>
//           <TouchableOpacity
//             style={styles.quickActionButton}
//             onPress={() => router.push('/(user)/reports')}
//           >
//             <Text style={styles.quickActionIcon}>📋</Text>
//             <Text style={styles.quickActionText}>{t('viewReports')}</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={styles.quickActionButton}
//             onPress={() => router.push('/(user)/create')}
//           >
//             <Text style={styles.quickActionIcon}>➕</Text>
//             <Text style={styles.quickActionText}>{t('newReport')}</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Menu Items */}
//         <View style={styles.menuCard}>
//           {menuItems.map((item, index) => (
//             <TouchableOpacity
//               key={index}
//               style={[styles.menuItem, index < menuItems.length - 1 && styles.menuItemBorder]}
//               onPress={item.onPress}
//             >
//               <View style={styles.menuItemLeft}>
//                 <Text style={styles.menuItemIcon}>{item.icon}</Text>
//                 <Text style={[styles.menuItemLabel, item.danger && styles.menuItemDanger]}>
//                   {item.label || t(item.labelKey)}
//                 </Text>
//               </View>
//               <Text style={styles.menuItemArrow}>›</Text>
//             </TouchableOpacity>
//           ))}
//         </View>

//         {/* App Info */}
//         <View style={styles.appInfo}>
//           <Text style={styles.appName}>🏛️ CitizenConnect</Text>
//           <Text style={styles.appVersion}>Version 1.0.0</Text>
//         </View>

//         <View style={styles.bottomSpacer} />
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f9fafb',
//   },
//   scrollView: {
//     flex: 1,
//     paddingHorizontal: 16,
//   },
//   profileHeader: {
//     alignItems: 'center',
//     paddingVertical: 32,
//   },
//   avatarContainer: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     backgroundColor: '#22c55e',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 16,
//     shadowColor: '#22c55e',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   avatarText: {
//     fontSize: 48,
//   },
//   userName: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#1f2937',
//     marginBottom: 4,
//   },
//   userEmail: {
//     fontSize: 15,
//     color: '#6b7280',
//   },
//   statsCard: {
//     backgroundColor: '#ffffff',
//     borderRadius: 20,
//     padding: 20,
//     marginBottom: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 1,
//   },
//   statsTitle: {
//     fontSize: 17,
//     fontWeight: '600',
//     color: '#1f2937',
//     marginBottom: 16,
//     textAlign: 'center',
//   },
//   statsRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   statItem: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   statNumber: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     marginBottom: 4,
//   },
//   statBlue: {
//     color: '#3b82f6',
//   },
//   statGreen: {
//     color: '#22c55e',
//   },
//   statOrange: {
//     color: '#f59e0b',
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#9ca3af',
//   },
//   statDivider: {
//     width: 1,
//     height: 40,
//     backgroundColor: '#e5e7eb',
//   },
//   quickActions: {
//     flexDirection: 'row',
//     gap: 12,
//     marginBottom: 16,
//   },
//   quickActionButton: {
//     flex: 1,
//     backgroundColor: '#ffffff',
//     borderRadius: 16,
//     padding: 16,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 1,
//   },
//   quickActionIcon: {
//     fontSize: 28,
//     marginBottom: 8,
//   },
//   quickActionText: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#374151',
//   },
//   menuCard: {
//     backgroundColor: '#ffffff',
//     borderRadius: 20,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 1,
//   },
//   menuItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     padding: 16,
//   },
//   menuItemBorder: {
//     borderBottomWidth: 1,
//     borderBottomColor: '#f3f4f6',
//   },
//   menuItemLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 14,
//   },
//   menuItemIcon: {
//     fontSize: 22,
//   },
//   menuItemLabel: {
//     fontSize: 16,
//     color: '#374151',
//   },
//   menuItemDanger: {
//     color: '#ef4444',
//   },
//   menuItemArrow: {
//     fontSize: 24,
//     color: '#9ca3af',
//   },
//   appInfo: {
//     alignItems: 'center',
//     marginTop: 32,
//   },
//   appName: {
//     fontSize: 16,
//     color: '#6b7280',
//     marginBottom: 4,
//   },
//   appVersion: {
//     fontSize: 13,
//     color: '#9ca3af',
//   },
//   bottomSpacer: {
//     height: 100,
//   },
// });

