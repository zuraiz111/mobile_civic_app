import React, { useState, useMemo, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	FlatList,
	ActivityIndicator,
	StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { useTheme } from '../../src/context/ThemeContext';
import { statusColors } from '../../src/data/departments';
import { getDeptIcon } from '../../src/utils/adminUtils';
import { formatDate } from '../../src/utils/dateUtils';

const filterOptions = ['all', 'Pending', 'In Progress', 'Resolved'];

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

export default function ReportsScreen() {
	const router = useRouter();
	const { getUserReports, isLoading, departments } = useApp();
	const { t } = useLanguage();
	const { theme, isDark } = useTheme();
	const [activeFilter, setActiveFilter] = useState('all');

	const userReports = getUserReports();

	const filteredReports = useMemo(() => {
		if (activeFilter === 'all') return userReports;
		return userReports.filter((r) => r.status === activeFilter);
	}, [userReports, activeFilter]);

	const handleReportPress = useCallback(
		(reportId) => {
			router.push({
				pathname: '/(user)/report-detail',
				params: { id: reportId },
			});
		},
		[router],
	);

	const renderFilterButton = useCallback(
		(filter) => {
			const isActive = activeFilter === filter;
			const label = filter === 'all' ? t('all') : t(getStatusKey(filter));

			return (
				<TouchableOpacity
					key={filter}
					style={[
						styles.filterButton,
						isActive
							? [
									styles.filterButtonActive,
									{
										backgroundColor: theme.colors.primary,
										borderColor: theme.colors.primary,
									},
								]
							: {
									backgroundColor: theme.colors.card,
									borderColor: theme.colors.border,
									borderWidth: 1,
								},
					]}
					onPress={() => setActiveFilter(filter)}
				>
					<Text
						style={[
							styles.filterText,
							isActive
								? styles.filterTextActive
								: { color: theme.colors.textSecondary },
						]}
					>
						{label}
					</Text>
				</TouchableOpacity>
			);
		},
		[activeFilter, t, theme.colors],
	);

	const renderReport = useCallback(
		({ item }) => {
			const statusKey = getStatusKey(item.status);
			const statusStyle = statusColors[item.status] || statusColors.Pending;
			const category = departments.find((c) => c.id === item.category);
			const icon = category ? getDeptIcon(category.name) : null;

			return (
				<TouchableOpacity
					style={[
						styles.reportCard,
						{
							backgroundColor: theme.colors.card,
							borderColor: theme.colors.border,
						},
					]}
					onPress={() => handleReportPress(item.id)}
					activeOpacity={0.7}
				>
					<View style={styles.reportHeader}>
						<View
							style={[
								styles.reportIconContainer,
								{ backgroundColor: theme.colors.inputBackground },
							]}
						>
							{icon ? (
								<Text style={{ fontSize: 22 }}>{icon.icon}</Text>
							) : (
								<Text style={styles.reportIcon}>📋</Text>
							)}
						</View>
						<View style={styles.reportInfo}>
							<Text
								style={[
									styles.reportTitle,
									{ color: theme.colors.text },
								]}
								numberOfLines={1}
							>
								{item.title}
							</Text>
							<View style={styles.dateRow}>
								<Ionicons
									name="calendar-outline"
									size={12}
									color={theme.colors.textSecondary}
								/>
								<Text
									style={[
										styles.reportDate,
										{ color: theme.colors.textSecondary },
									]}
								>
									{formatDate(item.createdAt)}
								</Text>
							</View>
						</View>
						<View
							style={[
								styles.statusBadge,
								{ backgroundColor: statusStyle.bg + '20' },
							]}
						>
							<View
								style={[
									styles.statusDot,
									{ backgroundColor: statusStyle.text },
								]}
							/>
							<Text
								style={[
									styles.statusText,
									{ color: statusStyle.text },
								]}
							>
								{t(statusKey)}
							</Text>
						</View>
					</View>

					<Text
						style={[
							styles.reportDescription,
							{ color: theme.colors.textSecondary },
						]}
						numberOfLines={2}
					>
						{item.description}
					</Text>

					<View
						style={[
							styles.reportFooter,
							{ borderTopColor: theme.colors.border },
						]}
					>
						<View style={styles.locationRow}>
							<Ionicons
								name="location"
								size={14}
								color={theme.colors.primary}
							/>
							<Text
								style={[
									styles.locationText,
									{ color: theme.colors.textSecondary },
								]}
								numberOfLines={1}
							>
								{item.location}
							</Text>
						</View>
						{item.photo && (
							<View
								style={[
									styles.photoBadge,
									{
										backgroundColor:
											theme.colors.inputBackground,
									},
								]}
							>
								<Ionicons
									name="image"
									size={14}
									color={theme.colors.textSecondary}
								/>
							</View>
						)}
					</View>
				</TouchableOpacity>
			);
		},
		[handleReportPress, t, theme.colors],
	);

	const renderEmptyState = useCallback(
		() => (
			<View style={styles.emptyState}>
				<View
					style={[
						styles.emptyIconContainer,
						{ backgroundColor: theme.colors.inputBackground },
					]}
				>
					<Ionicons
						name="document-text-outline"
						size={80}
						color={theme.colors.border}
					/>
				</View>
				<Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
					{t('noReportsFound')}
				</Text>
				<Text
					style={[
						styles.emptySubtitle,
						{ color: theme.colors.textSecondary },
					]}
				>
					{activeFilter === 'all'
						? t('noReportsSubmitted')
						: `${t('no')} ${t(getStatusKey(activeFilter))} ${t(
								'reportsLower',
							)}`}
				</Text>
			</View>
		),
		[activeFilter, t, theme.colors],
	);

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
			<View style={[styles.header, { backgroundColor: theme.colors.card }]}>
				<Text style={[styles.title, { color: theme.colors.text }]}>
					{t('myReports')}
				</Text>
				<Text
					style={[styles.subtitle, { color: theme.colors.textSecondary }]}
				>
					{t('trackSubmittedReports')}
				</Text>
			</View>

			<View
				style={[
					styles.filtersContainer,
					{
						backgroundColor: theme.colors.card,
						borderBottomColor: theme.colors.border,
					},
				]}
			>
				<FlatList
					horizontal
					data={filterOptions}
					renderItem={({ item }) => renderFilterButton(item)}
					keyExtractor={(item) => item}
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.filtersList}
				/>
			</View>

			<FlatList
				data={filteredReports}
				renderItem={renderReport}
				keyExtractor={(item) => item.id.toString()}
				contentContainerStyle={styles.reportsList}
				showsVerticalScrollIndicator={false}
				ListEmptyComponent={renderEmptyState}
				ItemSeparatorComponent={() => <View style={styles.separator} />}
			/>
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
	header: {
		paddingHorizontal: 24,
		paddingTop: 20,
		paddingBottom: 10,
	},
	title: {
		fontSize: 28,
		fontWeight: '800',
		letterSpacing: -0.5,
	},
	subtitle: {
		fontSize: 15,
		marginTop: 2,
	},
	filtersContainer: {
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	filtersList: {
		paddingHorizontal: 24,
		gap: 8,
	},
	filterButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		marginRight: 8,
		borderWidth: 1,
	},
	filterButtonActive: {
		borderWidth: 1,
	},
	filterText: {
		fontSize: 14,
		fontWeight: '600',
	},
	filterTextActive: {
		color: '#ffffff',
	},
	reportsList: {
		padding: 20,
		paddingBottom: 100,
	},
	reportCard: {
		borderRadius: 16,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.04,
		shadowRadius: 8,
		elevation: 2,
		borderWidth: 1,
	},
	reportHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	reportIconContainer: {
		width: 44,
		height: 44,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	reportIcon: {
		fontSize: 22,
	},
	reportInfo: {
		flex: 1,
	},
	reportTitle: {
		fontSize: 16,
		fontWeight: '700',
		marginBottom: 2,
	},
	dateRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	reportDate: {
		fontSize: 12,
		fontWeight: '500',
	},
	statusBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 12,
		gap: 6,
	},
	statusDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
	},
	statusText: {
		fontSize: 12,
		fontWeight: '700',
		textTransform: 'capitalize',
	},
	reportDescription: {
		fontSize: 14,
		lineHeight: 20,
		marginBottom: 14,
	},
	reportFooter: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingTop: 12,
		borderTopWidth: 1,
	},
	locationRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		flex: 1,
	},
	locationText: {
		fontSize: 13,
		fontWeight: '500',
	},
	photoBadge: {
		width: 28,
		height: 28,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	separator: {
		height: 16,
	},
	emptyState: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 100,
	},
	emptyIconContainer: {
		width: 140,
		height: 140,
		borderRadius: 70,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 24,
	},
	emptyTitle: {
		fontSize: 20,
		fontWeight: '700',
		marginBottom: 8,
	},
	emptySubtitle: {
		fontSize: 16,
		textAlign: 'center',
		paddingHorizontal: 40,
	},
});
