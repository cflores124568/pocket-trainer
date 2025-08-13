import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, updateDoc, setDoc } from 'firebase/firestore'; 
import { getStorage } from 'firebase/storage'; 
import { Platform } from 'react-native';
import { getAuth } from 'firebase/auth';
import { ActivityLevel, UserData } from '../types/types';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_FIREBASE_IOS_APP_ID : process.env.EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID,
};
//Initialize the firebase app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

//update user profile in firestore
export const updateUserProfile = async (uid: string, data: {
    weight?: number;
    heightFt?: number;
    heightIn?: number;
    dob?: string;
    activityLevel?: ActivityLevel;
    allergies?: string[];
    customAllergens?: string[];
}) => {
    const userDocRef = doc(firestore, 'users', uid);
    await setDoc(userDocRef, data, {merge: true});
};
