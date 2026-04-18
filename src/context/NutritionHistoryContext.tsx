import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { firestore } from '../firebase/firebase';
import { useAuth } from '../firebase/AuthContext';
import {
  collection,
  getDoc,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  addDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { NutritionPlan, FoodItem, ConsumptionRecord } from '../types/types';

type NutritionHistoryContextType = {
  completedPlanIdsForToday: string[];
  useCompletedPlanIdsForToday: () => string[];
  saveConsumption: (planId: string, foodId: string, consumed: boolean) => Promise<void>;
  getConsumptionForPlan: (planId: string) => Promise<ConsumptionRecord | null>;
  saveCompletedNutritionPlan: (data: {
    planId: string;
    planName: string;
    date: string;
    consumedFoods: FoodItem[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    userId: string;
  }) => Promise<void>;
};

const NutritionHistoryContext = createContext<NutritionHistoryContextType | undefined>(undefined);

export const NutritionHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [completedPlanIds, setCompletedPlanIds] = useState<string[]>([]);

  const fetchCompletedPlans = async () => {
    if (!user) {
      setCompletedPlanIds([]);
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const completedQ = query(
      collection(firestore, 'completedNutritionPlans'),
      where('userId', '==', user.uid),
      where('date', '==', today),
      where('completed', '==', true)
    );
    const completedSnapshot = await getDocs(completedQ);
    const completedIds: string[] = completedSnapshot.docs.map((doc) => doc.data().planId);
    setCompletedPlanIds(completedIds);
  };

  const saveConsumption = async (planId: string, foodId: string, consumed: boolean) => {
    if (!user) throw new Error('No user signed in');
    const today = new Date().toISOString().split('T')[0];
    const docId = `${user.uid}_${planId}_${today}`;
    const docRef = doc(firestore, 'nutritionConsumption', docId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      await setDoc(docRef, {
        userId: user.uid,
        planId,
        date: today,
        foods: [{ id: foodId, consumed }],
        createdAt: Timestamp.now(),
      });
    } else {
      const data = docSnap.data() as ConsumptionRecord;
      const updatedFoods = data.foods.find((food) => food.id === foodId)
        ? data.foods.map((food) => (food.id === foodId ? { ...food, consumed } : food))
        : [...data.foods, { id: foodId, consumed }];
      await updateDoc(docRef, { foods: updatedFoods });

      const allConsumed = updatedFoods.every((food) => food.consumed);
      if (allConsumed) {
        await addDoc(collection(firestore, 'completedNutritionPlans'), {
          userId: user.uid,
          planId,
          date: today,
          completed: true,
          createdAt: Timestamp.now(),
        });
      }
    }

    await fetchCompletedPlans();
  };

  const getConsumptionForPlan = async (planId: string): Promise<ConsumptionRecord | null> => {
    if (!user) throw new Error('No user signed in');
    const today = new Date().toISOString().split('T')[0];
    const docId = `${user.uid}_${planId}_${today}`;
    const docRef = doc(firestore, 'nutritionConsumption', docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as ConsumptionRecord;
    }
    return null;
  };

  const saveCompletedNutritionPlan = async (data: {
    planId: string;
    planName: string;
    date: string;
    consumedFoods: FoodItem[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    userId: string;
  }) => {
    try {
      await addDoc(collection(firestore, 'completedNutritionPlans'), {
        ...data,
        completed: data.consumedFoods.length > 0,
        createdAt: Timestamp.now(),
      });
      await fetchCompletedPlans();
    } catch (error) {
      console.error('Failed to save completed nutrition plan:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchCompletedPlans();
  }, [user]);

  const useCompletedPlanIdsForToday = () => completedPlanIds;

  return (
    <NutritionHistoryContext.Provider
      value={{
        completedPlanIdsForToday: completedPlanIds,
        useCompletedPlanIdsForToday,
        saveConsumption,
        getConsumptionForPlan,
        saveCompletedNutritionPlan,
      }}
    >
      {children}
    </NutritionHistoryContext.Provider>
  );
};

export const useNutritionHistory = () => {
  const context = useContext(NutritionHistoryContext);
  if (!context) throw new Error('useNutritionHistory must be used within a NutritionHistoryProvider');
  return context;
};
