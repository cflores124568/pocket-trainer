import React from 'react';
import { NavigatorScreenParams } from '@react-navigation/native';
import { ImageSourcePropType } from 'react-native';

//Navigation Types
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  Terms: undefined;
  Privacy: undefined;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Workouts: NavigatorScreenParams<WorkoutStackParamList>;
  Nutrition: NavigatorScreenParams<NutritionStackParamList>;
  Profile: undefined;
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  DailyPlanDashboard: { dashboardType: 'nutrition' | 'fitness' | 'combined' };
};

export type WorkoutStackParamList = {
  ViewWorkoutPlans: undefined;
  CreateWorkoutPlan: { selectedMuscles?: MuscleGroup[]; selectedExercises?: Exercise[] };
  MuscleSelector: { selectedMuscles?: MuscleGroup[]; onReturn?: (muscles: MuscleGroup[]) => void };
  ExerciseBrowser: { selectedMuscles: MuscleGroup[]; selectedDay: DayOfWeek};
  StartWorkout: { planName: string; completedExercises?: string[] };
  ExerciseDetails: { exerciseId: string; selectedMuscles?: MuscleGroup[] };
  MuscleDiagram: { mode?: 'explore' | 'plan'; selectedMuscles?: MuscleGroup[]};
  WorkoutHistory: {
    completed: boolean;
    planName: string;
    duration: number;
    date: string;
  }
  FitnessDashboard: undefined;
  EditWorkoutPlan: {plan: WorkoutPlan};
};

export type NutritionStackParamList = {
  ViewNutritionPlan: undefined;
  CreateNutritionPlan: { gender?: Gender; weight?: number; selectedFood?: FoodItem};
  EditNutritionPlan: { planId: string };
  FoodDetailsScreen: { food: FoodItem;};
  CompleteNutritionPlan: { planId: string };
};

//Muscle Group Type
export const enum MuscleGroup {
  Abs = 'Abs',
  Chest = 'Chest',
  Biceps = 'Biceps',
  Forearms = 'Forearms',
  Deltoids = 'Deltoids',
  Quadriceps = 'Quadriceps',
  Calves = 'Calves',
  Lats = 'Lats',
  Glutes = 'Glutes',
  Triceps = 'Triceps',
  Hamstrings = 'Hamstrings',
  UpperTraps = 'UpperTraps',
  LowerTraps = 'LowerTraps',
  Traps = 'Traps',
  LowerBack = 'LowerBack',
}

//Exercise Interface
export interface Exercise {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly gifUrl?: string;
  readonly sets: number;
  readonly reps: string;
  readonly videoUrl?: string;
  readonly primaryMuscles: readonly MuscleGroup[];
  readonly secondaryMuscles: readonly MuscleGroup[];
  readonly metValue?: number;
  readonly caloriesBurned?: number;
}

//Workout Plan Interface
export interface WorkoutPlan {
  id: string;
  name: string;
  goal: 'lose' | 'maintain' | 'gain';
  dailySchedules: { day: DayOfWeek; exercises: Exercise[] }[];
  userId?: string;
  createdAt?: Date;
  userWeight?: number;
  estimatedCaloriesBurned?: number;
}

//Muscle Data Interface
export interface MuscleData {
  readonly name: MuscleGroup;
  readonly svgPath: string | readonly { d: string }[];
}

//Gender and View Types
export type Gender = 'male' | 'female';
export type DiagramView = 'front' | 'rear';

//Muscle Groups Data Type
interface MusclePath {
  readonly id: string;
  readonly d: string;
}
export interface MuscleGroupsData {
  readonly male: {
    readonly front: Readonly<Partial<Record<MuscleGroup, readonly MusclePath[]>>>;
    readonly rear: Readonly<Partial<Record<MuscleGroup, readonly MusclePath[]>>>;
  };
  readonly female: {
    readonly front: Readonly<Partial<Record<MuscleGroup, readonly MusclePath[]>>>;
    readonly rear: Readonly<Partial<Record<MuscleGroup, readonly MusclePath[]>>>;
  };
}

//Workout Plan Context Type
export interface WorkoutPlanContextType {
  planName: string;
  setPlanName: (name: string) => void;
  goal: 'lose' | 'maintain' | 'gain';
  setGoal: (goal: 'lose' | 'maintain' | 'gain') => void;
  selectedMuscles: MuscleGroup[];
  setSelectedMuscles: (muscles: MuscleGroup[]) => void;
  dailySchedules: { day: DayOfWeek; exercises: Exercise[] }[];
  setDailySchedules: React.Dispatch<React.SetStateAction<{day: DayOfWeek; exercises: Exercise[]}[]>>;
  workoutPlans: WorkoutPlan[];
  loading: boolean;
  error: Error | null;
  savePlan: (plan: NewWorkoutPlan) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
  updatePlan: (plan: WorkoutPlan) => Promise<void>;
  clearCurrentPlan: () => void;
  selectedExercises: Exercise[];
  setSelectedExercises: React.Dispatch<React.SetStateAction<Exercise[]>>;
  refreshWorkoutPlans: () => Promise<void>;
}

//Nutrition types
export interface Nutrient {
  attr_id: number;
  value: number;
}

export interface MacroRatios {
  protein: number;
  carbs: number;
  fat: number;
}

export interface UserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  weight: number;
  heightFt: number;
  heightIn: number;
  dob: string;
  activityLevel: ActivityLevel;
  allergies: string[];
  customAllergens: string[];
}
export interface UserStats {
  weight: number;
  height: number;
  dob: string; // Changed from age to dob (MM/DD/YYYY)
  gender: Gender;
  activityLevel: ActivityLevel;
}

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';

export type MacroGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type FoodItem = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugars?: number;
  fiber?: number;
  potassium?: number;
  sodium?: number;
  iron?: number;
  calcium?: number;
  vitaminC?: number;
  photo?: string;
  servingSize?: string;
  altMeasures?: {measure: string; qty: number; serving_weight: number}[];
  servingWeight?: number;
  fullNutrients: Nutrient[];
  allergens?: {[key: string]: boolean};
  ingredients?: string[];
  //planId: string;
}

export type NutritionPlan = {
  id?: string;
  name: string;
  goal: 'lose' | 'maintain' | 'gain';
  foods: ScheduledFoodItem[];
  userId?: string;
  createdAt?: Date;
  startDate?: Date;
  endDate?: Date;
  dailyCalorieTarget?: number;
  macroRatios?: MacroRatios;
  userStats?: UserStats;
  allergies: string[];
  customAllergens: string[];
  isActive?: boolean;
}

export type NutritionContextType = {
  nutritionPlans: NutritionPlan[];
  planName: string;
  setPlanName: (name: string) => void;
  goal: 'lose' | 'maintain' | 'gain';
  setGoal: (goal: 'lose' | 'maintain' | 'gain') => void;
  selectedFoods: ScheduledFoodItem[];
  setSelectedFoods: (foods: ScheduledFoodItem[]) => void;
  loading: boolean;
  searchFood: (query: string) => Promise<FoodItem[]>;
  savePlan: (plan: NutritionPlan) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
  clearCurrentPlan: () => void;
  getNutrients: (foodName: string, planId: string) => Promise<FoodItem>;
  dailyCalorieTarget: number;
  setDailyCalorieTarget: (calories: number) => void;
  macroRatios: MacroRatios;
  setMacroRatios: (ratios: MacroRatios) => void;
  userStats: UserStats | null;
  setUserStats: (stats: UserStats | null) => void;
  calculateDailyCalorieTarget: (
    weight: number,
    height: number,
    dob: string, //Changed from age to dob
    gender: Gender,
    activityLevel: ActivityLevel,
    goalType: 'lose' | 'maintain' | 'gain'
  ) => number;
  getMacroRatiosForGoal: (goalType: 'lose' | 'maintain' | 'gain') => MacroRatios;
  updateCalorieAndMacroTargets: (
    weight: number,
    height: number,
    dob: string, 
    gender: Gender,
    activityLevel: ActivityLevel,
    goalType: 'lose' | 'maintain' | 'gain'
  ) => void;
  userAllergies: string[];
  setActivePlan: (planId: string) => Promise<void>;
}

export type MealTime = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type ScheduledFoodItem = FoodItem & {
  day: DayOfWeek;
  mealTime?: MealTime;
  servings: number;
  planId: string;
}

//New Interfaces for HomeScreen
export interface CarouselItem {
  id: string;
  title: string;
  description: string;
  image: ImageSourcePropType;
  action: () => void;
}
// Icon Types
type IoniconsName = | 'barbell' | 'create' | 'stats-chart' | 'nutrition' | 'restaurant'; 

type FontistoName = 'eye' | 'preview'; 

type MaterialIconsName = 'edit' | 'visibility' | 'fitness-center' | 'bar-chart'; 

type AntDesignName = 'piechart'; 

type MaterialCommunityIconsName = 'vector-combine'; //Valid MaterialCommunityIcons icon

type IconNameMap = {
  Ionicons: IoniconsName;
  Fontisto: FontistoName;
  MaterialIcons: MaterialIconsName;
  AntDesign: AntDesignName;
  MaterialCommunityIcons: MaterialCommunityIconsName;
};

export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  library: keyof IconNameMap;
  action: () => void;
}
export type NewWorkoutPlan = Omit<WorkoutPlan, 'id'>;

export type CompletedWorkout = {
  id?: string;
  userId: string;
  planName: string;
  date: string; // ISO string
  duration: number; // seconds
  caloriesBurned: number;
  completedExercises: string[]; // exercise IDs
  completed: boolean;
  createdAt?: any;
};

export interface CompletedNutritionPlan {
  id: string; //Firestore document ID
  userId: string; //User who completed the plan
  planId: string; //Reference to the NutritionPlan
  planName: string; // Name of the nutrition plan
  date: string; 
  consumedFoods: ScheduledFoodItem[]; 
  totalCalories: number; 
  totalProtein: number;
  totalCarbs: number; 
  totalFat: number;
  createdAt?: any;
}

export interface ConsumptionRecord {
  userId: string;
  planId: string;
  date: string;
  foods: { id: string; consumed: boolean }[];
  createdAt?: any;
}
