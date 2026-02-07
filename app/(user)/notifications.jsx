import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	ActivityIndicator,
	StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/context/LanguageContext';
import { useApp } from '../../src/context/AppContext';
import { useTheme } from '../../src/context/ThemeContext';
import { getRelativeTime } from '../../src/utils/dateUtils';

export default function NotificationsScreen() {
	const { t } = useLanguage();
	const {
		notifications,
		markNotificationAsRead,
		markAllNotificationsAsRead,
		isLoading,
		currentUser,
	} = useApp();
	const { theme, isDark } = useTheme();

	const userNotifications = React.useMemo(() => {
		const userId = currentUser?.uid;
		const phoneId = currentUser?.phone || currentUser?.id;
		return notifications.filter(
			(n) => n.userId === userId || n.userId === phoneId,
		);
	}, [notifications, currentUser]);

	const formatTime = (isoString) => {
		const date = new Date(isoString);
		const now = new Date();
		const diffInMs = now - date;
		const diffInMins = Math.floor(diffInMs / (1000 * 60));
		const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
		const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

		if (diffInMins < 1) return t('justNow');
		if (diffInMins < 60) return t('minutesAgo', { count: diffInMins });
		if (diffInHours < 24) return t('hoursAgo', { count: diffInHours });
		return t('daysAgo', { count: diffInDays });
	};

	const getNotificationColor = (type) => {
		switch (type) {
			case 'success':
				return '#22c55e';
			case 'info':
				return '#3b82f6';
			case 'warning':
				return '#f59e0b';
			case 'error':
				return '#ef4444';
			default:
				return theme.colors.textSecondary;
		}
	};

	const getNotificationIcon = (type) => {
		switch (type) {
			case 'success':
				return 'checkmark-circle';
			case 'info':
				return 'information-circle';
			case 'warning':
				return 'alert-circle';
			case 'error':
				return 'close-circle';
			default:
				return 'notifications';
		}
	};

	const getNotificationMessage = (item) => {
		if (item.statusKey) {
			return t(item.messageKey, { status: t(item.statusKey) });
		}
		if (item.departmentKey) {
			return t(item.messageKey, { department: t(item.departmentKey) });
		}
		return t(item.messageKey);
	};

	const renderNotification = ({ item }) => {
		const color = getNotificationColor(item.type);
		const iconName = getNotificationIcon(item.type);
		const isEmoji =
			item.icon &&
			/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/.test(
				item.icon,
			);

		return (
			<TouchableOpacity
				style={[
					styles.notificationCard,
					{ backgroundColor: theme.colors.card },
					!item.read && [
						styles.unreadCard,
						{ borderLeftColor: theme.colors.primary },
					],
				]}
				activeOpacity={0.7}
				onPress={() => markNotificationAsRead(item.id)}
			>
				<View
					style={[
						styles.iconContainer,
						{ backgroundColor: color + '15' },
					]}
				>
					{isEmoji ? (
						<Text style={{ fontSize: 24 }}>{item.icon}</Text>
					) : (
						<Ionicons name={iconName} size={24} color={color} />
					)}
				</View>
				<View style={styles.notificationContent}>
					<View style={styles.notificationHeader}>
						<Text
							style={[
								styles.notificationTitle,
								{ color: theme.colors.text },
								!item.read && styles.unreadTitle,
							]}
						>
							{t(item.titleKey) || item.titleKey}
						</Text>
						{!item.read && (
							<View
								style={[
									styles.unreadDot,
									{ backgroundColor: theme.colors.primary },
								]}
							/>
						)}
					</View>
					<Text
						style={[
							styles.notificationMessage,
							{ color: theme.colors.textSecondary },
						]}
						numberOfLines={3}
					>
						{getNotificationMessage(item)}
					</Text>
					<View style={styles.footerRow}>
						<View style={styles.timeContainer}>
							<Ionicons
								name="time-outline"
								size={12}
								color={theme.colors.textSecondary}
							/>
							<Text
								style={[
									styles.notificationTime,
									{ color: theme.colors.textSecondary },
								]}
							>
								{getRelativeTime(item.time)}
							</Text>
						</View>
						{item.type && (
							<View
								style={[
									styles.typeBadge,
									{ backgroundColor: color + '20' },
								]}
							>
								<Text
									style={[
										styles.typeText,
										{
											color: color,
											textTransform: 'capitalize',
										},
									]}
								>
									{item.type}
								</Text>
							</View>
						)}
					</View>
				</View>
			</TouchableOpacity>
		);
	};

	const renderEmptyState = () => (
		<View style={styles.emptyState}>
			<View
				style={[
					styles.emptyIconContainer,
					{ backgroundColor: theme.colors.inputBackground },
				]}
			>
				<Ionicons
					name="notifications-off-outline"
					size={80}
					color={theme.colors.border}
				/>
			</View>
			<Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
				{t('noNotifications')}
			</Text>
			<Text
				style={[
					styles.emptySubtitle,
					{ color: theme.colors.textSecondary },
				]}
			>
				{t('allCaughtUp')}
			</Text>
		</View>
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
			<View
				style={[
					styles.header,
					{
						backgroundColor: theme.colors.card,
						borderBottomColor: theme.colors.border,
					},
				]}
			>
				<View>
					<Text style={[styles.title, { color: theme.colors.text }]}>
						{t('notifications')}
					</Text>
					<Text
						style={[
							styles.subtitle,
							{ color: theme.colors.textSecondary },
						]}
					>
						{notifications.filter((n) => !n.read).length} {t('unread')}
					</Text>
				</View>
				<TouchableOpacity
					style={[
						styles.markAllReadBtn,
						{ backgroundColor: theme.colors.primary + '15' },
					]}
					onPress={markAllNotificationsAsRead}
				>
					<Ionicons
						name="checkmark-done"
						size={18}
						color={theme.colors.primary}
					/>
					<Text
						style={[
							styles.markAllReadText,
							{ color: theme.colors.primary },
						]}
					>
						{t('markAllRead')}
					</Text>
				</TouchableOpacity>
			</View>

			<FlatList
				data={userNotifications}
				renderItem={renderNotification}
				keyExtractor={(item) => item.id.toString()}
				contentContainerStyle={styles.notificationsList}
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
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-end',
		paddingHorizontal: 24,
		paddingVertical: 20,
		borderBottomWidth: 1,
	},
	title: {
		fontSize: 28,
		fontWeight: '800',
		letterSpacing: -0.5,
	},
	subtitle: {
		fontSize: 14,
		marginTop: 2,
	},
	markAllReadBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 20,
		gap: 6,
	},
	markAllReadText: {
		fontSize: 13,
		fontWeight: '700',
	},
	notificationsList: {
		padding: 20,
		paddingBottom: 100,
	},
	notificationCard: {
		flexDirection: 'row',
		borderRadius: 16,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.04,
		shadowRadius: 8,
		elevation: 2,
	},
	unreadCard: {
		borderLeftWidth: 4,
		shadowOpacity: 0.08,
		elevation: 4,
	},
	iconContainer: {
		width: 48,
		height: 48,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 16,
	},
	notificationContent: {
		flex: 1,
	},
	notificationHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 4,
	},
	notificationTitle: {
		fontSize: 16,
		fontWeight: '600',
		flex: 1,
	},
	unreadTitle: {
		fontWeight: '700',
	},
	unreadDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		marginLeft: 8,
	},
	notificationMessage: {
		fontSize: 14,
		lineHeight: 20,
		marginBottom: 10,
	},
	footerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: 8,
	},
	timeContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	notificationTime: {
		fontSize: 12,
	},
	typeBadge: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 10,
	},
	typeText: {
		fontSize: 10,
		fontWeight: '700',
	},
	separator: {
		height: 12,
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
