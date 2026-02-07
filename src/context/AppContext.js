import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from './LanguageContext';
import {
	createReport as createReportService,
	getUserReportsFromFirestore,
} from '../services/reportService';
import {
	getUserNotificationsFromFirestore,
	addNotificationToFirestore,
	markNotificationAsReadInFirestore,
	markAllNotificationsAsReadInFirestore,
} from '../services/notificationService';
import { verifyAdminRole, getDepartments } from '../services/adminService';

const AppContext = createContext();

const CURRENT_USER_STORAGE_KEY = '@current_user';

export const useApp = () => {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error('useApp must be used within an AppProvider');
	}
	return context;
};

export const AppProvider = ({ children }) => {
	const { t } = useLanguage();
	const [reports, setReports] = useState([]);
	const [departments, setDepartments] = useState([]);
	const [notifications, setNotifications] = useState([]);
	const [currentUser, setCurrentUser] = useState(null);
	const [isAdmin, setIsAdmin] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	// Helper to refresh data from Firestore
	const refreshUserData = useCallback(async (user) => {
		if (!user) return;
		const uId = user.uid;
		const phoneId = user.id || user.phone;

		try {
			// Check admin role
			if (uId) {
				const isAdminRole = await verifyAdminRole(uId);
				setIsAdmin(isAdminRole);
			}

			// Fetch reports and notifications
			const [reportsByUid, reportsByPhone] = await Promise.all([
				uId ? getUserReportsFromFirestore(uId) : Promise.resolve([]),
				phoneId && phoneId !== uId
					? getUserReportsFromFirestore(phoneId)
					: Promise.resolve([]),
			]);

			const [notifsByUid, notifsByPhone] = await Promise.all([
				uId ? getUserNotificationsFromFirestore(uId) : Promise.resolve([]),
				phoneId && phoneId !== uId
					? getUserNotificationsFromFirestore(phoneId)
					: Promise.resolve([]),
			]);

			// Merge and unique-ify reports
			const reportMap = new Map();
			reportsByUid.forEach((r) => {
				if (r && r.id) reportMap.set(r.id, r);
			});
			reportsByPhone.forEach((r) => {
				if (r && r.id) reportMap.set(r.id, r);
			});
			const sortedReports = Array.from(reportMap.values()).sort(
				(a, b) => new Date(b.createdAt) - new Date(a.createdAt),
			);
			setReports(sortedReports);

			// Merge and unique-ify notifications
			const notifMap = new Map();
			notifsByUid.forEach((n) => {
				if (n && n.id) notifMap.set(n.id, n);
			});
			notifsByPhone.forEach((n) => {
				if (n && n.id) notifMap.set(n.id, n);
			});
			const sortedNotifs = Array.from(notifMap.values()).sort(
				(a, b) => new Date(b.time) - new Date(a.time),
			);
			setNotifications(sortedNotifs);
		} catch (error) {
			console.error('Error refreshing user data:', error);
		}
	}, []);

	// Load stored user on mount
	useEffect(() => {
		const initApp = async () => {
			try {
				const storedUser = await AsyncStorage.getItem(
					CURRENT_USER_STORAGE_KEY,
				);
				if (storedUser) {
					const user = JSON.parse(storedUser);
					setCurrentUser(user);
					await refreshUserData(user);
				}

				// Always fetch departments
				const fetchedDepts = await getDepartments();
				setDepartments(fetchedDepts);
			} catch (error) {
				console.error('Error initializing app:', error);
			} finally {
				setIsLoading(false);
			}
		};

		initApp();
	}, [refreshUserData]);

	// Save current user whenever it changes
	useEffect(() => {
		const saveUser = async () => {
			try {
				if (currentUser) {
					await AsyncStorage.setItem(
						CURRENT_USER_STORAGE_KEY,
						JSON.stringify(currentUser),
					);
				} else {
					await AsyncStorage.removeItem(CURRENT_USER_STORAGE_KEY);
				}
			} catch (error) {
				console.error('Error saving user:', error);
			}
		};
		if (!isLoading) saveUser();
	}, [currentUser, isLoading]);

	// Get reports for current user
	const getUserReports = useCallback(() => {
		return reports;
	}, [reports]);

	// Stats based on current reports
	const getUserStats = useCallback(() => {
		return {
			total: reports.length,
			pending: reports.filter((r) => {
				const s = r.status?.toLowerCase();
				return s === 'pending' || s === 'assigned';
			}).length,
			resolved: reports.filter((r) => r.status?.toLowerCase() === 'resolved')
				.length,
		};
	}, [reports]);

	// Get single report
	const getReport = useCallback(
		(id) => {
			if (!id) return null;
			const idStr = String(id);
			return reports.find((r) => String(r.id) === idStr);
		},
		[reports],
	);

	const login = async (userData) => {
		setIsLoading(true);
		try {
			setCurrentUser(userData);
			await refreshUserData(userData);
		} finally {
			setIsLoading(false);
		}
	};

	const logout = useCallback(async () => {
		setCurrentUser(null);
		setIsAdmin(false);
		setReports([]);
		setNotifications([]);
		await AsyncStorage.removeItem(CURRENT_USER_STORAGE_KEY);
	}, []);

	// Helper to map status to translation key
	const getStatusKey = (status) => {
		const map = {
			Pending: 'pending',
			Assigned: 'assigned',
			'In Progress': 'inProgress',
			Resolved: 'resolved',
			Closed: 'closed',
		};
		return map[status] || status?.toLowerCase() || 'pending';
	};

	// Helper to map category/department to translation key
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
		};
		return map[cat] || cat?.toLowerCase() || 'other';
	};

	// Add notification
	const addNotification = useCallback(
		async (notification) => {
			const userId =
				currentUser?.uid || currentUser?.id || currentUser?.phone;
			if (!userId) return;

			const type = notification.type || 'info';
			const icon = notification.icon || (type === 'success' ? '✅' : '🔔');

			const newNotification = {
				id: Date.now().toString(),
				time: new Date().toISOString(),
				read: false,
				userId,
				type,
				icon,
				...notification,
			};

			setNotifications((prev) => [newNotification, ...prev]);

			try {
				await addNotificationToFirestore({
					...notification,
					type,
					icon,
					userId,
				});
			} catch (error) {
				console.error('Error syncing notification:', error);
			}
		},
		[currentUser],
	);

	// Mark notification as read
	const markNotificationAsRead = useCallback(async (id) => {
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
		);

		if (typeof id === 'string' && id.length > 15) {
			try {
				await markNotificationAsReadInFirestore(id);
			} catch (error) {
				console.error('Error marking notification read:', error);
			}
		}
	}, []);

	// Mark all notifications as read
	const markAllNotificationsAsRead = useCallback(async () => {
		const userId = currentUser?.uid || currentUser?.id || currentUser?.phone;
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

		if (userId) {
			try {
				await markAllNotificationsAsReadInFirestore(userId);
			} catch (error) {
				console.error('Error marking all notifications read:', error);
			}
		}
	}, [currentUser]);

	const addReport = useCallback(
		async (reportData) => {
			try {
				const firestoreId = await createReportService(reportData);
				const newReport = {
					id: firestoreId,
					...reportData,
					createdAt: new Date().toISOString(),
					status: 'pending',
					timeline: [
						{
							status: 'pending',
							date: new Date().toISOString(),
							note: t('submittedBy'),
						},
					],
				};

				setReports((prev) => [newReport, ...prev]);

				addNotification({
					titleKey: 'reportSubmitted',
					messageKey: 'reportSubmittedMsg',
					type: 'success',
					icon: '✅',
				});

				return firestoreId;
			} catch (error) {
				console.error('Error adding report:', error);
				throw error;
			}
		},
		[addNotification, t],
	);

	return (
		<AppContext.Provider
			value={{
				reports,
				departments,
				notifications,
				currentUser,
				isAdmin,
				setIsAdmin,
				isLoading,
				getUserReports,
				getUserStats,
				getReport,
				getStatusKey,
				getCategoryKey,
				addNotification,
				markNotificationAsRead,
				markAllNotificationsAsRead,
				addReport,
				login,
				logout,
				refreshUserData: () => refreshUserData(currentUser),
			}}
		>
			{children}
		</AppContext.Provider>
	);
};

export default AppContext;

