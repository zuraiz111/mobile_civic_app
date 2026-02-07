import { db } from '../config/firebase';
import {
	collection,
	addDoc,
	getDocs,
	query,
	where,
	orderBy,
	updateDoc,
	doc,
	serverTimestamp,
} from 'firebase/firestore';

/**
 * Add a new notification to Firestore
 */
export const addNotificationToFirestore = async (notification) => {
	try {
		const docRef = await addDoc(collection(db, 'notifications'), {
			...notification,
			createdAt: serverTimestamp(),
			read: false,
		});
		return docRef.id;
	} catch (error) {
		console.error('Error adding notification to Firestore:', error);
		throw error;
	}
};

/**
 * Get all notifications for a specific user from Firestore
 */
export const getUserNotificationsFromFirestore = async (userId) => {
	try {
		// Removed orderBy from query to avoid composite index requirement
		const q = query(
			collection(db, 'notifications'),
			where('userId', '==', userId),
		);

		const querySnapshot = await getDocs(q);
		const notifications = [];

		querySnapshot.forEach((doc) => {
			const data = doc.data();
			notifications.push({
				id: doc.id,
				...data,
				time: data.createdAt?.toDate
					? data.createdAt.toDate().toISOString()
					: (data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000).toISOString() : new Date().toISOString()),
			});
		});

		// Sort by time descending (newest first) in JavaScript
		notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

		return notifications;
	} catch (error) {
		console.error('Error fetching user notifications:', error);
		return [];
	}
};

/**
 * Mark a notification as read in Firestore
 */
export const markNotificationAsReadInFirestore = async (notificationId) => {
	try {
		const docRef = doc(db, 'notifications', notificationId);
		await updateDoc(docRef, {
			read: true,
		});
	} catch (error) {
		console.error('Error marking notification as read:', error);
		throw error;
	}
};

/**
 * Mark all notifications as read for a user in Firestore
 */
export const markAllNotificationsAsReadInFirestore = async (userId) => {
	try {
		const q = query(
			collection(db, 'notifications'),
			where('userId', '==', userId),
			where('read', '==', false),
		);

		const querySnapshot = await getDocs(q);
		const updatePromises = querySnapshot.docs.map((doc) =>
			updateDoc(doc.ref, { read: true }),
		);

		await Promise.all(updatePromises);
	} catch (error) {
		console.error('Error marking all notifications as read:', error);
		throw error;
	}
};

