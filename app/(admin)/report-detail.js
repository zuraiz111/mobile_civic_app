import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	Modal,
	Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
	getReportById,
	getUserById,
	updateReportStatus,
	assignReport,
	changeReportDepartment,
	getDepartments,
	getDepartmentUsers,
} from '../../src/services/adminService';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../src/config/firebase';
import {
	normalizeStatus,
	getStatusStyle,
	getDeptIcon,
	formatDate,
	formatDateTime,
} from '../../src/utils/adminUtils';

const STATUS_OPTIONS = [
	{ key: 'pending', label: 'Pending', icon: 'time-outline' },
	{ key: 'inProgress', label: 'In Progress', icon: 'reload-circle-outline' },
	{ key: 'resolved', label: 'Resolved', icon: 'checkmark-circle-outline' },
	{ key: 'closed', label: 'Closed', icon: 'close-circle-outline' },
];

export default function AdminReportDetailScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams();

	const [report, setReport] = useState(null);
	const [citizenInfo, setCitizenInfo] = useState(null); // ← the citizen who submitted
	const [isLoading, setIsLoading] = useState(true);
	const [departments, setDepartments] = useState([]);
	const [deptUsers, setDeptUsers] = useState([]);

	const [showDeptModal, setShowDeptModal] = useState(false);
	const [showUserModal, setShowUserModal] = useState(false);
	const [processing, setProcessing] = useState(false);

	// ── Load report + departments + citizen info ──
	const loadData = useCallback(async () => {
		setIsLoading(true);
		try {
			const [reportData, deptsData] = await Promise.all([
				getReportById(id),
				getDepartments(),
			]);

			if (!reportData) {
				Alert.alert('Error', 'Report not found.');
				router.back();
				return;
			}

			setReport(reportData);
			setDepartments(deptsData);

			// Fetch the citizen who submitted this report
			if (reportData.userId) {
				const citizen = await getUserById(reportData.userId);
				setCitizenInfo(citizen);
			}
		} catch (e) {
			console.error('Report detail load error:', e);
			Alert.alert('Error', 'Failed to load report.');
		} finally {
			setIsLoading(false);
		}
	}, [id, router]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const loadDeptUsers = useCallback(
		async (categoryName) => {
			try {
				const dept = departments.find(
					(d) => d.name === categoryName || d.id === categoryName,
				);
				const users = await getDepartmentUsers(dept?.id || categoryName);
				setDeptUsers(users);
			} catch (e) {
				console.error('Dept users load error:', e);
				setDeptUsers([]);
			}
		},
		[departments],
	);

	useEffect(() => {
		if (report?.category) loadDeptUsers(report.category);
	}, [report?.category, loadDeptUsers]);

	// ── Call citizen's phone ──
	const handleCall = () => {
		if (!citizenInfo?.phone) return;
		const phone = citizenInfo.phone.replace(/[^0-9+]/g, ''); // strip spaces/dashes
		Linking.openURL(`tel:${phone}`);
	};

	// ── Status update ──
	const handleUpdateStatus = async (newStatus) => {
		setProcessing(true);
		try {
			await updateReportStatus(report.id, newStatus);
			setReport((prev) => ({
				...prev,
				status: newStatus,
				timeline: [
					...(prev.timeline || []),
					{
						date: new Date().toISOString(),
						note: `Status changed to ${newStatus}`,
						status: newStatus,
					},
				],
			}));
			Alert.alert('Success', `Status updated to ${newStatus}.`);
		} catch (e) {
			Alert.alert('Error', 'Failed to update status.');
		} finally {
			setProcessing(false);
		}
	};

	// ── Assign user ──
	const handleAssignUser = async (user) => {
		setProcessing(true);
		const userName = user.fullName || user.name || 'Unknown User';
		try {
			await assignReport(report.id, user.id, userName);
			setReport((prev) => ({
				...prev,
				assignedTo: user.id,
				assignedUserName: userName,
				status: 'assigned',
				timeline: [
					...(prev.timeline || []),
					{
						date: new Date().toISOString(),
						note: `Assigned to ${userName}`,
						status: 'assigned',
					},
				],
			}));
			setShowUserModal(false);
			Alert.alert('Success', `Report assigned to ${userName}.`);
		} catch (e) {
			Alert.alert('Error', 'Failed to assign report.');
		} finally {
			setProcessing(false);
		}
	};

	// ── Change department ──
	const handleChangeDepartment = async (dept) => {
		setProcessing(true);
		try {
			await changeReportDepartment(report.id, dept.name);

			setReport((prev) => ({
				...prev,
				category: dept.name,
				assignedTo: null,
				assignedUserName: null,
				status: 'pending',
				timeline: [
					...(prev.timeline || []),
					{
						date: new Date().toISOString(),
						note: `Department changed to ${dept.name}`,
						status: 'pending',
					},
				],
			}));
			setShowDeptModal(false);
			Alert.alert('Success', `Department changed to ${dept.name}.`);
		} catch (e) {
			console.error('Dept change error:', e);
			Alert.alert('Error', 'Failed to update department.');
		} finally {
			setProcessing(false);
		}
	};

	// ── Loading ──
	if (isLoading) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#8b5cf6" />
				</View>
			</SafeAreaView>
		);
	}
	if (!report) return null;

	const ns = normalizeStatus(report.status);
	const statusStyle = getStatusStyle(ns);
	const deptIcon = getDeptIcon(report.category);

	// ── RENDER ──
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
				<Text style={styles.headerTitle}>Report Details</Text>
				<View style={styles.backButton} />
			</View>

			<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
				{/* ── Status Banner ── */}
				<View
					style={[
						styles.statusBanner,
						{ backgroundColor: statusStyle.bg },
					]}
				>
					<Ionicons
						name={
							STATUS_OPTIONS.find((s) => s.key === ns)?.icon ||
							'information-circle'
						}
						size={18}
						color={statusStyle.text}
						style={{ marginRight: 8 }}
					/>
					<Text
						style={[
							styles.statusBannerText,
							{ color: statusStyle.text },
						]}
					>
						{STATUS_OPTIONS.find((s) => s.key === ns)?.label || ns}
					</Text>
				</View>

				{/* ── Report Info Card ── */}
				<View style={styles.card}>
					<View style={styles.titleRow}>
						<View
							style={[
								styles.titleIconBg,
								{ backgroundColor: deptIcon.color + '22' },
							]}
						>
							<Text style={{ fontSize: 24 }}>{deptIcon.icon}</Text>
						</View>
						<Text style={styles.reportTitle} numberOfLines={2}>
							{report.title}
						</Text>
					</View>

					<Text style={styles.reportDesc}>
						{report.description || 'No description provided.'}
					</Text>

					<View style={styles.metaGrid}>
						<View style={styles.metaItem}>
							<Ionicons name="location" size={14} color="#64748b" />
							<Text style={styles.metaText}>
								{report.location || 'No location'}
							</Text>
						</View>
						<View style={styles.metaItem}>
							<Ionicons name="calendar" size={14} color="#64748b" />
							<Text style={styles.metaText}>
								{formatDate(report.createdAt)}
							</Text>
						</View>
						<View style={styles.metaItem}>
							<Ionicons
								name="alert-circle"
								size={14}
								color="#64748b"
							/>
							<Text style={styles.metaText}>
								Priority: {report.priority || 'N/A'}
							</Text>
						</View>
						<View style={styles.metaItem}>
							<Ionicons
								name="document-text"
								size={14}
								color="#64748b"
							/>
							<Text style={[styles.metaText, styles.idText]}>
								ID: {report.id}
							</Text>
						</View>
					</View>
				</View>

				{/* ── SUBMITTED BY (Citizen Info) ── */}
				<Text style={styles.sectionLabel}>Submitted By</Text>
				<View style={styles.citizenCard}>
					{citizenInfo ? (
						<>
							{/* Left: avatar + name + phone */}
							<View style={styles.citizenLeft}>
								<View style={styles.citizenAvatar}>
									<Text style={styles.citizenAvatarLetter}>
										{citizenInfo.name
											?.charAt(0)
											?.toUpperCase() || '?'}
									</Text>
								</View>
								<View style={styles.citizenInfo}>
									<Text style={styles.citizenName}>
										{citizenInfo.name || 'Unknown Citizen'}
									</Text>
									<Text style={styles.citizenPhone}>
										{citizenInfo.phone || 'No phone'}
									</Text>
									<Text style={styles.citizenId}>
										User ID: {citizenInfo.id}
									</Text>
								</View>
							</View>

							{/* Right: Call button (only if phone exists) */}
							{citizenInfo.phone ? (
								<TouchableOpacity
									style={styles.callButton}
									onPress={handleCall}
									activeOpacity={0.7}
								>
									<Ionicons name="call" size={20} color="#fff" />
								</TouchableOpacity>
							) : null}
						</>
					) : (
						/* No citizen doc found — show the raw userId at least */
						<View style={styles.citizenLeft}>
							<View
								style={[
									styles.citizenAvatar,
									{ backgroundColor: '#475569' },
								]}
							>
								<Ionicons
									name="person-outline"
									size={22}
									color="#94a3b8"
								/>
							</View>
							<View style={styles.citizenInfo}>
								<Text style={styles.citizenName}>
									Unknown Citizen
								</Text>
								<Text style={styles.citizenPhone}>
									{report.userId
										? `User ID: ${report.userId}`
										: 'No submitter info'}
								</Text>
							</View>
						</View>
					)}
				</View>

				{/* ── Department Selector ── */}
				<Text style={styles.sectionLabel}>Department</Text>
				<TouchableOpacity
					style={styles.selector}
					onPress={() => setShowDeptModal(true)}
				>
					<View style={styles.selectorLeft}>
						<View
							style={[
								styles.selectorIconBg,
								{ backgroundColor: deptIcon.color + '22' },
							]}
						>
							<Text style={{ fontSize: 18 }}>{deptIcon.icon}</Text>
						</View>
						<Text style={styles.selectorText}>
							{report.category || 'Not assigned'}
						</Text>
					</View>
					<Ionicons name="chevron-forward" size={18} color="#64748b" />
				</TouchableOpacity>

				{/* ── Assigned User Selector ── */}
				<Text style={styles.sectionLabel}>Assigned To</Text>
				<TouchableOpacity
					style={styles.selector}
					onPress={() => setShowUserModal(true)}
				>
					<View style={styles.selectorLeft}>
						<View style={styles.selectorIconBg}>
							<Ionicons name="person" size={18} color="#8b5cf6" />
						</View>
						<Text style={styles.selectorText}>
							{report.assignedUserName ||
								(report.assignedTo
									? `User ${report.assignedTo}`
									: 'Unassigned')}
						</Text>
					</View>
					<Ionicons name="chevron-forward" size={18} color="#64748b" />
				</TouchableOpacity>
				{deptUsers.length === 0 && (
					<Text style={styles.hintText}>
						No users in this department.
					</Text>
				)}

				{/* ── Status Buttons ── */}
				<Text style={styles.sectionLabel}>Update Status</Text>
				<View style={styles.statusGrid}>
					{STATUS_OPTIONS.map((opt) => {
						const active = ns === opt.key;
						const sStyle = getStatusStyle(opt.key);
						return (
							<TouchableOpacity
								key={opt.key}
								style={[
									styles.statusBtn,
									active && {
										backgroundColor: sStyle.bg,
										borderColor: sStyle.text,
									},
								]}
								onPress={() => handleUpdateStatus(opt.key)}
								disabled={processing || active}
							>
								<Ionicons
									name={opt.icon}
									size={16}
									color={active ? sStyle.text : '#64748b'}
									style={{ marginRight: 6 }}
								/>
								<Text
									style={[
										styles.statusBtnText,
										active && {
											color: sStyle.text,
											fontWeight: '700',
										},
									]}
								>
									{opt.label}
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>

				{/* ── Timeline ── */}
				{report.timeline && report.timeline.length > 0 && (
					<>
						<Text style={styles.sectionLabel}>Timeline</Text>
						<View style={styles.timelineWrap}>
							{[...report.timeline].reverse().map((entry, i) => {
								const eStyle = getStatusStyle(
									normalizeStatus(entry.status),
								);
								return (
									<View key={i} style={styles.timelineEntry}>
										<View style={styles.timelineDotWrap}>
											<View
												style={[
													styles.timelineDot,
													{
														backgroundColor:
															eStyle.text,
													},
												]}
											/>
											{i < report.timeline.length - 1 && (
												<View
													style={[
														styles.timelineLine,
														{
															backgroundColor:
																eStyle.text + '33',
														},
													]}
												/>
											)}
										</View>
										<View style={styles.timelineContent}>
											<Text style={styles.timelineNote}>
												{entry.note}
											</Text>
											<Text style={styles.timelineDate}>
												{formatDateTime(entry.date)}
											</Text>
										</View>
									</View>
								);
							})}
						</View>
					</>
				)}

				<View style={{ height: 40 }} />
			</ScrollView>

			{/* ──────── DEPARTMENT MODAL ──────── */}
			<Modal
				visible={showDeptModal}
				animationType="slide"
				transparent
				onRequestClose={() => setShowDeptModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>Select Department</Text>
						<ScrollView style={styles.modalList}>
							{departments.map((dept) => {
								const dIcon = getDeptIcon(dept.name);
								const active = report.category === dept.name;
								return (
									<TouchableOpacity
										key={dept.id}
										style={[
											styles.modalItem,
											active && styles.modalItemActive,
										]}
										onPress={() => handleChangeDepartment(dept)}
									>
										<View
											style={[
												styles.modalItemIconBg,
												{
													backgroundColor:
														dIcon.color + '22',
												},
											]}
										>
											<Text style={{ fontSize: 18 }}>
												{dIcon.icon}
											</Text>
										</View>
										<Text
											style={[
												styles.modalItemText,
												active &&
													styles.modalItemTextActive,
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
						<TouchableOpacity
							style={styles.modalCloseBtn}
							onPress={() => setShowDeptModal(false)}
						>
							<Text style={styles.modalCloseBtnText}>Cancel</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>

			{/* ──────── USER MODAL ──────── */}
			<Modal
				visible={showUserModal}
				animationType="slide"
				transparent
				onRequestClose={() => setShowUserModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>Assign User</Text>
						<ScrollView style={styles.modalList}>
							{deptUsers.map((user) => {
								const active = report.assignedTo === user.id;
								return (
									<TouchableOpacity
										key={user.id}
										style={[
											styles.modalItem,
											active && styles.modalItemActive,
										]}
										onPress={() => handleAssignUser(user)}
									>
										<View style={styles.modalUserAvatar}>
											<Text
												style={styles.modalUserAvatarText}
											>
												{user.name?.charAt(0) || 'U'}
											</Text>
										</View>
										<View style={{ flex: 1 }}>
											<Text
												style={[
													styles.modalItemText,
													active &&
														styles.modalItemTextActive,
												]}
											>
												{user.name}
											</Text>
											<Text style={styles.modalItemSub}>
												{user.phone || ''}
											</Text>
										</View>
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
							{deptUsers.length === 0 && (
								<Text style={styles.modalEmptyText}>
									No users in this department.
								</Text>
							)}
						</ScrollView>
						<TouchableOpacity
							style={styles.modalCloseBtn}
							onPress={() => setShowUserModal(false)}
						>
							<Text style={styles.modalCloseBtnText}>Cancel</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

// ═══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#0f172a' },
	loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

	// Header
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#1e293b',
	},
	backButton: { padding: 8, width: 40 },
	headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },

	// Scroll
	content: { flex: 1, padding: 16 },

	// Status banner
	statusBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		borderRadius: 10,
		marginBottom: 16,
	},
	statusBannerText: { fontWeight: '600', fontSize: 15 },

	// Info card
	card: {
		backgroundColor: '#1e293b',
		borderRadius: 14,
		padding: 16,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: '#334155',
	},
	titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
	titleIconBg: {
		width: 42,
		height: 42,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
		flexShrink: 0,
	},
	reportTitle: {
		flex: 1,
		fontSize: 20,
		fontWeight: 'bold',
		color: '#fff',
		lineHeight: 26,
	},
	reportDesc: {
		color: '#cbd5e1',
		fontSize: 15,
		lineHeight: 23,
		marginBottom: 16,
	},
	metaGrid: { gap: 8 },
	metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
	metaText: { color: '#64748b', fontSize: 13 },
	idText: { fontFamily: 'monospace', color: '#8b5cf6' },

	// Section labels
	sectionLabel: {
		fontSize: 13,
		fontWeight: '600',
		color: '#64748b',
		textTransform: 'uppercase',
		letterSpacing: 0.8,
		marginBottom: 8,
		marginTop: 4,
	},

	// ── Citizen / Submitted By card ──
	citizenCard: {
		backgroundColor: '#1e293b',
		borderRadius: 14,
		padding: 16,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: '#334155',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	citizenLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
	citizenAvatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: '#8b5cf6',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 14,
	},
	citizenAvatarLetter: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
	citizenInfo: { flex: 1 },
	citizenName: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 2,
	},
	citizenPhone: { color: '#94a3b8', fontSize: 13, marginBottom: 2 },
	citizenId: { color: '#475569', fontSize: 11, fontFamily: 'monospace' },
	callButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: '#22c55e',
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 12,
	},

	// Selectors
	selector: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#1e293b',
		borderRadius: 12,
		padding: 14,
		borderWidth: 1,
		borderColor: '#334155',
		marginBottom: 16,
	},
	selectorLeft: { flexDirection: 'row', alignItems: 'center' },
	selectorIconBg: {
		width: 36,
		height: 36,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#334155',
		marginRight: 10,
	},
	selectorText: { color: '#fff', fontSize: 15, fontWeight: '500' },
	hintText: { color: '#ef4444', fontSize: 12, marginBottom: 16, marginLeft: 2 },

	// Status buttons
	statusGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginBottom: 20,
	},
	statusBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 14,
		paddingVertical: 9,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#334155',
		backgroundColor: '#1e293b',
	},
	statusBtnText: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },

	// Timeline
	timelineWrap: { marginBottom: 8 },
	timelineEntry: { flexDirection: 'row', marginBottom: 4 },
	timelineDotWrap: { alignItems: 'center', marginRight: 12, width: 16 },
	timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
	timelineLine: { width: 2, flex: 1, minHeight: 28 },
	timelineContent: { flex: 1, paddingBottom: 16 },
	timelineNote: {
		color: '#cbd5e1',
		fontSize: 14,
		fontWeight: '500',
		marginBottom: 2,
	},
	timelineDate: { color: '#64748b', fontSize: 12 },

	// Modals
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
		maxHeight: '75%',
	},
	modalTitle: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
		textAlign: 'center',
		marginBottom: 16,
	},
	modalList: { marginBottom: 12 },
	modalItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 14,
		borderBottomWidth: 1,
		borderBottomColor: '#334155',
	},
	modalItemActive: { backgroundColor: '#334155' },
	modalItemIconBg: {
		width: 34,
		height: 34,
		borderRadius: 9,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	modalItemText: { color: '#cbd5e1', fontSize: 15, flex: 1 },
	modalItemTextActive: { color: '#fff', fontWeight: '600' },
	modalItemSub: { color: '#64748b', fontSize: 12 },
	modalUserAvatar: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#334155',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	modalUserAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
	modalEmptyText: {
		color: '#64748b',
		textAlign: 'center',
		padding: 24,
		fontSize: 14,
	},
	modalCloseBtn: {
		padding: 14,
		backgroundColor: '#475569',
		borderRadius: 10,
		alignItems: 'center',
	},
	modalCloseBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});

