import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	FlatList,
	ActivityIndicator,
	TextInput,
	RefreshControl,
	Alert,
	Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
	getAllReports,
	getReportById,
	getDepartments,
} from '../../src/services/adminService';
import {
	normalizeStatus,
	getStatusStyle,
	getDeptIcon,
	formatDate,
} from '../../src/utils/adminUtils';

const STATUS_FILTERS = ['all', 'pending', 'assigned', 'inProgress', 'resolved'];

// Pretty labels for filter pills
const FILTER_LABELS = {
	all: 'All',
	pending: 'Pending',
	assigned: 'Assigned',
	inProgress: 'In Progress',
	resolved: 'Resolved',
};

export default function AdminReportsScreen() {
	const router = useRouter();

	const [reports, setReports] = useState([]);
	const [departments, setDepartments] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	// Search
	const [searchId, setSearchId] = useState('');

	// Filters
	const [statusFilter, setStatusFilter] = useState('all');
	const [deptFilter, setDeptFilter] = useState('all'); // 'all' or a dept name string
	const [showDeptPicker, setShowDeptPicker] = useState(false);

	// ── Load ──
	const loadData = useCallback(async () => {
		try {
			const [reportsData, deptsData] = await Promise.all([
				getAllReports(),
				getDepartments(),
			]);
			setReports(reportsData);
			setDepartments(deptsData);
		} catch (e) {
			console.error('Reports load error:', e);
			Alert.alert('Error', 'Failed to load reports.');
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
		setSearchId('');
		loadData();
	}, [loadData]);

	// ── Search by Report ID ──
	const handleSearch = async () => {
		const trimmed = searchId.trim();
		if (!trimmed) {
			loadData();
			return;
		}

		setIsLoading(true);
		try {
			const report = await getReportById(trimmed);
			if (report) {
				setReports([report]);
			} else {
				setReports([]);
				Alert.alert('Not Found', 'No report found with this ID.');
			}
		} catch (e) {
			console.error('Search error:', e);
			Alert.alert('Error', 'Failed to search.');
		} finally {
			setIsLoading(false);
		}
	};

	const clearSearch = () => {
		setSearchId('');
		loadData();
	};

	// ── Filtering (client-side, applied after load/search) ──
	const filteredReports = useMemo(() => {
		let result = [...reports];

		if (statusFilter !== 'all') {
			result = result.filter(
				(r) => normalizeStatus(r.status) === statusFilter,
			);
		}
		if (deptFilter !== 'all') {
			// Reports store department as r.category (a name string like "Electricity")
			result = result.filter((r) => r.category === deptFilter);
		}
		return result;
	}, [reports, statusFilter, deptFilter]);

	// ── Render helpers ──
	const renderFilterPill = (filter) => {
		const active = statusFilter === filter;
		return (
			<TouchableOpacity
				key={filter}
				style={[styles.pill, active && styles.pillActive]}
				onPress={() => setStatusFilter(filter)}
			>
				<Text style={[styles.pillText, active && styles.pillTextActive]}>
					{FILTER_LABELS[filter]}
				</Text>
			</TouchableOpacity>
		);
	};

	const renderReport = ({ item }) => {
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
				{/* Top row: icon + info + status badge */}
				<View style={styles.reportHeader}>
					<View
						style={[
							styles.reportIconBg,
							{ backgroundColor: deptIcon.color + '22' },
						]}
					>
						<Text style={{ fontSize: 22 }}>{deptIcon.icon}</Text>
					</View>

					<View style={styles.reportInfo}>
						<Text style={styles.reportTitle} numberOfLines={1}>
							{item.title}
						</Text>
						<Text style={styles.reportId}>ID: {item.id}</Text>
						<Text style={styles.reportDate}>
							{formatDate(item.createdAt)}
						</Text>
					</View>

					<View
						style={[
							styles.statusBadge,
							{ backgroundColor: statusStyle.bg },
						]}
					>
						<Text
							style={[styles.statusText, { color: statusStyle.text }]}
						>
							{FILTER_LABELS[ns] || ns}
						</Text>
					</View>
				</View>

				{/* Bottom row: location + assignment info */}
				<View style={styles.reportFooter}>
					<Text style={styles.reportLocation} numberOfLines={1}>
						📍 {item.location || 'No location'}
					</Text>
					<Text style={styles.reportAssigned}>
						{item.assignedTo
							? '👤 Assigned'
							: item.category || 'Unassigned'}
					</Text>
				</View>
			</TouchableOpacity>
		);
	};

	// ── Loading full screen ──
	if (isLoading && !refreshing) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#8b5cf6" />
			</View>
		);
	}

	// ──────────────────────────────────────────
	return (
		<SafeAreaView style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.title}>All Reports</Text>
				<Text style={styles.subtitle}>Manage & assign citizen reports</Text>
			</View>

			{/* Search Bar */}
			<View style={styles.searchRow}>
				<View style={styles.searchInputWrap}>
					<Ionicons
						name="search"
						size={18}
						color="#64748b"
						style={styles.searchIcon}
					/>
					<TextInput
						style={styles.searchInput}
						placeholder="Search by Report ID…"
						placeholderTextColor="#64748b"
						value={searchId}
						onChangeText={setSearchId}
						onSubmitEditing={handleSearch}
						returnKeyType="search"
					/>
					{searchId.length > 0 && (
						<TouchableOpacity onPress={clearSearch}>
							<Ionicons name="close" size={18} color="#64748b" />
						</TouchableOpacity>
					)}
				</View>
				<TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
					<Ionicons name="search" size={18} color="#fff" />
				</TouchableOpacity>
			</View>

			{/* Status Filter Pills */}
			<View style={styles.pillsWrap}>
				<FlatList
					horizontal
					data={STATUS_FILTERS}
					renderItem={({ item }) => renderFilterPill(item)}
					keyExtractor={(item) => item}
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.pillsList}
				/>
			</View>

			{/* Department Filter Dropdown */}
			<TouchableOpacity
				style={styles.deptFilterBar}
				onPress={() => setShowDeptPicker(!showDeptPicker)}
			>
				<Ionicons
					name="business-outline"
					size={16}
					color="#64748b"
					style={{ marginRight: 8 }}
				/>
				<Text style={styles.deptFilterText}>
					{deptFilter === 'all' ? 'All Departments' : deptFilter}
				</Text>
				<Ionicons
					name={showDeptPicker ? 'chevron-up' : 'chevron-down'}
					size={16}
					color="#64748b"
				/>
			</TouchableOpacity>

			{/* Inline dept picker dropdown */}
			{showDeptPicker && (
				<View style={styles.deptDropdown}>
					<TouchableOpacity
						style={[
							styles.deptDropdownItem,
							deptFilter === 'all' && styles.deptDropdownItemActive,
						]}
						onPress={() => {
							setDeptFilter('all');
							setShowDeptPicker(false);
						}}
					>
						<Text
							style={[
								styles.deptDropdownText,
								deptFilter === 'all' &&
									styles.deptDropdownTextActive,
							]}
						>
							All Departments
						</Text>
					</TouchableOpacity>
					{departments.map((d) => {
						const active = deptFilter === d.name;
						const icon = getDeptIcon(d.name);
						return (
							<TouchableOpacity
								key={d.id}
								style={[
									styles.deptDropdownItem,
									active && styles.deptDropdownItemActive,
								]}
								onPress={() => {
									setDeptFilter(d.name);
									setShowDeptPicker(false);
								}}
							>
								<Text style={{ fontSize: 16 }}>{icon.icon}</Text>
								<Text
									style={[
										styles.deptDropdownText,
										active && styles.deptDropdownTextActive,
									]}
								>
									{d.name}
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>
			)}
			<FlatList
				data={filteredReports}
				renderItem={renderReport}
				keyExtractor={(item) => item.id?.toString()}
				contentContainerStyle={styles.reportsList}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor="#8b5cf6"
					/>
				}
				ListEmptyComponent={
					<View style={styles.emptyState}>
						<Ionicons
							name="document-text-outline"
							size={52}
							color="#334155"
						/>
						<Text style={styles.emptyText}>
							No reports match your filters.
						</Text>
					</View>
				}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#0f172a' },
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#0f172a',
	},

	// Header
	header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
	title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
	subtitle: { fontSize: 13, color: '#64748b' },

	// Search
	searchRow: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		marginBottom: 12,
		gap: 8,
	},
	searchInputWrap: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#1e293b',
		borderRadius: 12,
		paddingHorizontal: 12,
		borderWidth: 1,
		borderColor: '#334155',
	},
	searchIcon: { marginRight: 8 },
	searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#fff' },
	searchBtn: {
		width: 46,
		backgroundColor: '#8b5cf6',
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},

	// Status pills
	pillsWrap: { maxHeight: 46, marginBottom: 8 },
	pillsList: { paddingHorizontal: 16, gap: 8 },
	pill: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		backgroundColor: '#1e293b',
		borderWidth: 1,
		borderColor: '#334155',
	},
	pillActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
	pillText: { color: '#94a3b8', fontWeight: '500', fontSize: 13 },
	pillTextActive: { color: '#fff' },

	// Dept filter
	deptFilterBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginHorizontal: 16,
		marginBottom: 4,
		paddingHorizontal: 14,
		paddingVertical: 10,
		backgroundColor: '#1e293b',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#334155',
	},
	deptFilterText: { color: '#fff', fontSize: 14, fontWeight: '500', flex: 1 },
	deptDropdown: {
		marginHorizontal: 16,
		marginBottom: 8,
		backgroundColor: '#1e293b',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#334155',
		overflow: 'hidden',
	},
	deptDropdownItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#334155',
	},
	deptDropdownItemActive: { backgroundColor: '#334155' },
	deptDropdownText: { color: '#94a3b8', fontSize: 14, marginLeft: 10 },
	deptDropdownTextActive: { color: '#fff', fontWeight: '600' },

	// Report cards
	reportsList: { paddingHorizontal: 16, paddingBottom: 24 },
	reportCard: {
		backgroundColor: '#1e293b',
		borderRadius: 14,
		padding: 14,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: '#334155',
	},
	reportHeader: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginBottom: 10,
	},
	reportIconBg: {
		width: 44,
		height: 44,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	reportInfo: { flex: 1, marginRight: 10 },
	reportTitle: {
		fontSize: 15,
		fontWeight: '600',
		color: '#fff',
		marginBottom: 3,
	},
	reportId: {
		fontSize: 11,
		color: '#475569',
		fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
		marginBottom: 2,
	},
	reportDate: { fontSize: 11, color: '#64748b' },
	statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
	statusText: { fontSize: 11, fontWeight: '600' },
	reportFooter: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		borderTopWidth: 1,
		borderTopColor: '#334155',
		paddingTop: 10,
	},
	reportLocation: { fontSize: 12, color: '#94a3b8', flex: 1 },
	reportAssigned: { fontSize: 12, color: '#8b5cf6', fontWeight: '500' },

	// Empty
	emptyState: { alignItems: 'center', paddingTop: 56 },
	emptyText: { fontSize: 15, color: '#64748b', marginTop: 12 },
});

