import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	FlatList,
	ActivityIndicator,
	RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { getAllReports, getDepartments } from '../../src/services/adminService';
import {
	normalizeStatus,
	getStatusStyle,
	getDeptIcon,
	formatDate,
	STATUS_PENDING,
	STATUS_ASSIGNED,
	STATUS_IN_PROGRESS,
	STATUS_RESOLVED,
} from '../../src/utils/adminUtils';

export default function AdminDashboardScreen() {
	const router = useRouter();
	const { logout } = useApp();
	const { language, setLanguage, t } = useLanguage();

	const [reports, setReports] = useState([]);
	const [departments, setDepartments] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	// Derived stats – recalculated whenever reports change
	const stats = useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayTime = today.getTime();

		let total = 0,
			pending = 0,
			inProgress = 0,
			resolved = 0,
			todayCount = 0;

		reports.forEach((r) => {
			total++;
			const ns = normalizeStatus(r.status);
			if (ns === STATUS_PENDING || ns === STATUS_ASSIGNED) pending++;
			if (ns === STATUS_IN_PROGRESS) inProgress++;
			if (ns === STATUS_RESOLVED) resolved++;

			// Count today's reports
			if (r.createdAt) {
				const reportDate = new Date(r.createdAt);
				reportDate.setHours(0, 0, 0, 0);
				if (reportDate.getTime() === todayTime) todayCount++;
			}
		});

		return { total, pending, inProgress, resolved, todayCount };
	}, [reports]);

	// Department report counts
	const deptStats = useMemo(() => {
		const map = {};
		reports.forEach((r) => {
			if (r.category) map[r.category] = (map[r.category] || 0) + 1;
		});
		return map;
	}, [reports]);

	// ── Data Loading ──
	const loadData = useCallback(async () => {
		try {
			const [reportsData, deptsData] = await Promise.all([
				getAllReports(),
				getDepartments(),
			]);
			setReports(reportsData);
			setDepartments(deptsData);
		} catch (e) {
			console.error('Dashboard load error:', e);
		} finally {
			setIsLoading(false);
			setRefreshing(false);
		}
	}, []);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const onRefresh = useCallback(() => {
		setRefreshing(true);
		loadData();
	}, [loadData]);

	// ── Handlers ──
	const toggleLanguage = () => setLanguage(language === 'en' ? 'ur' : 'en');

	const handleLogout = async () => {
		await logout();
		router.replace('/');
	};

	const goToSettings = () => router.push('/(admin)/settings');

	// ── Render: Recent Report Card ──
	const renderRecentReport = ({ item }) => {
		const ns = normalizeStatus(item.status);
		const statusStyle = getStatusStyle(ns);
		const deptIcon = getDeptIcon(item.category);

		return (
			<TouchableOpacity
				style={styles.reportCard}
				onPress={() =>
					router.push({
						pathname: '/(admin)/report-detail',
						params: { id: item.id },
					})
				}
				activeOpacity={0.7}
			>
				<View style={styles.reportRow}>
					{/* Department Icon */}
					<View
						style={[
							styles.reportIconBg,
							{ backgroundColor: deptIcon.color + '22' },
						]}
					>
						<Text style={{ fontSize: 22 }}>{deptIcon.icon}</Text>
					</View>

					{/* Info */}
					<View style={styles.reportInfo}>
						<Text style={styles.reportTitle} numberOfLines={1}>
							{item.title}
						</Text>
						<Text style={styles.reportMeta}>
							📍 {item.location || 'No location'}
						</Text>
					</View>

					{/* Status Badge */}
					<View
						style={[
							styles.statusBadge,
							{ backgroundColor: statusStyle.bg },
						]}
					>
						<Text
							style={[styles.statusText, { color: statusStyle.text }]}
						>
							{statusDisplayLabel(ns)}
						</Text>
					</View>
				</View>

				{/* Report ID + Priority footer */}
				<View style={styles.reportFooter}>
					<Text style={styles.reportId}>ID: {item.id}</Text>
					{item.priority && (
						<Text
							style={[
								styles.priorityBadge,
								priorityColor(item.priority),
							]}
						>
							{item.priority}
						</Text>
					)}
				</View>
			</TouchableOpacity>
		);
	};

	// ── Loading Screen ──
	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#8b5cf6" />
			</View>
		);
	}

	// ── Main Render ──
	return (
		<SafeAreaView style={styles.container}>
			<ScrollView
				style={styles.scrollView}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor="#8b5cf6"
					/>
				}
			>
				{/* ── Header ── */}
				<View style={styles.header}>
					<View>
						<Text style={styles.title}>
							{t('dashboard') || 'Dashboard'}
						</Text>
						<Text style={styles.subtitle}>
							{t('welcomeAdmin') || 'Welcome, Admin'}
						</Text>
					</View>
					<View style={styles.headerActions}>
						<TouchableOpacity
							style={styles.langButton}
							onPress={toggleLanguage}
						>
							<Text style={styles.langButtonText}>
								{language === 'en' ? 'اردو' : 'EN'}
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.iconBtn}
							onPress={goToSettings}
						>
							<Ionicons
								name="settings-outline"
								size={22}
								color="#94a3b8"
							/>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.iconBtn}
							onPress={handleLogout}
						>
							<Ionicons
								name="log-out-outline"
								size={22}
								color="#ef4444"
							/>
						</TouchableOpacity>
					</View>
				</View>

				{/* ── Stats Grid (2 × 2) ── */}
				<View style={styles.statsGrid}>
					<StatCard
						label={t('totalReports') || 'Total Reports'}
						value={stats.total}
						icon="document-text"
						iconColor="#8b5cf6"
						sub={`+${stats.todayCount} ${t('today') || 'today'}`}
						subColor="#8b5cf6"
					/>
					<StatCard
						label={t('pending') || 'Pending'}
						value={stats.pending}
						icon="time-outline"
						iconColor="#f59e0b"
						sub={t('needsAttention') || 'Needs attention'}
						subColor="#f59e0b"
					/>
					<StatCard
						label={t('inProgress') || 'In Progress'}
						value={stats.inProgress}
						icon="reload-circle-outline"
						iconColor="#3b82f6"
						sub=" "
						subColor="#3b82f6"
					/>
					<StatCard
						label={t('resolved') || 'Resolved'}
						value={stats.resolved}
						icon="checkmark-circle-outline"
						iconColor="#22c55e"
						sub=" "
						subColor="#22c55e"
					/>
				</View>

				{/* ── By Department ── */}
				<Text style={styles.sectionTitle}>
					{t('byDepartment') || 'By Department'}
				</Text>
				<View style={styles.deptCard}>
					{departments.length === 0 ? (
						<Text style={styles.emptyText}>
							No departments configured.
						</Text>
					) : (
						departments.slice(0, 6).map((dept) => {
							const count = deptStats[dept.name] || 0;
							const pct =
								stats.total > 0 ? (count / stats.total) * 100 : 0;
							const icon = getDeptIcon(dept.name);

							return (
								<View key={dept.id} style={styles.deptRow}>
									<View
										style={[
											styles.deptIconBg,
											{ backgroundColor: icon.color + '22' },
										]}
									>
										<Text style={{ fontSize: 18 }}>
											{icon.icon}
										</Text>
									</View>
									<View style={styles.deptInfo}>
										<View style={styles.deptHeader}>
											<Text style={styles.deptName}>
												{dept.name}
											</Text>
											<Text style={styles.deptCount}>
												{count}
											</Text>
										</View>
										<View style={styles.progressBar}>
											<View
												style={[
													styles.progressFill,
													{
														width: `${pct}%`,
														backgroundColor: icon.color,
													},
												]}
											/>
										</View>
									</View>
								</View>
							);
						})
					)}
				</View>

				{/* ── Recent Reports ── */}
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>
						{t('recentReports') || 'Recent Reports'}
					</Text>
					<TouchableOpacity
						onPress={() => router.push('/(admin)/reports')}
					>
						<Text style={styles.viewAll}>
							{t('viewAll') || 'View All'} →
						</Text>
					</TouchableOpacity>
				</View>

				<FlatList
					data={reports.slice(0, 5)}
					renderItem={renderRecentReport}
					keyExtractor={(item) => item.id?.toString()}
					scrollEnabled={false}
					contentContainerStyle={styles.reportsList}
					ListEmptyComponent={
						<Text style={styles.emptyText}>No reports yet.</Text>
					}
				/>

				<View style={styles.bottomSpacer} />
			</ScrollView>
		</SafeAreaView>
	);
}

// ── Small reusable Stat Card component ──
function StatCard({ label, value, icon, iconColor, sub, subColor }) {
	return (
		<View style={styles.statCard}>
			<View style={styles.statHeader}>
				<Text style={styles.statLabel}>{label}</Text>
				<View
					style={[
						styles.statIconBg,
						{ backgroundColor: iconColor + '1A' },
					]}
				>
					<Ionicons name={icon} size={18} color={iconColor} />
				</View>
			</View>
			<Text style={[styles.statNumber, { color: iconColor }]}>{value}</Text>
			{sub?.trim() ? (
				<Text style={[styles.statSub, { color: subColor }]}>{sub}</Text>
			) : null}
		</View>
	);
}

// ── Helpers ──
function statusDisplayLabel(ns) {
	const m = {
		pending: 'Pending',
		assigned: 'Assigned',
		inProgress: 'In Progress',
		resolved: 'Resolved',
		closed: 'Closed',
	};
	return m[ns] || ns;
}

function priorityColor(p) {
	const colors = {
		High: { backgroundColor: '#fecaca', color: '#991b1b' },
		Medium: { backgroundColor: '#fef3c7', color: '#92400e' },
		Low: { backgroundColor: '#d1fae5', color: '#065f46' },
	};
	return colors[p] || colors.Medium;
}

// ── Styles ──
const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#0f172a' },
	scrollView: { flex: 1 },
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#0f172a',
	},

	// Header
	header: {
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 20,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	title: { fontSize: 26, fontWeight: 'bold', color: '#ffffff', marginBottom: 2 },
	subtitle: { fontSize: 13, color: '#64748b' },
	headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	langButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		backgroundColor: '#1e293b',
		borderRadius: 20,
		borderWidth: 1,
		borderColor: '#334155',
	},
	langButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
	iconBtn: {
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: '#1e293b',
		borderWidth: 1,
		borderColor: '#334155',
		alignItems: 'center',
		justifyContent: 'center',
	},

	// Stats Grid
	statsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		paddingHorizontal: 16,
		gap: 12,
		marginBottom: 28,
	},
	statCard: {
		width: '48%',
		backgroundColor: '#1e293b',
		borderRadius: 16,
		padding: 16,
		borderWidth: 1,
		borderColor: '#334155',
	},
	statHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 12,
	},
	statLabel: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
	statIconBg: {
		width: 34,
		height: 34,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
	},
	statNumber: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
	statSub: { fontSize: 12, fontWeight: '500' },

	// Sections
	sectionTitle: {
		fontSize: 17,
		fontWeight: 'bold',
		color: '#ffffff',
		paddingHorizontal: 20,
		marginBottom: 12,
	},
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		marginBottom: 12,
	},
	viewAll: { fontSize: 14, color: '#8b5cf6', fontWeight: '500' },

	// Department rows
	deptCard: {
		backgroundColor: '#1e293b',
		marginHorizontal: 16,
		borderRadius: 16,
		padding: 16,
		marginBottom: 28,
		borderWidth: 1,
		borderColor: '#334155',
	},
	deptRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
	deptIconBg: {
		width: 36,
		height: 36,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	deptInfo: { flex: 1 },
	deptHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 6,
	},
	deptName: { fontSize: 14, color: '#ffffff', fontWeight: '500' },
	deptCount: { fontSize: 14, color: '#94a3b8', fontWeight: '600' },
	progressBar: {
		height: 5,
		backgroundColor: '#334155',
		borderRadius: 3,
		overflow: 'hidden',
	},
	progressFill: { height: '100%', borderRadius: 3 },

	// Report Cards
	reportsList: { paddingHorizontal: 16 },
	reportCard: {
		backgroundColor: '#1e293b',
		borderRadius: 14,
		padding: 14,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: '#334155',
	},
	reportRow: { flexDirection: 'row', alignItems: 'center' },
	reportIconBg: {
		width: 42,
		height: 42,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	reportInfo: { flex: 1, marginRight: 10 },
	reportTitle: {
		fontSize: 15,
		fontWeight: '600',
		color: '#ffffff',
		marginBottom: 3,
	},
	reportMeta: { fontSize: 12, color: '#64748b' },
	statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
	statusText: { fontSize: 11, fontWeight: '600' },
	reportFooter: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 10,
		paddingTop: 10,
		borderTopWidth: 1,
		borderTopColor: '#334155',
	},
	reportId: { fontSize: 11, color: '#475569', fontFamily: 'monospace' },
	priorityBadge: {
		fontSize: 11,
		fontWeight: '600',
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 6,
	},

	emptyText: { color: '#64748b', textAlign: 'center', padding: 16, fontSize: 14 },
	bottomSpacer: { height: 30 },
});

