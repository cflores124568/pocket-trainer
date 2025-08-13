import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { HomeStackParamList, MainTabParamList } from '../types/types';
import MacroDistributionChart from '../components/MacroDistributionChart';
import CalorieCharts from '../components/CalorieCharts';
import { useNutritionPlan } from '../context/NutritionContext';
import { useNutritionHistory } from '../context/NutritionHistoryContext';
import { useWorkoutPlan } from '../context/WorkoutPlanContext';
import { useWorkoutHistory } from '../context/WorkoutHistoryContext';
import { styles as globalStyles } from '../styles/styles';
import { theme } from '../styles/theme';

type DailyPlanDashboardProps = {
  route: RouteProp<HomeStackParamList, 'DailyPlanDashboard'>;
  navigation: CompositeNavigationProp<
    StackNavigationProp<HomeStackParamList, 'DailyPlanDashboard'>,
    BottomTabNavigationProp<MainTabParamList>
  >;
};

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DailyPlanDashboard = ({ route, navigation }: DailyPlanDashboardProps) => {
  //Get dashboard type from navigation params, default to showing everything
  const { dashboardType = 'combined' } = route.params || {};
  //Load data from contexts
  const { nutritionPlans, loading: nutritionLoading } = useNutritionPlan();
  const { workoutPlans, loading: workoutLoading } = useWorkoutPlan();
  const { completedWorkouts } = useWorkoutHistory();
  //States for user selections
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay()); // Start with today
  const [selectedNutritionPlanIndex, setSelectedNutritionPlanIndex] = useState<number>(0);
  const [selectedWorkoutPlanIndex, setSelectedWorkoutPlanIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'nutrition' | 'fitness' | 'combined'>(dashboardType);
  const getMealsForDay = (dayIndex: number, planIndex: number) => {
    if(nutritionPlans.length === 0 || planIndex < 0 || planIndex >= nutritionPlans.length){
      return [];
    }
    return nutritionPlans[planIndex].foods.filter((food) => food.day === dayIndex);
  };

  const getNutritionCaloriesForDay = (dayIndex: number, planIndex: number) => {
    const meals = getMealsForDay(dayIndex, planIndex);
    //Add up calories from all meals, accounting for servings
    return meals.reduce((sum, food) => sum + (food.calories || 0) * (food.servings || 1), 0);
  };

  const getNutritionDataForDay = (dayIndex: number, planIndex: number) => {
    const meals = getMealsForDay(dayIndex, planIndex);
    //Calculate total macros for the day
    return meals.reduce(
      (acc, food) => ({
        protein: acc.protein + (food.protein || 0) * (food.servings || 1),
        carbs: acc.carbs + (food.carbs || 0) * (food.servings || 1),
        fat: acc.fat + (food.fat || 0) * (food.servings || 1),
      }),
      { protein: 0, carbs: 0, fat: 0 }
    );
  };

  //Helper functions for workout data
  const getWorkoutsForDay = (dayIndex: number, planIndex: number) => {
    if(workoutPlans.length === 0 || planIndex < 0 || planIndex >= workoutPlans.length){
      return [];
    }
    const plan = workoutPlans[planIndex];
    const daySchedule = plan.dailySchedules?.find((schedule) => schedule.day === dayIndex);
    return daySchedule?.exercises || [];
  };

  const getWorkoutCaloriesForDay = (dayIndex: number, planIndex: number) => {
    if(workoutPlans.length === 0 || planIndex < 0 || planIndex >= workoutPlans.length){
      return 0;
    }
    const schedule = workoutPlans[planIndex].dailySchedules?.find((s) => s.day === dayIndex);
    //Sum up calories burned from all exercises
    return schedule?.exercises.reduce((sum, ex) => sum + (ex.caloriesBurned || 0), 0) || 0;
  };

  //Calculate daily summary metrics
  const getDayMetrics = (dayIndex: number) => {
    const nutritionCalories = getNutritionCaloriesForDay(dayIndex, selectedNutritionPlanIndex);
    const workoutCalories = getWorkoutCaloriesForDay(dayIndex, selectedWorkoutPlanIndex);
    return {
      caloriesIn: nutritionCalories,
      caloriesOut: workoutCalories,
      netCalories: nutritionCalories - workoutCalories, // Positive = surplus, negative = deficit
    };
  };

  //Use memoization to avoid recalculating on every render
  const dayMetrics = useMemo(() => getDayMetrics(selectedDay), [
    selectedDay,
    selectedNutritionPlanIndex,
    selectedWorkoutPlanIndex,
    nutritionPlans,
    workoutPlans,
  ]);

  const nutritionData = useMemo(() => getNutritionDataForDay(selectedDay, selectedNutritionPlanIndex), [
    selectedDay,
    selectedNutritionPlanIndex,
    nutritionPlans,
  ]);

  //Show loading spinner while data is being fetched
  if (nutritionLoading || workoutLoading) {
    return (
      <View style={[globalStyles.container, globalStyles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={globalStyles.homeScreenTitle}>Daily Plan</Text>
        <Text style={styles.headerText}>Your fitness and nutrition hub</Text>
      </View>

      {/*Toggle between different view modes */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'combined' && styles.activeToggleButton]}
          onPress={() => setViewMode('combined')}
          accessibilityLabel="View all plans"
        >
          <Text style={[styles.toggleText, viewMode === 'combined' && styles.activeToggleText]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'nutrition' && styles.activeToggleButton]}
          onPress={() => setViewMode('nutrition')}
          accessibilityLabel="View nutrition plans only"
        >
          <Text style={[styles.toggleText, viewMode === 'nutrition' && styles.activeToggleText]}>Nutrition</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'fitness' && styles.activeToggleButton]}
          onPress={() => setViewMode('fitness')}
          accessibilityLabel="View fitness plans only"
        >
          <Text style={[styles.toggleText, viewMode === 'fitness' && styles.activeToggleText]}>Fitness</Text>
        </TouchableOpacity>
      </View>

      {nutritionPlans.length === 0 && workoutPlans.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.instructionText}>
            No nutrition or workout plans available. Create plans to start tracking!
          </Text>
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() =>
                navigation.navigate('Nutrition', {
                  screen: 'CreateNutritionPlan',
                  params: { gender: undefined, weight: undefined },
                })
              }
              accessibilityLabel="Create a new nutrition plan"
            >
              <Text style={styles.navButtonText}>Add Nutrition Plan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() =>
                navigation.navigate('Workouts', {
                  screen: 'CreateWorkoutPlan',
                  params: { selectedMuscles: undefined, selectedExercises: undefined },
                })
              }
              accessibilityLabel="Create a new workout plan"
            >
              <Text style={styles.navButtonText}>Add Workout Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Let user choose which nutrition plan to view */}
      {(viewMode === 'combined' || viewMode === 'nutrition') && nutritionPlans.length > 0 && (
        <View style={styles.planSelector}>
          <Text style={globalStyles.sectionTitle}>Nutrition Plan</Text>
          <View style={styles.planButtonContainer}>
            {nutritionPlans.map((plan, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.planButton, selectedNutritionPlanIndex === index && styles.activePlanButton]}
                onPress={() => setSelectedNutritionPlanIndex(index)}
                accessibilityLabel={`Select nutrition plan ${plan.name}`}
              >
                <Text style={styles.planText}>{plan.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/*Let user choose which workout plan to view */}
      {(viewMode === 'combined' || viewMode === 'fitness') && workoutPlans.length > 0 && (
        <View style={styles.planSelector}>
          <Text style={globalStyles.sectionTitle}>Workout Plan</Text>
          <View style={styles.planButtonContainer}>
            {workoutPlans.map((plan, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.planButton, selectedWorkoutPlanIndex === index && styles.activePlanButton]}
                onPress={() => setSelectedWorkoutPlanIndex(index)}
                accessibilityLabel={`Select workout plan ${plan.name}`}
              >
                <Text style={styles.planText}>{plan.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Weekly calendar for day selection */}
      <View style={styles.calendarContainer}>
        <Text style={globalStyles.sectionTitle}>Select Day</Text>
        <View style={styles.daySelector}>
          {DAYS_OF_WEEK.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayButton,
                selectedDay === index && styles.activeDayButton, // Highlight selected day
                index === new Date().getDay() && styles.todayButton, // Special border for today
              ]}
              onPress={() => setSelectedDay(index)}
              accessibilityLabel={`Select ${day}`}
            >
              <Text style={styles.dayText}>{day.slice(0, 3)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Show the actual schedule for selected day */}
        <View style={styles.scheduleContainer}>
          <Text style={globalStyles.sectionTitle}>Schedule for {DAYS_OF_WEEK[selectedDay]}</Text>

          {/*List all meals for the day */}
          {(viewMode === 'combined' || viewMode === 'nutrition') && (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Meals</Text>
              {nutritionPlans.length > 0 && getMealsForDay(selectedDay, selectedNutritionPlanIndex).length > 0 ? (
                getMealsForDay(selectedDay, selectedNutritionPlanIndex).map((food, idx) => (
                  <View key={idx} style={styles.item}>
                    <Text style={styles.itemText}>
                      {food.name} - {food.mealTime || 'Any'} - {food.servings} serving(s): {food.calories || 0} cal
                      {/*Show macronutrients */}
                      {food.protein ? `, P: ${food.protein * food.servings}g` : ''}
                      {food.carbs ? `, C: ${food.carbs * food.servings}g` : ''}
                      {food.fat ? `, F: ${food.fat * food.servings}g` : ''}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.instructionText}>
                  {nutritionPlans.length === 0
                    ? 'No nutrition plans. Add one to schedule meals.'
                    : 'No meals scheduled for this day.'}
                </Text>
              )}
            </View>
          )}

          {/*List all workouts for the day */}
          {(viewMode === 'combined' || viewMode === 'fitness') && (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Workouts</Text>
              {workoutPlans.length > 0 && getWorkoutsForDay(selectedDay, selectedWorkoutPlanIndex).length > 0 ? (
                getWorkoutsForDay(selectedDay, selectedWorkoutPlanIndex).map((exercise, idx) => (
                  <View key={idx} style={styles.item}>
                    <Text style={styles.itemText}>
                      {exercise.name} - {exercise.sets} sets, {exercise.reps}
                      {/* Show estimated calories if available */}
                      {exercise.caloriesBurned ? ` · ~${Math.round(exercise.caloriesBurned)} cal` : ''}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.instructionText}>
                  {workoutPlans.length === 0
                    ? 'No workout plans. Add one to schedule workouts.'
                    : 'No workouts scheduled for this day.'}
                </Text>
              )}
            </View>
          )}

          {/* Show daily summary and charts */}
          {((viewMode === 'combined' && (nutritionPlans.length > 0 || workoutPlans.length > 0)) ||
            (viewMode === 'nutrition' && nutritionPlans.length > 0) ||
            (viewMode === 'fitness' && workoutPlans.length > 0)) && (
            <View style={styles.metricsContainer}>
              <Text style={styles.sectionHeader}>Daily Metrics</Text>
              <View style={styles.metrics}>
                <Text style={styles.metricsText}>Calories In: {dayMetrics.caloriesIn} cal</Text>
                <Text style={styles.metricsText}>Calories Out: {dayMetrics.caloriesOut} cal</Text>
                <Text style={styles.metricsText}>Net Calories: {dayMetrics.netCalories} cal</Text>
              </View>

              {/* Show macro breakdown chart for nutrition */}
              {(viewMode === 'combined' || viewMode === 'nutrition') && nutritionPlans.length > 0 && (
                <View style={styles.macroChart}>
                  <Text style={styles.sectionHeader}>
                    Macro Distribution - {nutritionPlans[selectedNutritionPlanIndex]?.name || 'Selected Plan'}
                  </Text>
                  <MacroDistributionChart
                    nutritionData={nutritionData}
                    planName={nutritionPlans[selectedNutritionPlanIndex]?.name}
                  />
                </View>
              )}

              {/* Show workout progress charts */}
              {(viewMode === 'combined' || viewMode === 'fitness') && (workoutPlans.length > 0 || completedWorkouts.length > 0) && (
                <View style={styles.section}>
                  <Text style={styles.sectionHeader}>Workout Progress</Text>
                  <CalorieCharts />
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Quick action buttons to add more plans */}
      {(nutritionPlans.length > 0 || workoutPlans.length > 0) && (
        <View style={styles.navigationContainer}>
          {(viewMode === 'combined' || viewMode === 'nutrition') && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={() =>
                navigation.navigate('Nutrition', {
                  screen: 'CreateNutritionPlan',
                  params: { gender: undefined, weight: undefined },
                })
              }
              accessibilityLabel="Create a new nutrition plan"
            >
              <Text style={styles.navButtonText}>Add Nutrition Plan</Text>
            </TouchableOpacity>
          )}
          {(viewMode === 'combined' || viewMode === 'fitness') && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={() =>
                navigation.navigate('Workouts', {
                  screen: 'CreateWorkoutPlan',
                  params: { selectedMuscles: undefined, selectedExercises: undefined },
                })
              }
              accessibilityLabel="Create a new workout plan"
            >
              <Text style={styles.navButtonText}>Add Workout Plan</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: theme.spacing.md },
  header: { alignItems: 'center', marginBottom: theme.spacing.lg },
  headerText: { fontSize: 16, color: theme.colors.text, textAlign: 'center' },
  emptyState: { alignItems: 'center', marginVertical: theme.spacing.lg },
  planSelector: { marginVertical: theme.spacing.md },
  planButtonContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  planButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    margin: 4,
  },
  activePlanButton: { backgroundColor: theme.colors.primary },
  planText: { color: '#333', fontSize: 14 },
  calendarContainer: { marginVertical: theme.spacing.lg },
  daySelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: theme.spacing.md,
  },
  dayButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDayButton: { backgroundColor: theme.colors.primary },
  todayButton: { borderWidth: 2, borderColor: theme.colors.secondary },
  dayText: { fontSize: 14, color: '#333' },
  scheduleContainer: { marginTop: theme.spacing.md },
  section: { marginBottom: theme.spacing.lg },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  item: { padding: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  itemText: { fontSize: 16, color: theme.colors.text },
  instructionText: { fontSize: 14, color: '#666', textAlign: 'center' },
  metricsContainer: { marginTop: theme.spacing.md },
  metrics: { alignItems: 'center' },
  metricsText: { fontSize: 16, color: theme.colors.text, marginVertical: 4 },
  macroChart: { marginTop: theme.spacing.md },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.lg,
  },
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
  },
  navButtonText: { color: '#fff', fontSize: 16 },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: theme.spacing.md,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    padding: 4,
    alignSelf: 'center',
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  activeToggleButton: {
    backgroundColor: theme.colors.primary,
  },
  toggleText: {
    fontSize: 16,
    color: '#666',
  },
  activeToggleText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default DailyPlanDashboard;
