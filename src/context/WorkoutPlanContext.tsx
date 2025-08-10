import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { MuscleGroup, Exercise, WorkoutPlan, WorkoutPlanContextType, DayOfWeek, NewWorkoutPlan } from '../types/types';
import { firestore } from '../firebase/firebase';
import { collection, addDoc, query, where, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../firebase/AuthContext';

const WorkoutPlanContext = createContext<WorkoutPlanContextType | undefined>(undefined);

export const WorkoutPlanProvider = ({ children }: { children: ReactNode }) => {
  //Current plan being created
  const [planName, setPlanName] = useState('');
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([]);
  const [dailySchedules, setDailySchedules] = useState<{ day: DayOfWeek; exercises: Exercise[] }[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  //Saved plans
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { user } = useAuth();

  const fetchWorkoutPlans = useCallback(async () => {
    if(!user){
      //Clear data when user logs out
      setWorkoutPlans([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    try{
      const q = query(collection(firestore, 'workoutPlans'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const plans: WorkoutPlan[] = [];

      querySnapshot.forEach((doc) => {
        plans.push({ id: doc.id, ...doc.data() } as WorkoutPlan);
      });
      setWorkoutPlans(plans);
      setError(null);
    }catch(err){
      const fetchError = err instanceof Error ? err : new Error('Failed to fetch workout plans');
      setError(fetchError);
    }finally{
      setLoading(false);
    }
  }, [user]);

  //Fetch plans when user changes
  useEffect(() => {
    fetchWorkoutPlans();
  }, [fetchWorkoutPlans]);
  //Expose refresh function
  const refreshWorkoutPlans = useCallback(async () => {
    await fetchWorkoutPlans();
  }, [fetchWorkoutPlans]);

  //save plan to firestore and update local state
  const savePlan = async (plan: NewWorkoutPlan) => {
    if(!user){
      throw new Error('No user signed in.');
    }

    try{
      const planData = { ...plan, userId: user.uid, createdAt: new Date() };
      const docRef = await addDoc(collection(firestore, 'workoutPlans'), planData);
      //Update local state
      setWorkoutPlans([...workoutPlans, { ...planData, id: docRef.id }]);
      setError(null);
    }catch(err){
      const saveError = err instanceof Error ? err : new Error('Failed to save workout plan');
      setError(saveError);
      throw saveError;
    }
  };

  //Delete plan from firestore and remove from local state
  const deletePlan = async (planId: string) => {
    if(!user){
      throw new Error('No user signed in.');
    }

    try{
      await deleteDoc(doc(firestore, 'workoutPlans', planId));
      //Update local state
      setWorkoutPlans(workoutPlans.filter((plan) => plan.id !== planId));
      setError(null);
    }catch(err){
      const deleteError = err instanceof Error ? err : new Error('Failed to delete workout plan');
      setError(deleteError);
      throw deleteError;
    }
  };

  //Update plan in firestore
  const updatePlan = async (plan: WorkoutPlan) => {
    if(!user){
      throw new Error('No user signed in.');
    }
    if(!plan.id){
      throw new Error('Plan ID is missing.');
    }

    try{
      setLoading(true);
      const planRef = doc(firestore, 'workoutPlans', plan.id);
      await setDoc(planRef, { ...plan, userId: user.uid, updatedAt: new Date() }, { merge: true });
      //Update local state
      setWorkoutPlans(workoutPlans.map((p) => (p.id === plan.id ? plan : p)));
      setError(null);
    }catch(err){
      const updateError = err instanceof Error ? err : new Error('Failed to update workout plan');
      setError(updateError);
      throw updateError;
    }finally{
      setLoading(false);
    }
  };

  const clearCurrentPlan = () => {
    setPlanName('');
    setGoal('maintain');
    setSelectedMuscles([]);
    setDailySchedules([]);
    setSelectedExercises([]);
  };

  return (
    <WorkoutPlanContext.Provider
      value={{
        planName,
        setPlanName,
        goal,
        setGoal,
        selectedMuscles,
        setSelectedMuscles,
        dailySchedules,
        setDailySchedules,
        workoutPlans,
        loading,
        error,
        savePlan,
        deletePlan,
        updatePlan,
        clearCurrentPlan,
        selectedExercises,
        setSelectedExercises,
        refreshWorkoutPlans,
      }}
    >
      {children}
    </WorkoutPlanContext.Provider>
  );
};

//Custom hook to use the context
export const useWorkoutPlan = () => {
  const context = useContext(WorkoutPlanContext);
  if(context === undefined){
    throw new Error('useWorkoutPlan must be used within a WorkoutPlanProvider');
  }
  return context;
};
