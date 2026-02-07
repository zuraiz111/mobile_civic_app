import React, { useState, useEffect } from 'react';
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
	Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
	getDepartments,
	addDepartment,
	updateDepartment,
	deleteDepartment,
} from '../../src/services/adminService';
import { getDeptIcon, formatDate } from '../../src/utils/adminUtils';

const ICON_OPTIONS = [
	{ label: 'Animal Rescue', iconName: 'paw', color: '#f59e0b' },
	{ label: 'Sewerage', iconName: 'layers', color: '#78716c' },
	{ label: 'Water', iconName: 'water-drop', color: '#3b82f6' },
	{ label: 'Sanitation', iconName: 'trash', color: '#64748b' },
	{ label: 'Electricity', iconName: 'flash', color: '#eab308' },
	{ label: 'Roads', iconName: 'car', color: '#f97316' },
	{ label: 'Parks', iconName: 'leaf', color: '#22c55e' },
	{ label: 'Health', iconName: 'medical', color: '#ef4444' },
	{ label: 'Education', iconName: 'school', color: '#8b5cf6' },
	{ label: 'Public Safety', iconName: 'shield', color: '#ec4899' },
	{ label: 'General', iconName: 'help-circle-outline', color: '#6366f1' },
	{ label: 'Transport', iconName: 'bus', color: '#14b8a6' },
];

export default function DepartmentsScreen() {
	const router = useRouter();

	const [departments, setDepartments] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);

	// Modal: mode = null | 'add' | 'edit'
	const [modalMode, setModalMode] = useState(null);
	const [editingDept, setEditingDept] = useState(null);

	// Form fields
	const [formName, setFormName] = useState('');
	const [formIcon, setFormIcon] = useState(ICON_OPTIONS[10]); // default General
	const [formIsActive, setFormIsActive] = useState(true);

	useEffect(() => {
		loadDepartments();
	}, []);

	const loadDepartments = async () => {
		setIsLoading(true);
		try {
			const data = await getDepartments();
			setDepartments(data);
		} catch (e) {
			console.error('Error loading departments:', e);
			Alert.alert('Error', 'Failed to load departments.');
		} finally {
			setIsLoading(false);
		}
	};

	// ── Open Add modal ──
	const openAddModal = () => {
		setFormName('');
		setFormIcon(ICON_OPTIONS[10]);
		setFormIsActive(true);
		setEditingDept(null);
		setModalMode('add');
	};

	// ── Open Edit modal (pre-fill) ──
	const openEditModal = (dept) => {
		setFormName(dept.name || '');
		// Find the matching icon option by iconName; fall back to resolved icon
		const match = ICON_OPTIONS.find((o) => o.iconName === dept.iconName);
		setFormIcon(
			match || {
				label: dept.name,
				iconName: dept.iconName || 'help-circle-outline',
				color: dept.color || '#6366f1',
			},
		);
		setFormIsActive(dept.isActive !== false); // treat undefined as true
		setEditingDept(dept);
		setModalMode('edit');
	};

	const closeModal = () => {
		setModalMode(null);
		setEditingDept(null);
	};

	// ── Create ──
	const handleAdd = async () => {
		if (!formName.trim()) {
			Alert.alert('Validation', 'Please enter a department name.');
			return;
		}
		const exists = departments.some(
			(d) => d.name.toLowerCase() === formName.trim().toLowerCase(),
		);
		if (exists) {
			Alert.alert('Duplicate', 'A department with this name already exists.');
			return;
		}

		setSubmitting(true);
		try {
			await addDepartment({
				name: formName.trim(),
				iconName: formIcon.iconName,
				color: formIcon.color,
			});
			closeModal();
			loadDepartments();
			Alert.alert('Success', 'Department added successfully.');
		} catch (e) {
			console.error('Add dept error:', e);
			Alert.alert('Error', 'Failed to add department.');
		} finally {
			setSubmitting(false);
		}
	};

	// ── Update ──
	const handleUpdate = async () => {
		if (!formName.trim()) {
			Alert.alert('Validation', 'Department name cannot be empty.');
			return;
		}
		// Check duplicate only if name actually changed
		if (formName.trim().toLowerCase() !== editingDept.name.toLowerCase()) {
			const exists = departments.some(
				(d) => d.name.toLowerCase() === formName.trim().toLowerCase(),
			);
			if (exists) {
				Alert.alert(
					'Duplicate',
					'A department with this name already exists.',
				);
				return;
			}
		}

		setSubmitting(true);
		try {
			await updateDepartment(editingDept.id, {
				name: formName.trim(),
				iconName: formIcon.iconName,
				color: formIcon.color,
				isActive: formIsActive,
			});
			closeModal();
			loadDepartments();
			Alert.alert('Success', 'Department updated successfully.');
		} catch (e) {
			console.error('Update dept error:', e);
			Alert.alert('Error', 'Failed to update department.');
		} finally {
			setSubmitting(false);
		}
	};

	// ── Delete (with confirmation) ──
	const handleDelete = () => {
		Alert.alert(
			'Delete Department',
			`Are you sure you want to delete "${editingDept.name}"? This cannot be undone.`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						setSubmitting(true);
						try {
							await deleteDepartment(editingDept.id);
							closeModal();
							loadDepartments();
							Alert.alert('Success', 'Department deleted.');
						} catch (e) {
							console.error('Delete dept error:', e);
							Alert.alert('Error', 'Failed to delete department.');
						} finally {
							setSubmitting(false);
						}
					},
				},
			],
		);
	};

	const resolveIcon = (dept) => {
		return getDeptIcon(dept.name);
	};

	// ── Render department card ──
	const renderItem = ({ item }) => {
		const icon = resolveIcon(item);
		const isActive = item.isActive !== false;

		return (
			<TouchableOpacity
				style={[styles.card, !isActive && styles.cardInactive]}
				onPress={() => openEditModal(item)}
				activeOpacity={0.7}
			>
				<View
					style={[styles.iconBg, { backgroundColor: icon.color + '22' }]}
				>
					<Text style={{ fontSize: 26 }}>{icon.icon}</Text>
				</View>
				<View style={styles.info}>
					<Text style={styles.name}>{item.name}</Text>
					<Text
						style={[
							styles.status,
							{ color: isActive ? '#22c55e' : '#64748b' },
						]}
					>
						{isActive ? 'Active' : 'Inactive'}
					</Text>
				</View>
				<Ionicons name="chevron-forward" size={20} color="#475569" />
			</TouchableOpacity>
		);
	};

	// ──────────────────────────────────────────
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
				<Text style={styles.title}>Departments</Text>
				<TouchableOpacity style={styles.addButton} onPress={openAddModal}>
					<Ionicons name="add" size={22} color="#fff" />
				</TouchableOpacity>
			</View>

			{/* List */}
			{isLoading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#8b5cf6" />
				</View>
			) : (
				<FlatList
					data={departments}
					renderItem={renderItem}
					keyExtractor={(item) => item.id?.toString()}
					contentContainerStyle={styles.list}
					ListEmptyComponent={
						<Text style={styles.emptyText}>
							No departments yet. Tap + to add one.
						</Text>
					}
				/>
			)}

			{/* ════════════════════════════════════════
          MODAL — shared for Add & Edit
          ════════════════════════════════════════ */}
			<Modal
				animationType="slide"
				transparent
				visible={modalMode !== null}
				onRequestClose={closeModal}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						{/* Title + close */}
						<View style={styles.modalHeaderRow}>
							<Text style={styles.modalTitle}>
								{modalMode === 'edit'
									? 'Edit Department'
									: 'New Department'}
							</Text>
							<TouchableOpacity onPress={closeModal}>
								<Ionicons name="close" size={22} color="#64748b" />
							</TouchableOpacity>
						</View>

						<ScrollView showsVerticalScrollIndicator={false}>
							{/* Name */}
							<Text style={styles.inputLabel}>Department Name</Text>
							<TextInput
								style={styles.input}
								placeholder="e.g. Water Supply"
								placeholderTextColor="#64748b"
								value={formName}
								onChangeText={setFormName}
								autoCapitalize="words"
							/>

							{/* Icon Picker */}
							<Text style={styles.inputLabel}>Choose Icon</Text>
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								style={styles.iconScroll}
							>
								{ICON_OPTIONS.map((opt) => {
									const active =
										formIcon.iconName === opt.iconName;
									return (
										<TouchableOpacity
											key={opt.iconName}
											style={styles.iconOption}
											onPress={() => setFormIcon(opt)}
										>
											<View
												style={[
													styles.iconOptionCircle,
													{
														backgroundColor:
															opt.color + '22',
													},
													active && {
														borderWidth: 2,
														borderColor: opt.color,
													},
												]}
											>
												<Ionicons
													name={opt.iconName}
													size={22}
													color={opt.color}
												/>
											</View>
											<Text
												style={[
													styles.iconOptionLabel,
													active && {
														color: opt.color,
														fontWeight: '600',
													},
												]}
											>
												{opt.label}
											</Text>
										</TouchableOpacity>
									);
								})}
							</ScrollView>

							{/* Live Preview */}
							<View style={styles.previewRow}>
								<View
									style={[
										styles.previewIconBg,
										{ backgroundColor: formIcon.color + '22' },
									]}
								>
									<Ionicons
										name={formIcon.iconName}
										size={28}
										color={formIcon.color}
									/>
								</View>
								<Text style={styles.previewLabel}>
									{formName.trim() || 'Department Name'}
								</Text>
							</View>

							{/* ── Edit-only fields ── */}
							{modalMode === 'edit' && (
								<>
									{/* Created At (read-only) */}
									<Text style={styles.inputLabel}>
										Created At
									</Text>
									<View style={styles.readOnlyField}>
										<Ionicons
											name="calendar"
											size={16}
											color="#64748b"
											style={{ marginRight: 8 }}
										/>
										<Text style={styles.readOnlyText}>
											{editingDept?.createdAt
												? formatDate(editingDept.createdAt)
												: 'Unknown'}
										</Text>
									</View>

									{/* Active / Inactive toggle */}
									<View style={styles.toggleRow}>
										<View>
											<Text style={styles.toggleLabel}>
												Active
											</Text>
											<Text style={styles.toggleDesc}>
												{formIsActive
													? 'Department is currently active'
													: 'Department is inactive'}
											</Text>
										</View>
										<Switch
											value={formIsActive}
											onValueChange={setFormIsActive}
											trackColor={{
												false: '#334155',
												true: '#22c55e',
											}}
											thumbColor="#ffffff"
											ios_backgroundColor="#334155"
										/>
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
								>
									<Text style={styles.buttonText}>Cancel</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.modalButton, styles.saveButton]}
									onPress={
										modalMode === 'edit'
											? handleUpdate
											: handleAdd
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
												: 'Add Department'}
										</Text>
									)}
								</TouchableOpacity>
							</View>

							{/* Delete button — edit mode only, at the bottom */}
							{modalMode === 'edit' && (
								<TouchableOpacity
									style={styles.deleteButton}
									onPress={handleDelete}
									disabled={submitting}
								>
									<Ionicons
										name="trash"
										size={18}
										color="#ef4444"
										style={{ marginRight: 8 }}
									/>
									<Text style={styles.deleteButtonText}>
										Delete Department
									</Text>
								</TouchableOpacity>
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

	// List
	loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
	list: { padding: 16 },
	card: {
		backgroundColor: '#1e293b',
		borderRadius: 14,
		padding: 16,
		marginBottom: 10,
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#334155',
	},
	cardInactive: { opacity: 0.55 },
	iconBg: {
		width: 50,
		height: 50,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 14,
	},
	info: { flex: 1 },
	name: { color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 3 },
	status: { fontSize: 13, fontWeight: '500' },
	emptyText: {
		color: '#64748b',
		textAlign: 'center',
		marginTop: 48,
		fontSize: 15,
	},

	// Modal
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.55)',
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
		padding: 13,
		color: '#fff',
		fontSize: 16,
		marginBottom: 16,
	},

	// Icon scroll picker
	iconScroll: { marginBottom: 16 },
	iconOption: { alignItems: 'center', marginRight: 12, width: 68 },
	iconOptionCircle: {
		width: 52,
		height: 52,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 5,
	},
	iconOptionLabel: { color: '#64748b', fontSize: 10, textAlign: 'center' },

	// Preview
	previewRow: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#334155',
		borderRadius: 12,
		padding: 12,
		marginBottom: 16,
	},
	previewIconBg: {
		width: 44,
		height: 44,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	previewLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },

	// Read-only field (Created At)
	readOnlyField: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#334155',
		borderRadius: 10,
		padding: 12,
		marginBottom: 16,
	},
	readOnlyText: { color: '#94a3b8', fontSize: 14 },

	// Toggle row (Active/Inactive)
	toggleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#334155',
		borderRadius: 10,
		padding: 14,
		marginBottom: 20,
	},
	toggleLabel: {
		color: '#fff',
		fontSize: 15,
		fontWeight: '500',
		marginBottom: 2,
	},
	toggleDesc: { color: '#64748b', fontSize: 12 },

	// Buttons
	modalButtons: { flexDirection: 'row', gap: 12, marginTop: 4 },
	modalButton: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
	cancelButton: { backgroundColor: '#475569' },
	saveButton: { backgroundColor: '#8b5cf6' },
	buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },

	// Delete button
	deleteButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 20,
		padding: 14,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#ef4444',
	},
	deleteButtonText: { color: '#ef4444', fontWeight: '600', fontSize: 15 },
});

