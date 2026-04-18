import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { firestore } from '../firebase/firebase';
import { useAuth } from '../firebase/AuthContext';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { CompletedWorkout } from '../types/types';

type WorkoutHistoryContextType = {
  completedWorkouts: CompletedWorkout[];
  loading: boolean;
  error: Error | null;
  saveCompletedWorkout: (workout: Omit<CompletedWorkout, 'id' | 'createdAt'>) => Promise<void>;
  fetchWorkoutHistory: () => Promise<void>;
  getCompletedWorkoutsForDate: (userId: string, date: string) => CompletedWorkout[];
};

const WorkoutHistoryContext = createContext<WorkoutHistoryContextType | undefined>(undefined);

export const WorkoutHistoryProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [workoutHistory, setWorkoutHistory] = useState<CompletedWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorkoutHistory = async () => {
    if (!user) {
      setWorkoutHistory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const q = query(collection(firestore, 'workoutHistory'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as CompletedWorkout));
      setWorkoutHistory(history);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch workout history'));
    } finally {
      setLoading(false);
    }
  };

  const saveCompletedWorkout = async (workout: Omit<CompletedWorkout, 'id' | 'createdAt'>) => {
    if (!user) {
      throw new Error('No user signed in');
    }
    try {
      const newWorkout = {
        ...workout,
        userId: user.uid,
        createdAt: Timestamp.now(),
      };
      await addDoc(collection(firestore, 'workoutHistory'), newWorkout);
      await fetchWorkoutHistory(); // Refresh history after saving
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save completed workout'));
      throw err;
    }
  };

  const getCompletedWorkoutsForDate = (userId: string, date: string): CompletedWorkout[] => {
    // Return all workouts for the given user/date so callers can decide resume/completed state.
    return workoutHistory.filter(
      (workout) =>
        workout.userId === userId &&
        workout.date.startsWith(date)
    );
  };

  useEffect(() => {
    fetchWorkoutHistory();
  }, [user]);

  return (
    <WorkoutHistoryContext.Provider
      value={{
        completedWorkouts: workoutHistory,
        loading,
        error,
        saveCompletedWorkout,
        fetchWorkoutHistory,
        getCompletedWorkoutsForDate,
      }}
    >
      {children}
    </WorkoutHistoryContext.Provider>
  );
};

export const useWorkoutHistory = () => {
  const context = useContext(WorkoutHistoryContext);
  if (!context) throw new Error('useWorkoutHistory must be used within a WorkoutHistoryProvider');
  return context;
};
