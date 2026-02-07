import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	Alert,
	TextInput,
	Modal,
	ActivityIndicator,
	ScrollView,
	Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import {
	getDepartments,
	getDepartmentUsers,
	createDepartmentUser,
	updateDepartmentUser,
	toggleUserActive,
	resetUserPassword,
} from '../../src/services/adminService';
import { getDeptIcon } from '../../src/utils/adminUtils';

const USER_STATUS_OPTIONS = ['offline', 'active', 'working'];

export default function UsersScreen() {
	const router = useRouter();
	const { currentUser } = useApp();

	const [users, setUsers] = useState([]);
	const [departments, setDepartments] = useState([]);
	const [selectedDept, setSelectedDept] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);

	// Modal control
	const [modalMode, setModalMode] = useState(null); // null | 'add' | 'edit' | 'view'
	const [selectedUser, setSelectedUser] = useState(null);

	// Form fields
	const [formName, setFormName] = useState('');
	const [formEmail, setFormEmail] = useState('');
	const [formPhone, setFormPhone] = useState('');
	const [formDept, setFormDept] = useState(null);
	const [formStatus, setFormStatus] = useState('offline');

	const loadDepartments = useCallback(async () => {
		try {
			const depts = await getDepartments();
			setDepartments(depts);
		} catch (e) {
			console.error('Depts error:', e);
		}
	}, []);

	const loadUsers = useCallback(async () => {
		setIsLoading(true);
		try {
			const data = await getDepartmentUsers(selectedDept);
			setUsers(data);
		} catch (e) {
			console.error('Users error:', e);
			Alert.alert('Error', 'Failed to load users.');
		} finally {
			setIsLoading(false);
		}
	}, [selectedDept]);

	useEffect(() => {
		loadDepartments();
	}, [loadDepartments]);

	useEffect(() => {
		loadUsers();
	}, [loadUsers]);

	// ── Open Add Modal ──
	const openAddModal = useCallback(() => {
		setFormName('');
		setFormEmail('');
		setFormPhone('');
		setFormDept(null);
		setFormStatus('offline');
		setSelectedUser(null);
		setModalMode('add');
	}, []);

	// ── Open Edit Modal ──
	const openEditModal = useCallback((user) => {
		setFormName(user.fullName || '');
		setFormEmail(user.email || '');
		setFormPhone(user.phone || '');
		setFormDept(user.departmentId || null);
		setFormStatus(user.status || 'offline');
		setSelectedUser(user);
		setModalMode('edit');
	}, []);

	// ── Close Modal ──
	const closeModal = useCallback(() => {
		setModalMode(null);
		setSelectedUser(null);
	}, []);

	// ── Create User ──
	const handleCreate = async () => {
		if (!formName.trim()) {
			Alert.alert('Required', 'Please enter full name');
			return;
		}
		if (!formEmail.trim()) {
			Alert.alert('Required', 'Please enter email address');
			return;
		}
		if (!formDept) {
			Alert.alert('Required', 'Please select a department');
			return;
		}

		setSubmitting(true);
		try {
			const result = await createDepartmentUser(
				{
					fullName: formName.trim(),
					email: formEmail.trim().toLowerCase(),
					phone: formPhone.trim(),
					departmentId: formDept,
				},
				currentUser.uid,
			);

			closeModal();
			loadUsers();

			// Show success with temp password
			Alert.alert(
				'✅ User Created Successfully',
				`Account created for ${formEmail}.\n\n` +
					`Temporary Password:\n${result.tempPassword}\n\n` +
					`📋 Copy this password and share it securely with the user.\n\n` +
					`⚠️ User should change this password after first login.`,
				[
					{
						text: 'Copy Password',
						onPress: () => {
							Clipboard.setString(result.tempPassword);
							Alert.alert('Copied', 'Password copied to clipboard');
						},
					},
					{ text: 'OK' },
				],
			);
		} catch (e) {
			console.error('Create error:', e);
			Alert.alert('Error', e.message || 'Failed to create user.');
		} finally {
			setSubmitting(false);
		}
	};

	// ── Update User ──
	const handleUpdate = async () => {
		if (!formName.trim()) {
			Alert.alert('Required', 'Please enter full name');
			return;
		}
		if (!formDept) {
			Alert.alert('Required', 'Please select a department');
			return;
		}

		setSubmitting(true);
		try {
			await updateDepartmentUser(selectedUser.id, {
				fullName: formName.trim(),
				phone: formPhone.trim(),
				departmentId: formDept,
				status: formStatus,
			});

			closeModal();
			loadUsers();
			Alert.alert('Success', 'User updated successfully.');
		} catch (e) {
			console.error('Update error:', e);
			Alert.alert('Error', 'Failed to update user.');
		} finally {
			setSubmitting(false);
		}
	};

	// ── Toggle Active/Inactive ──
	const handleToggleActive = async (user) => {
		const newStatus = !user.isActive;
		const action = newStatus ? 'activate' : 'deactivate';

		Alert.alert(
			`${action.charAt(0).toUpperCase() + action.slice(1)} User`,
			`Are you sure you want to ${action} ${user.fullName}?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: action.charAt(0).toUpperCase() + action.slice(1),
					style: newStatus ? 'default' : 'destructive',
					onPress: async () => {
						try {
							await toggleUserActive(user.id, newStatus);
							loadUsers();
							Alert.alert('Success', `User ${action}d successfully.`);
						} catch (e) {
							Alert.alert('Error', `Failed to ${action} user.`);
						}
					},
				},
			],
		);
	};

	// ── Reset Password ──
	const handleResetPassword = useCallback(async (user) => {
		Alert.alert(
			'Reset Password',
			`Send password reset email to ${user.email}?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Send Email',
					onPress: async () => {
						try {
							await resetUserPassword(user.email);
							Alert.alert(
								'Success',
								`Password reset email sent to ${user.email}`,
							);
						} catch (e) {
							Alert.alert(
								'Error',
								'Failed to send password reset email.',
							);
						}
					},
				},
			],
		);
	}, []);

	// ── Helpers ──
	const getDeptName = useCallback(
		(deptId) => {
			const d = departments.find((dept) => dept.id === deptId);
			return d ? d.name : deptId || '—';
		},
		[departments],
	);

	const getDeptColorForUser = useCallback(
		(deptId) => {
			const d = departments.find((dept) => dept.id === deptId);
			return d ? getDeptIcon(d.name).color : '#6366f1';
		},
		[departments],
	);

	// ── Render User Card ──
	const renderUser = useCallback(
		({ item }) => {
			const deptColor = getDeptColorForUser(item.departmentId);
			const isActive = item.status === 'active' || item.status === 'working';

			return (
				<TouchableOpacity
					style={[styles.card, !item.isActive && styles.cardInactive]}
					onPress={() => openEditModal(item)}
					activeOpacity={0.7}
				>
					<View style={styles.avatar}>
						<Text style={styles.avatarText}>
							{item.fullName?.charAt(0)?.toUpperCase() || 'U'}
						</Text>
						<View
							style={[
								styles.onlineDot,
								{
									backgroundColor: isActive
										? '#22c55e'
										: '#475569',
								},
							]}
						/>
					</View>

					<View style={styles.info}>
						<Text style={styles.userName}>{item.fullName}</Text>
						<View style={styles.deptTag}>
							<View
								style={[
									styles.deptTagDot,
									{ backgroundColor: deptColor },
								]}
							/>
							<Text
								style={[
									styles.deptTagText,
									{ backgroundColor: deptColor },
								]}
							>
								{getDeptName(item.departmentId)}
							</Text>
						</View>
						<Text style={styles.userEmail}>{item.email}</Text>
						{!item.isActive && (
							<Text style={styles.inactiveLabel}>Deactivated</Text>
						)}
					</View>

					<View style={styles.cardRight}>
						<Text
							style={[
								styles.statusLabel,
								{ color: isActive ? '#22c55e' : '#64748b' },
							]}
						>
							{item.status || 'Offline'}
						</Text>
						<Ionicons
							name="chevron-forward"
							size={18}
							color="#475569"
							style={{ marginTop: 6 }}
						/>
					</View>
				</TouchableOpacity>
			);
		},
		[getDeptColorForUser, getDeptName, openEditModal],
	);

	// ════════════════════════════════════════════════════════════════════════
	return (
		<SafeAreaView style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity
					onPress={() => router.back()}
					style={styles.backButton}
				>
					<Ionicons name="arrow-back" size={24} color="#fff" />
				</TouchableOpacity>
				<Text style={styles.title}>Department Users</Text>
				<TouchableOpacity style={styles.addButton} onPress={openAddModal}>
					<Ionicons name="add" size={22} color="#fff" />
				</TouchableOpacity>
			</View>

			{/* Filter Chips */}
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				style={styles.filterScroll}
				contentContainerStyle={styles.filterList}
			>
				<TouchableOpacity
					style={[styles.chip, !selectedDept && styles.chipActive]}
					onPress={() => setSelectedDept(null)}
				>
					<Text
						style={[
							styles.chipText,
							!selectedDept && styles.chipTextActive,
						]}
					>
						All
					</Text>
				</TouchableOpacity>

				{departments.map((dept) => {
					const active = selectedDept === dept.id;
					const icon = getDeptIcon(dept.name);
					return (
						<TouchableOpacity
							key={dept.id}
							style={[
								styles.chip,
								active && {
									backgroundColor: icon.color,
									borderColor: icon.color,
								},
							]}
							onPress={() => setSelectedDept(dept.id)}
						>
							<Text style={{ fontSize: 14, marginRight: 5 }}>
								{icon.icon}
							</Text>
							<Text
								style={[
									styles.chipText,
									active && styles.chipTextActive,
								]}
							>
								{dept.name}
							</Text>
						</TouchableOpacity>
					);
				})}
			</ScrollView>

			{/* Users List */}
			{isLoading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#8b5cf6" />
				</View>
			) : (
				<FlatList
					data={users}
					renderItem={renderUser}
					keyExtractor={(item) => item.id?.toString()}
					contentContainerStyle={styles.list}
					ListEmptyComponent={
						<Text style={styles.emptyText}>No users found.</Text>
					}
				/>
			)}

			{/* ════════════════════════════════════════
          MODAL — Add/Edit User
          ════════════════════════════════════════ */}
			<Modal
				animationType="slide"
				transparent
				visible={modalMode !== null}
				onRequestClose={closeModal}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						{/* Header */}
						<View style={styles.modalHeaderRow}>
							<Text style={styles.modalTitle}>
								{modalMode === 'edit'
									? 'Edit User'
									: 'Add New User'}
							</Text>
							<TouchableOpacity onPress={closeModal}>
								<Ionicons name="close" size={22} color="#64748b" />
							</TouchableOpacity>
						</View>

						<ScrollView
							showsVerticalScrollIndicator={false}
							style={styles.modalScroll}
						>
							{/* Full Name */}
							<Text style={styles.inputLabel}>Full Name *</Text>
							<TextInput
								style={styles.input}
								placeholder="Ahmed Khan"
								placeholderTextColor="#64748b"
								value={formName}
								onChangeText={setFormName}
								autoCapitalize="words"
								editable={!submitting}
							/>

							{/* Email */}
							<Text style={styles.inputLabel}>Email Address *</Text>
							<TextInput
								style={[
									styles.input,
									modalMode === 'edit' && styles.inputDisabled,
								]}
								placeholder="ahmed@example.com"
								placeholderTextColor="#64748b"
								value={formEmail}
								onChangeText={setFormEmail}
								keyboardType="email-address"
								autoCapitalize="none"
								editable={modalMode === 'add' && !submitting}
							/>
							{modalMode === 'edit' && (
								<Text style={styles.helperText}>
									Email cannot be changed after creation
								</Text>
							)}

							{/* Phone */}
							<Text style={styles.inputLabel}>
								Phone Number (Optional)
							</Text>
							<TextInput
								style={styles.input}
								placeholder="+92 300 0000000"
								placeholderTextColor="#64748b"
								value={formPhone}
								onChangeText={setFormPhone}
								keyboardType="phone-pad"
								editable={!submitting}
							/>

							{/* Department */}
							<Text style={styles.inputLabel}>Department *</Text>
							<ScrollView
								style={styles.deptPicker}
								nestedScrollEnabled
							>
								{departments.map((dept) => {
									const active = formDept === dept.id;
									const icon = getDeptIcon(dept.name);
									return (
										<TouchableOpacity
											key={dept.id}
											style={[
												styles.deptPickerItem,
												active &&
													styles.deptPickerItemActive,
											]}
											onPress={() => setFormDept(dept.id)}
											disabled={submitting}
										>
											<View
												style={[
													styles.deptPickerIconBg,
													{
														backgroundColor:
															icon.color + '22',
													},
												]}
											>
												<Text style={{ fontSize: 16 }}>
													{icon.icon}
												</Text>
											</View>
											<Text
												style={[
													styles.deptPickerText,
													active &&
														styles.deptPickerTextActive,
												]}
											>
												{dept.name}
											</Text>
											{active && (
												<Ionicons
													name="checkmark"
													size={18}
													color="#8b5cf6"
												/>
											)}
										</TouchableOpacity>
									);
								})}
							</ScrollView>

							{/* Status (Edit mode only) */}
							{modalMode === 'edit' && (
								<>
									<Text style={styles.inputLabel}>Status</Text>
									<View style={styles.statusRow}>
										{USER_STATUS_OPTIONS.map((s) => {
											const active = formStatus === s;
											const dotColor =
												s === 'offline'
													? '#64748b'
													: '#22c55e';
											return (
												<TouchableOpacity
													key={s}
													style={[
														styles.statusChip,
														active &&
															styles.statusChipActive,
													]}
													onPress={() => setFormStatus(s)}
													disabled={submitting}
												>
													<View
														style={[
															styles.statusChipDot,
															{
																backgroundColor:
																	dotColor,
															},
														]}
													/>
													<Text
														style={[
															styles.statusChipText,
															active &&
																styles.statusChipTextActive,
														]}
													>
														{s.charAt(0).toUpperCase() +
															s.slice(1)}
													</Text>
												</TouchableOpacity>
											);
										})}
									</View>
								</>
							)}

							{/* Action Buttons */}
							<View style={styles.modalButtons}>
								<TouchableOpacity
									style={[
										styles.modalButton,
										styles.cancelButton,
									]}
									onPress={closeModal}
									disabled={submitting}
								>
									<Text style={styles.buttonText}>Cancel</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.modalButton, styles.saveButton]}
									onPress={
										modalMode === 'edit'
											? handleUpdate
											: handleCreate
									}
									disabled={submitting}
								>
									{submitting ? (
										<ActivityIndicator
											color="#fff"
											size="small"
										/>
									) : (
										<Text style={styles.buttonText}>
											{modalMode === 'edit'
												? 'Update'
												: 'Create User'}
										</Text>
									)}
								</TouchableOpacity>
							</View>

							{/* Edit-Only Actions */}
							{modalMode === 'edit' && selectedUser && (
								<View style={styles.extraActions}>
									<TouchableOpacity
										style={styles.actionButton}
										onPress={() =>
											handleResetPassword(selectedUser)
										}
										disabled={submitting}
									>
										<Ionicons
											name="key-outline"
											size={18}
											color="#3b82f6"
										/>
										<Text
											style={[
												styles.actionButtonText,
												{ color: '#3b82f6' },
											]}
										>
											Reset Password
										</Text>
									</TouchableOpacity>

									<TouchableOpacity
										style={styles.actionButton}
										onPress={() => {
											closeModal();
											handleToggleActive(selectedUser);
										}}
										disabled={submitting}
									>
										<Ionicons
											name={
												selectedUser.isActive
													? 'close-circle-outline'
													: 'checkmark-circle-outline'
											}
											size={18}
											color={
												selectedUser.isActive
													? '#ef4444'
													: '#22c55e'
											}
										/>
										<Text
											style={[
												styles.actionButtonText,
												{
													color: selectedUser.isActive
														? '#ef4444'
														: '#22c55e',
												},
											]}
										>
											{selectedUser.isActive
												? 'Deactivate User'
												: 'Activate User'}
										</Text>
									</TouchableOpacity>
								</View>
							)}
						</ScrollView>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#0f172a' },

	// Header
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#1e293b',
	},
	backButton: { padding: 8 },
	title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
	addButton: {
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: '#8b5cf6',
		alignItems: 'center',
		justifyContent: 'center',
	},

	// Filter chips
	filterScroll: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
	filterList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
	chip: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 14,
		paddingVertical: 7,
		borderRadius: 20,
		backgroundColor: '#1e293b',
		borderWidth: 1,
		borderColor: '#334155',
	},
	chipActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
	chipText: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
	chipTextActive: { color: '#fff' },

	// List
	loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
	list: { padding: 16 },
	card: {
		backgroundColor: '#1e293b',
		borderRadius: 14,
		padding: 14,
		marginBottom: 10,
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#334155',
	},
	cardInactive: { opacity: 0.6 },
	avatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: '#334155',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 14,
		position: 'relative',
	},
	avatarText: { color: '#fff', fontSize: 19, fontWeight: 'bold' },
	onlineDot: {
		position: 'absolute',
		bottom: 1,
		right: 1,
		width: 12,
		height: 12,
		borderRadius: 6,
		borderWidth: 2,
		borderColor: '#0f172a',
	},
	info: { flex: 1 },
	userName: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 3 },
	deptTag: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
	deptTagDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
	deptTagText: { fontSize: 12, fontWeight: '500' },
	userEmail: { color: '#64748b', fontSize: 12 },
	inactiveLabel: {
		color: '#ef4444',
		fontSize: 11,
		fontWeight: '600',
		marginTop: 2,
	},
	cardRight: { alignItems: 'flex-end' },
	statusLabel: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
	emptyText: {
		color: '#64748b',
		textAlign: 'center',
		marginTop: 48,
		fontSize: 15,
	},

	// Modal
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.6)',
		justifyContent: 'flex-end',
	},
	modalContent: {
		backgroundColor: '#1e293b',
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 24,
		maxHeight: '90%',
	},
	modalHeaderRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 20,
	},
	modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
	modalScroll: {},
	inputLabel: {
		color: '#94a3b8',
		fontSize: 13,
		fontWeight: '500',
		marginBottom: 5,
		marginTop: 2,
	},
	input: {
		backgroundColor: '#334155',
		borderRadius: 10,
		padding: 12,
		color: '#fff',
		fontSize: 15,
		marginBottom: 14,
	},
	inputDisabled: { opacity: 0.5 },
	helperText: {
		color: '#64748b',
		fontSize: 11,
		marginTop: -10,
		marginBottom: 10,
	},

	// Dept picker
	deptPicker: {
		maxHeight: 160,
		marginBottom: 16,
		backgroundColor: '#334155',
		borderRadius: 10,
		overflow: 'hidden',
	},
	deptPickerItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#1e293b',
	},
	deptPickerItemActive: { backgroundColor: '#475569' },
	deptPickerIconBg: {
		width: 30,
		height: 30,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 10,
	},
	deptPickerText: { color: '#cbd5e1', fontSize: 14, flex: 1 },
	deptPickerTextActive: { color: '#fff', fontWeight: '600' },

	// Status chips
	statusRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
	statusChip: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 20,
		backgroundColor: '#334155',
		borderWidth: 1,
		borderColor: '#475569',
	},
	statusChipActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
	statusChipDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
	statusChipText: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
	statusChipTextActive: { color: '#fff' },

	// Buttons
	modalButtons: { flexDirection: 'row', gap: 12, marginTop: 4 },
	modalButton: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
	cancelButton: { backgroundColor: '#475569' },
	saveButton: { backgroundColor: '#8b5cf6' },
	buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },

	// Extra actions
	extraActions: { marginTop: 20, gap: 10 },
	actionButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 14,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#334155',
		backgroundColor: '#1e293b',
	},
	actionButtonText: { marginLeft: 8, fontSize: 15, fontWeight: '600' },
});

