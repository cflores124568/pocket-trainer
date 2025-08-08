import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { auth } from '../firebase/firebase';
import { onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, deleteDoc } from 'firebase/firestore';
import { Gender, ActivityLevel } from '../types/types';
//User data to be stored in Firestore
interface UserData {
    firstName: string;
    lastName: string;
    email: string;
    uid: string;
    gender: Gender;
    weight: number;
    heightFt: number;
    heightIn: number;
    dob: string;
    activityLevel: ActivityLevel;
    allergies: string[];
    customAllergens: string[];
}

interface AuthContextProps {
    user: User | null;
    userData: UserData | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signUp: (
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        gender: Gender,
        weight: number,
        heightFt: number,
        heightIn: number,
        dob: string,
        activityLevel: ActivityLevel,
        allergies: string[],
        customAllergens: string[]
    ) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    getUserProfile: () => Promise<UserData>;
    deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        //Listen for authentication state changes
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if(currentUser){
                try{
                    //Fetch firestore data
                    const db = getFirestore();
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const docSnap = await getDoc(userDocRef);

                    if(docSnap.exists()){
                        setUserData(docSnap.data() as UserData);
                    } else{
                        console.log("No such document!");
                        setUserData(null);
                    }
                }catch(error){
                    console.error("Error fetching user data:", error);
                    setUserData(null);
                }
            } else{
                setUserData(null);
            }
            setLoading(false); //Clear user data when logged out
        });
        //Cleanup lister when unmounting
        return unsubscribe;
    }, []);

    const login = async (email: string, password: string) => {
        try{
            setLoading(true);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const db = getFirestore();
            const userDocRef = doc(db, 'users', userCredential.user.uid);
            const docSnap = await getDoc(userDocRef);

            if(!docSnap.exists()){
                console.error('[AuthContext] Firestore user profile not found after login.');
                await signOut(auth); 
                throw new Error('User profile not found.'); 
            }
            setUserData(docSnap.data() as UserData);
        }catch(error){
            console.error("Error signing in:", error);
            throw error;
        }finally{
            setLoading(false);
        }
    };

    const signUp = async (
        email: string,
        password: string,
        firstName: string,
        lastName: string,
        gender: Gender,
        weight: number,
        heightFt: number,
        heightIn: number,
        dob: string,
        activityLevel: ActivityLevel,
        allergies: string[] = [],
        customAllergens: string[] = []
    ) => {
        try{
            setLoading(true);
            //Create firebase account for user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            //Create user firestore document 
            const db = getFirestore();
            const usersCollection = collection(db, 'users');
            const userDocRef = doc(usersCollection, user.uid);
            //Store user profile in Firestore
            await setDoc(userDocRef, {
                firstName,
                lastName,
                email,
                uid: user.uid,
                gender,
                weight,
                heightFt,
                heightIn,
                dob,
                activityLevel,
                allergies,
                customAllergens,
            });
        }catch(error){
            console.error("Error signing up:", error);
            throw error;
        }finally{
            setLoading(false);
        }
    };

    const logout = async () => {
        try{
            setLoading(true);
            await signOut(auth);
        }catch(error){
            console.error("Error signing out:", error);
            throw error;
        }finally{
            setLoading(false);
        }
    };

    const resetPassword = async (email: string) => {
        try{
            setLoading(true);
            await sendPasswordResetEmail(auth, email);
        }catch(error){
            console.error("Error resetting password:", error);
            throw error;
        }finally{
            setLoading(false);
        }
    };

    const getUserProfile = async (): Promise<UserData> => {
        if(!user){
          throw new Error('No user is signed in.');
        }
        const db = getFirestore();
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if(!userDoc.exists()){
          throw new Error('User profile not found.');
        }
        return userDoc.data() as UserData;
    };

    const deleteAccount = async () => {
        if(!user){
          throw new Error('No user is signed in.');
        }
        try{
            setLoading(true);
            const db = getFirestore();
            const userDocRef = doc(db, 'users', user.uid);
            await deleteDoc(userDocRef); // Delete user profile from Firestore
            await deleteUser(user); // Delete user from Firebase Authentication
            setUser(null);
            setUserData(null);
        }catch(error){
            console.error("Error deleting account:", error);
            throw error;
        }finally{
            setLoading(false);
        }
    };
    //Context value with all authenticatino related functions
    const value: AuthContextProps = {
        user,
        userData,
        loading,
        login,
        signUp,
        logout,
        resetPassword,
        getUserProfile,
        deleteAccount,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
//Hook to access AuthContext with a safety check
export const useAuth = () => {
    const context = useContext(AuthContext);
    if(context === undefined){
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
