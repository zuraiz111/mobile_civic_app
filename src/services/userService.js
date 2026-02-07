import { db } from '../config/firebase';
import {
	doc,
	setDoc,
	getDoc,
	updateDoc,
	serverTimestamp,
	collection,
	query,
	where,
	getDocs,
} from 'firebase/firestore';

// Check if user exists by phone
export const checkUserExists = async (phone) => {
	try {
		const docRef = doc(db, 'users', phone);
		const docSnap = await getDoc(docRef);
		return docSnap.exists();
	} catch (error) {
		console.error('Error checking user existence:', error);
		throw error;
	}
};

// Register new citizen
export const registerCitizen = async (
	phone,
	{ firstName, lastName, gender, uid },
) => {
	try {
		const now = new Date();
		const userDoc = {
			uid: uid || null, // Store Auth UID if available
			phone,
			name: `${firstName || ''} ${lastName || ''}`.trim(),
			firstName: firstName || '',
			lastName: lastName || '',
			gender: gender || null,
			role: 'citizen',
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
			status: 'active',
		};

		// Use phone number as document ID
		await setDoc(doc(db, 'users', phone), userDoc);

		return {
			id: phone,
			...userDoc,
			createdAt: now.toISOString(), // Use local ISO string for immediate state
			updatedAt: now.toISOString(),
		};
	} catch (error) {
		console.error('Error registering citizen:', error);
		throw error;
	}
};

// Get User Profile by ID (Phone or UID)
export const getUserProfile = async (id) => {
	try {
		if (!id) return null;

		// Try fetching by the provided ID (could be phone or UID)
		const userDoc = await getDoc(doc(db, 'users', id));

		if (userDoc.exists()) {
			const data = userDoc.data();
			return {
				id: userDoc.id,
				...data,
				// Ensure dates are consistent
				createdAt: data.createdAt?.toDate
					? data.createdAt.toDate().toISOString()
					: data.createdAt?.seconds
						? new Date(data.createdAt.seconds * 1000).toISOString()
						: new Date().toISOString(),
				updatedAt: data.updatedAt?.toDate
					? data.updatedAt.toDate().toISOString()
					: data.updatedAt?.seconds
						? new Date(data.updatedAt.seconds * 1000).toISOString()
						: new Date().toISOString(),
			};
		}

		// Fallback: If not found, search by uid field
		const q = query(collection(db, 'users'), where('uid', '==', id));
		const querySnapshot = await getDocs(q);

		if (!querySnapshot.empty) {
			const doc = querySnapshot.docs[0];
			const data = doc.data();
			return {
				id: doc.id,
				...data,
				createdAt: data.createdAt?.toDate
					? data.createdAt.toDate().toISOString()
					: data.createdAt?.seconds
						? new Date(data.createdAt.seconds * 1000).toISOString()
						: new Date().toISOString(),
				updatedAt: data.updatedAt?.toDate
					? data.updatedAt.toDate().toISOString()
					: data.updatedAt?.seconds
						? new Date(data.updatedAt.seconds * 1000).toISOString()
						: new Date().toISOString(),
			};
		}

		return null;
	} catch (error) {
		console.error('Error fetching user profile:', error);
		throw error;
	}
};

// Update existing user (e.g. on login to update UID)
export const updateUserAuthId = async (phone, newUid) => {
	try {
		const userRef = doc(db, 'users', phone);
		await updateDoc(userRef, {
			uid: newUid,
			updatedAt: serverTimestamp(),
		});
	} catch (error) {
		console.error('Error updating user auth ID:', error);
		// Don't throw, just log. Not critical if we use phone as ID.
	}
};

export const updateUserProfile = async (userId, updateData) => {
	try {
		if (!userId) {
			throw new Error('User ID is required');
		}

		const updates = {};

		// Validate and add name
		if (updateData.name !== undefined) {
			const trimmedName = updateData.name.trim();
			if (!trimmedName) {
				throw new Error('Name cannot be empty');
			}
			updates.name = trimmedName;
		}

		// Validate and add phone
		if (updateData.phone !== undefined) {
			const trimmedPhone = updateData.phone.trim();
			if (!trimmedPhone) {
				throw new Error('Phone number cannot be empty');
			}
			updates.phone = trimmedPhone;
		}

		// Add timestamp
		updates.updatedAt = serverTimestamp();

		// Update user document
		const userRef = doc(db, 'users', userId);
		await updateDoc(userRef, updates);

		return {
			success: true,
			message: 'Profile updated successfully',
		};
	} catch (error) {
		console.error('Error updating profile:', error);
		throw new Error(error.message || 'Failed to update profile');
	}
};
// // Update User Profile
// export const updateUserProfile = async (uid, data) => {
//   try {
//     await updateDoc(doc(db, 'users', uid), {
//       ...data,
//       updatedAt: serverTimestamp(),
//     });
//     return true;
//   } catch (error) {
//     console.error('Error updating user profile:', error);
//     throw error;
//   }
// };

