import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
	StatusBar,
	Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { useTheme } from '../../src/context/ThemeContext';
import { getStatusColor } from '../../src/data/departments';
import { getDeptIcon } from '../../src/utils/adminUtils';
import { formatDate, getRelativeTime } from '../../src/utils/dateUtils';

export default function HomeScreen() {
	const router = useRouter();
	const { getUserReports, getUserStats, isLoading, departments } = useApp();
	const { language, setLanguage, t } = useLanguage();
	const { theme, toggleTheme, isDark } = useTheme();
	const userReports = getUserReports();
	const stats = getUserStats();

	const { width } = Dimensions.get('window');
	const categoryCardWidth = (width - 48 - 24) / 3; // 48 is total padding, 24 is total gap

	const toggleLanguage = () => {
		setLanguage(language === 'en' ? 'ur' : 'en');
	};

	const capitalize = (str) => {
		if (!str) return 'Pending';
		return str.charAt(0).toUpperCase() + str.slice(1);
	};

	const getStatusKey = (status) => {
		const map = {
			Pending: 'pending',
			Assigned: 'assigned',
			'In Progress': 'inProgress',
			Resolved: 'resolved',
			Closed: 'closed',
		};
		return map[status] || status.toLowerCase();
	};

	const getCategoryKey = (cat) => {
		const map = {
			Streetlights: 'streetLights',
			Garbage: 'garbageCollection',
			Water: 'waterSupply',
			Roads: 'roadMaintenance',
			Gas: 'gasProblems',
			Electricity: 'electricity',
			Sewerage: 'sewerageIssues',
			'Animal Rescue': 'animalRescue',
			'Public Safety': 'publicSafety',
			Other: 'other',
		};
		return map[cat] || cat.toLowerCase();
	};

	const handleCategoryPress = (categoryId) => {
		router.push({
			pathname: '/(user)/create',
			params: { category: categoryId },
		});
	};

	const handleReportPress = (reportId) => {
		router.push({
			pathname: '/(user)/report-detail',
			params: { id: reportId },
		});
	};

	const renderRecentReport = ({ item }) => {
		const capitalizedStatus = capitalize(item.status);
		const statusStyle = getStatusColor(item.status, isDark);
		const category = departments.find((c) => c.id === item.category);
		const icon = category ? getDeptIcon(category.name) : null;

		return (
			<TouchableOpacity
				key={item.id}
				style={[styles.reportCard, { backgroundColor: theme.colors.card }]}
				onPress={() => handleReportPress(item.id)}
				activeOpacity={0.7}
			>
				<View style={styles.reportHeader}>
					<View style={styles.reportTitleRow}>
						<View
							style={[
								styles.reportIconCircle,
								{ backgroundColor: theme.colors.inputBackground },
							]}
						>
							{icon ? (
								<Text style={{ fontSize: 20 }}>{icon.icon}</Text>
							) : (
								<Text style={styles.reportIcon}>📋</Text>
							)}
						</View>
						<View style={{ flex: 1 }}>
							<Text
								style={[
									styles.reportTitle,
									{ color: theme.colors.text },
								]}
								numberOfLines={1}
							>
								{item.title}
							</Text>
							<View style={styles.locationRow}>
								<Ionicons
									name="location-outline"
									size={12}
									color={theme.colors.textSecondary}
								/>
								<Text
									style={[
										styles.reportLocation,
										{ color: theme.colors.textSecondary },
									]}
									numberOfLines={1}
								>
									{item.location}
								</Text>
							</View>
						</View>
					</View>
					<View
						style={[
							styles.statusBadge,
							{ backgroundColor: statusStyle.bg + '20' },
						]}
					>
						<Text
							style={[styles.statusText, { color: statusStyle.text }]}
						>
							{t(getStatusKey(capitalizedStatus))}
						</Text>
					</View>
				</View>
			</TouchableOpacity>
		);
	};

	if (isLoading) {
		return (
			<View
				style={[
					styles.loadingContainer,
					{ backgroundColor: theme.colors.background },
				]}
			>
				<ActivityIndicator size="large" color={theme.colors.primary} />
			</View>
		);
	}

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.colors.background }]}
		>
			<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
			<ScrollView
				style={styles.scrollView}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.scrollContent}
			>
				<View style={styles.header}>
					<View>
						<Text
							style={[styles.greeting, { color: theme.colors.text }]}
						>
							{t('welcomeBack')}
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
					<View style={{ flexDirection: 'row', gap: 8 }}>
						<TouchableOpacity
							style={[
								styles.langButton,
								{
									backgroundColor: theme.colors.card,
									borderColor: theme.colors.border,
								},
							]}
							onPress={toggleTheme}
						>
							<Ionicons
								name={isDark ? 'moon' : 'sunny'}
								size={18}
								color={theme.colors.primary}
							/>
						</TouchableOpacity>
						<TouchableOpacity
							style={[
								styles.langButton,
								{
									backgroundColor: theme.colors.card,
									borderColor: theme.colors.border,
								},
							]}
							onPress={toggleLanguage}
						>
							<Ionicons
								name="language"
								size={16}
								color={theme.colors.primary}
								style={{ marginRight: 4 }}
							/>
							<Text
								style={[
									styles.langButtonText,
									{ color: theme.colors.primary },
								]}
							>
								{language === 'en' ? 'اردو' : 'EN'}
							</Text>
						</TouchableOpacity>
					</View>
				</View>

				<View style={styles.statsRow}>
					<View style={[styles.statCard, { backgroundColor: '#3b82f6' }]}>
						<View style={styles.statIconContainer}>
							<Ionicons
								name="document-text"
								size={20}
								color="rgba(255,255,255,0.3)"
							/>
						</View>
						<Text style={styles.statNumber}>{stats.total}</Text>
						<Text style={styles.statLabel}>{t('myReports')}</Text>
					</View>
					<View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
						<View style={styles.statIconContainer}>
							<Ionicons
								name="time"
								size={20}
								color="rgba(255,255,255,0.3)"
							/>
						</View>
						<Text style={styles.statNumber}>{stats.pending}</Text>
						<Text style={styles.statLabel}>{t('pending')}</Text>
					</View>
				</View>

				<TouchableOpacity
					style={[
						styles.reportButton,
						{ backgroundColor: theme.colors.primary },
					]}
					onPress={() => router.push('/(user)/create')}
					activeOpacity={0.9}
				>
					<View style={styles.reportButtonContent}>
						<View style={styles.reportButtonIconContainer}>
							<Ionicons name="add-circle" size={24} color="white" />
						</View>
						<Text style={styles.reportButtonText}>
							{t('reportNewIssue')}
						</Text>
					</View>
					<Ionicons
						name="chevron-forward"
						size={20}
						color="rgba(255,255,255,0.6)"
					/>
				</TouchableOpacity>

				<View style={styles.sectionHeader}>
					<Text
						style={[styles.sectionTitle, { color: theme.colors.text }]}
					>
						{t('quickCategories')}
					</Text>
				</View>
				<View style={styles.categoriesGrid}>
					{departments
						.filter((d) => d.isActive !== false)
						.slice(0, 6)
						.map((category) => {
							const icon = getDeptIcon(category.name);
							return (
								<TouchableOpacity
									key={category.id}
									style={[
										styles.categoryCard,
										{
											backgroundColor: theme.colors.card,
											borderColor: theme.colors.border,
											width: categoryCardWidth,
										},
									]}
									onPress={() => handleCategoryPress(category.id)}
									activeOpacity={0.7}
								>
									<View
										style={[
											styles.categoryIconContainer,
											{
												backgroundColor:
													theme.colors.inputBackground,
											},
										]}
									>
										<Text style={{ fontSize: 24 }}>
											{icon.icon}
										</Text>
									</View>
									<Text
										style={[
											styles.categoryLabel,
											{ color: theme.colors.textSecondary },
										]}
										numberOfLines={1}
									>
										{category.name}
									</Text>
								</TouchableOpacity>
							);
						})}
				</View>

				<View style={styles.sectionHeader}>
					<Text
						style={[styles.sectionTitle, { color: theme.colors.text }]}
					>
						{t('recentActivity')}
					</Text>
					{userReports.length > 0 && (
						<TouchableOpacity
							onPress={() => router.push('/(user)/reports')}
						>
							<Text
								style={[
									styles.viewAllText,
									{ color: theme.colors.primary },
								]}
							>
								{t('viewAll') || 'View All'}
							</Text>
						</TouchableOpacity>
					)}
				</View>

				{userReports.length > 0 ? (
					<View
						style={[
							styles.recentReportsContainer,
							{
								backgroundColor: theme.colors.card,
								borderColor: theme.colors.border,
							},
						]}
					>
						{userReports.slice(0, 3).map((report, index) => (
							<View key={report.id}>
								{renderRecentReport({ item: report })}
								{index < 2 && (
									<View
										style={[
											styles.reportSeparator,
											{
												backgroundColor:
													theme.colors.border,
											},
										]}
									/>
								)}
							</View>
						))}
					</View>
				) : (
					<View
						style={[
							styles.emptyState,
							{
								backgroundColor: theme.colors.card,
								borderColor: theme.colors.border,
							},
						]}
					>
						<View
							style={[
								styles.emptyIconContainer,
								{ backgroundColor: theme.colors.inputBackground },
							]}
						>
							<Ionicons
								name="document-text-outline"
								size={48}
								color={theme.colors.textSecondary}
							/>
						</View>
						<Text
							style={[styles.emptyText, { color: theme.colors.text }]}
						>
							{t('noReportsYet')}
						</Text>
						<Text
							style={[
								styles.emptySubtext,
								{ color: theme.colors.textSecondary },
							]}
						>
							{t('startReporting')}
						</Text>
					</View>
				)}

				<View style={styles.bottomSpacer} />
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 24,
		paddingTop: 20,
	},
	header: {
		marginBottom: 24,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
	},
	langButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 12,
		borderWidth: 1,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 2,
	},
	langButtonText: {
		fontSize: 13,
		fontWeight: '700',
	},
	greeting: {
		fontSize: 28,
		fontWeight: '800',
		letterSpacing: -0.5,
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 16,
		fontWeight: '500',
	},
	statsRow: {
		flexDirection: 'row',
		gap: 16,
		marginBottom: 24,
	},
	statCard: {
		flex: 1,
		padding: 20,
		borderRadius: 24,
		position: 'relative',
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	statIconContainer: {
		position: 'absolute',
		right: -10,
		top: -10,
	},
	statNumber: {
		fontSize: 32,
		fontWeight: '800',
		color: '#ffffff',
		marginBottom: 2,
	},
	statLabel: {
		fontSize: 13,
		color: 'rgba(255,255,255,0.8)',
		fontWeight: '600',
	},
	reportButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 18,
		borderRadius: 20,
		marginBottom: 32,
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.25,
		shadowRadius: 12,
		elevation: 8,
	},
	reportButtonContent: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	reportButtonIconContainer: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: 'rgba(255,255,255,0.2)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	reportButtonText: {
		fontSize: 17,
		fontWeight: '700',
		color: '#ffffff',
	},
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: '800',
		letterSpacing: -0.3,
	},
	viewAllText: {
		fontSize: 14,
		fontWeight: '700',
	},
	categoriesGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 12,
		marginBottom: 32,
	},
	categoryCard: {
		aspectRatio: 1,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 12,
		borderWidth: 1,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.03,
		shadowRadius: 4,
		elevation: 2,
	},
	categoryIconContainer: {
		width: 44,
		height: 44,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 8,
	},
	categoryIcon: {
		fontSize: 22,
	},
	categoryLabel: {
		fontSize: 12,
		fontWeight: '700',
		textAlign: 'center',
	},
	recentReportsContainer: {
		borderRadius: 24,
		padding: 16,
		borderWidth: 1,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.03,
		shadowRadius: 4,
		elevation: 2,
	},
	reportCard: {
		paddingVertical: 12,
	},
	reportHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	reportTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		flex: 1,
	},
	reportIconCircle: {
		width: 40,
		height: 40,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	reportIcon: {
		fontSize: 20,
	},
	reportTitle: {
		fontSize: 15,
		fontWeight: '700',
		marginBottom: 2,
	},
	locationRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	reportLocation: {
		fontSize: 12,
		fontWeight: '500',
	},
	statusBadge: {
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 10,
	},
	statusText: {
		fontSize: 11,
		fontWeight: '800',
		textTransform: 'uppercase',
	},
	reportSeparator: {
		height: 1,
		marginVertical: 4,
	},
	emptyState: {
		borderRadius: 24,
		padding: 32,
		alignItems: 'center',
		borderWidth: 1,
		borderStyle: 'dashed',
	},
	emptyIconContainer: {
		width: 80,
		height: 80,
		borderRadius: 40,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16,
	},
	emptyText: {
		fontSize: 16,
		fontWeight: '700',
		marginBottom: 4,
	},
	emptySubtext: {
		fontSize: 14,
		fontWeight: '500',
	},
	bottomSpacer: {
		height: 40,
	},
});
