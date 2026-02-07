import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCVwPYi9U2ArhEDSxj6Dm2_UjlQdE1R-XA",
  authDomain: "civicpost2122.firebaseapp.com",
  databaseURL: "https://civicpost2122-default-rtdb.firebaseio.com",
  projectId: "civicpost2122",
  storageBucket: "civicpost2122.firebasestorage.app",
  messagingSenderId: "187152768608",
  appId: "1:187152768608:web:e0096f7e66b62a9128ad05",
  measurementId: "G-NHHV1ZE185"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
