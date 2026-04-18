import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { collection, addDoc, query, where, doc, deleteDoc, onSnapshot, writeBatch, getDocs, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { useAuth } from '../firebase/AuthContext';
import { NutritionPlan, FoodItem, ScheduledFoodItem, NutritionContextType, UserStats, MacroRatios, ActivityLevel } from '../types/types';
import { NUTRITIONIX_API } from '../apis/NutritionixApi';
import { calculateAge } from '../utils/ageDobUtil';
import { NUTRITIONIX_SUPPORTED_ALLERGENS } from '../utils/AllergenSelectorUtil';

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

const createScheduledFoodEntryId = (foodId: string, index: number): string =>
  `${foodId}-${Date.now()}-${index}-${Math.floor(Math.random() * 100000)}`;

export const NutritionPlanProvider = ({ children }: { children: ReactNode }) => {
  const [planName, setPlanName] = useState('');
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');
  const [selectedFoods, setSelectedFoods] = useState<ScheduledFoodItem[]>([]);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyCalorieTarget, setDailyCalorieTarget] = useState<number>(0);
  const [macroRatios, setMacroRatios] = useState<MacroRatios>({ protein: 30, carbs: 40, fat: 30 });
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  const { user, userData } = useAuth();
  const userAllergies = userData?.customAllergens || [];

  useEffect(() => {
    if (!user) {
      setNutritionPlans([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(firestore, 'nutritionPlans'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const plans: NutritionPlan[] = [];
        querySnapshot.forEach((doc) => {
          plans.push({ id: doc.id, ...doc.data() } as NutritionPlan);
        });
        setNutritionPlans(plans);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching nutrition plans:', error);
        setNutritionPlans([]);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const setActivePlan = useCallback(async (planId: string) => {
    if (!user) return;

    try {
      const plansRef = collection(firestore, 'nutritionPlans');
      const q = query(plansRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const batch = writeBatch(firestore);
      snapshot.forEach((docSnap) => {
        const ref = doc(firestore, 'nutritionPlans', docSnap.id);
        batch.update(ref, { isActive: docSnap.id === planId });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error setting active nutrition plan:', error);
      throw error;
    }
  }, [user]);

  const searchFood = useCallback(async (query: string): Promise<FoodItem[]> => {
    setLoading(true);
    try {
      const response = await fetch(`${NUTRITIONIX_API.BASE_URL}/search/instant?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'x-app-id': NUTRITIONIX_API.APP_ID,
          'x-app-key': NUTRITIONIX_API.API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return data.common.map((item: any) => ({
        id: item.tag_id || item.food_name,
        name: item.food_name,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        photo: item.photo?.thumb,
      }));
    } catch (error) {
      console.error('Error searching foods:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getNutrients = useCallback(async (foodName: string, planId: string): Promise<FoodItem> => {
    try {
      const response = await fetch(`${NUTRITIONIX_API.BASE_URL}/natural/nutrients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-id': NUTRITIONIX_API.APP_ID,
          'x-app-key': NUTRITIONIX_API.API_KEY,
        },
        body: JSON.stringify({ query: `1 ${foodName}` }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      const food = data.foods[0] || {};

      const ingredientsString = food.nf_ingredient_statement || '';
      const ingredientsArray = ingredientsString
        ? ingredientsString.split(',').map((i: string) => i.trim()).filter(Boolean)
        : [];

      const customAllergens = userData?.customAllergens || [];
      const customAllergenMatches = customAllergens.reduce(
        (acc: { [key: string]: boolean }, allergen: string) => {
          acc[allergen.toLowerCase()] =
            ingredientsString.toLowerCase().includes(allergen.toLowerCase()) ||
            foodName.toLowerCase().includes(allergen.toLowerCase());
          return acc;
        },
        {}
      );

      const allergens = NUTRITIONIX_SUPPORTED_ALLERGENS.reduce(
        (acc: { [key: string]: boolean }, allergen: { id: string; name: string }) => {
          const allergenKey = allergen.id;
          acc[allergenKey] =
            !!food[`allergen_contains_${allergenKey}`] ||
            ingredientsString.toLowerCase().includes(allergenKey) ||
            foodName.toLowerCase().includes(allergenKey);
          return acc;
        },
        {}
      );

      return {
        id: food.tag_id || food.food_name,
        name: food.food_name,
        calories: Math.round(food.nf_calories * 10) / 10 || 0,
        protein: Math.round(food.nf_protein * 10) / 10 || 0,
        carbs: Math.round(food.nf_total_carbohydrate * 10) / 10 || 0,
        fat: Math.round(food.nf_total_fat * 10) / 10 || 0,
        sugars: food.nf_sugars,
        fiber: food.nf_dietary_fiber,
        potassium: food.nf_potassium,
        sodium: food.nf_sodium,
        altMeasures: food.alt_measures,
        photo: food.photo?.thumb,
        servingSize: food.serving_unit || 'N/A',
        servingWeight: food.serving_weight_grams || 0,
        fullNutrients: food.full_nutrients || [],
        allergens: { ...allergens, ...customAllergenMatches },
        ingredients: ingredientsArray,
      };
    } catch (error) {
      console.error('Error fetching nutrients:', error);
      return {
        id: foodName,
        name: foodName,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        servingSize: 'N/A',
        servingWeight: 0,
        fullNutrients: [],
        allergens: {},
        ingredients: [],
      };
    }
  }, [userData?.customAllergens]);

  const calculateDailyCalorieTarget = useCallback(
    (
      weight: number,
      height: number,
      dob: string,
      gender: 'male' | 'female',
      activityLevel: ActivityLevel,
      goalType: 'lose' | 'maintain' | 'gain'
    ): number => {
      const age = calculateAge(dob);
      const weightKg = weight * 0.453592;
      const heightCm = height * 2.54;

      let bmr =
        gender === 'male'
          ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
          : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

      const activityMultipliers: Record<ActivityLevel, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        veryActive: 1.9,
      };

      let tdee = bmr * activityMultipliers[activityLevel];

      if (goalType === 'lose') tdee -= 500;
      else if (goalType === 'gain') tdee += 500;

      return Math.round(tdee);
    },
    []
  );

  const getMacroRatiosForGoal = useCallback((goalType: 'lose' | 'maintain' | 'gain'): MacroRatios => {
    return goalType === 'lose'
      ? { protein: 40, carbs: 30, fat: 30 }
      : goalType === 'gain'
      ? { protein: 30, carbs: 50, fat: 20 }
      : { protein: 30, carbs: 40, fat: 30 };
  }, []);

  const updateCalorieAndMacroTargets = useCallback(
    (
      weight: number,
      height: number,
      dob: string,
      gender: 'male' | 'female',
      activityLevel: ActivityLevel,
      goalType: 'lose' | 'maintain' | 'gain'
    ) => {
      const calories = calculateDailyCalorieTarget(weight, height, dob, gender, activityLevel, goalType);
      const macros = getMacroRatiosForGoal(goalType);
      setDailyCalorieTarget(calories);
      setMacroRatios(macros);
      setUserStats({ weight, height, dob, gender, activityLevel });
    },
    [calculateDailyCalorieTarget, getMacroRatiosForGoal]
  );

  const savePlan = useCallback(async (plan: NutritionPlan) => {
    if (!user) return;
    try {
      if (plan.id) {
        const planId = plan.id;
        const updatedFoods = plan.foods.map((food, index) => ({
          ...food,
          planId,
          entryId: food.entryId || createScheduledFoodEntryId(food.id, index),
        }));

        await updateDoc(doc(firestore, 'nutritionPlans', planId), {
          ...plan,
          id: planId,
          userId: user.uid,
          foods: updatedFoods,
          dailyCalorieTarget: plan.dailyCalorieTarget ?? dailyCalorieTarget,
          macroRatios: plan.macroRatios ?? macroRatios,
          userStats: plan.userStats ?? userStats,
          updatedAt: new Date(),
        });
        return;
      }

      // Save the new plan first to get a generated plan id.
      const docRef = await addDoc(collection(firestore, 'nutritionPlans'), {
        ...plan,
        userId: user.uid,
        createdAt: new Date(),
        dailyCalorieTarget,
        macroRatios,
        userStats,
        foods: [],
      });
      const planId = docRef.id;

      const updatedFoods = plan.foods.map((food, index) => ({
        ...food,
        planId,
        entryId: food.entryId || createScheduledFoodEntryId(food.id, index),
      }));

      await updateDoc(doc(firestore, 'nutritionPlans', planId), {
        id: planId,
        foods: updatedFoods,
      });
    } catch (error) {
      console.error('Error saving nutrition plan:', error);
      throw error;
    }
  }, [user, dailyCalorieTarget, macroRatios, userStats]);

  const deletePlan = useCallback(async (planId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(firestore, 'nutritionPlans', planId));
    } catch (error) {
      console.error('Error deleting nutrition plan:', error);
      throw error;
    }
  }, [user]);

  const clearCurrentPlan = useCallback(() => {
    setPlanName('');
    setGoal('maintain');
    setSelectedFoods([]);
    setDailyCalorieTarget(0);
    setMacroRatios({ protein: 30, carbs: 40, fat: 30 });
    setUserStats(null);
  }, []);

  const value = useMemo(
    () => ({
      planName,
      setPlanName,
      goal,
      setGoal,
      selectedFoods,
      setSelectedFoods,
      nutritionPlans,
      loading,
      searchFood,
      getNutrients,
      savePlan,
      deletePlan,
      clearCurrentPlan,
      dailyCalorieTarget,
      setDailyCalorieTarget,
      macroRatios,
      setMacroRatios,
      userStats,
      setUserStats,
      calculateDailyCalorieTarget,
      getMacroRatiosForGoal,
      updateCalorieAndMacroTargets,
      userAllergies,
      setActivePlan,
    }),
    [
      planName,
      goal,
      selectedFoods,
      nutritionPlans,
      loading,
      dailyCalorieTarget,
      macroRatios,
      userStats,
      searchFood,
      getNutrients,
      savePlan,
      deletePlan,
      clearCurrentPlan,
      calculateDailyCalorieTarget,
      getMacroRatiosForGoal,
      updateCalorieAndMacroTargets,
      userAllergies,
      setActivePlan,
    ]
  );

  return <NutritionContext.Provider value={value}>{children}</NutritionContext.Provider>;
};

export const useNutritionPlan = () => {
  const context = useContext(NutritionContext);
  if (context === undefined) {
    throw new Error('useNutritionPlan must be used within a NutritionPlanProvider');
  }
  return context;
};
