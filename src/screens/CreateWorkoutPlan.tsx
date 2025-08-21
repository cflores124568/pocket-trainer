import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { WorkoutStackParamList, MuscleGroup, WorkoutPlan, Exercise, DayOfWeek } from '../types/types';
import { styles as globalStyles } from '../styles/styles';
import { theme } from '../styles/theme';
import { useWorkoutPlan } from '../context/WorkoutPlanContext';
import { useAuth } from '../firebase/AuthContext';
import { useCalorieCalculator } from '../hooks/useCalorieCalculator';
import Collapsible from 'react-native-collapsible';
import Slider from '@react-native-community/slider';
import { calculateCaloriesBurned, estimateExerciseDuration, lbsToKg } from '../utils/CalorieCalculatorUtil';

//Define goal presets for pace and rest settings
const GOAL_PRESETS = {
  lose: { pace: 2, rest: 30 },
  maintain: { pace: 4, rest: 60 },
  gain: { pace: 5, rest: 90 },
};
//Convert pace value to descriptive label
const paceLabel = (value: number): string => {
  if (value <= 2) return 'Fast';
  if (value <= 4) return 'Moderate';
  return 'Slow';
};
//Convert rest value to descriptive label
const restLabel = (value: number): string => {
  if (value <= 30) return 'Short';
  if (value <= 60) return 'Medium';
  return 'Long';
};
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

//Define navigation and route prop types
type CreateWorkoutPlanNavigationProp = StackNavigationProp<WorkoutStackParamList, 'CreateWorkoutPlan'>;
type CreateWorkoutPlanRouteProp = RouteProp<WorkoutStackParamList, 'CreateWorkoutPlan'>;
interface CreateWorkoutPlanProps {
  navigation: CreateWorkoutPlanNavigationProp;
  route: CreateWorkoutPlanRouteProp;
}
//Main component for creating a workout plan
const CreateWorkoutPlanScreen = ({ navigation, route }: CreateWorkoutPlanProps) => {
  const { userData } = useAuth();
  const {
    planName,
    setPlanName,
    goal,
    setGoal,
    selectedMuscles,
    setSelectedMuscles,
    dailySchedules,
    setDailySchedules,
    savePlan,
    clearCurrentPlan,
  } = useWorkoutPlan();
  //UI state
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(0);
  const [useDefaultWeight, setUseDefaultWeight] = useState(true);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  //Weight and calorie settings
  const defaultWeight = userData?.weight ? userData.weight.toString() : '';
  const [weightLbs, setWeightLbs] = useState<string>(defaultWeight);
  const [showCalories, setShowCalories] = useState(true);
  const [secondsPerRep, setSecondsPerRep] = useState(4);
  const [restBetweenSets, setRestBetweenSets] = useState(60);

  const currentWeight = useDefaultWeight ? parseFloat(defaultWeight) || undefined : parseFloat(weightLbs) || undefined;
  //Memoize temporary workout plan
  const tempPlan = useMemo(
    () => ({
      id: 'temp',
      name: planName,
      goal: goal as 'lose' | 'maintain' | 'gain',
      dailySchedules,
      userWeight: currentWeight,
    }),
    [planName, goal, dailySchedules, currentWeight]
  );
  //Memoize calorie calculation options
  const calorieCalcOptions = useMemo(
    () => ({ secondsPerRep, restBetweenSets }),
    [secondsPerRep, restBetweenSets]
  );
  //Calculate calories using custom hook
  const { caloriesByDay, totalCalories } = useCalorieCalculator(currentWeight ? tempPlan : null, calorieCalcOptions);
  //Initialize selected muscles from route params
  useEffect(() => {
    const { selectedMuscles: musclesFromRoute = [] } = route.params || {};
    setSelectedMuscles(musclesFromRoute);
  }, [route.params, setSelectedMuscles]);

  //Navigate to muscle selection screen
  const handleSelectedMuscles = () => {
    navigation.navigate('MuscleDiagram', {
      mode: 'plan',
      selectedMuscles,
    });
  };

  //Navigate to exercise selection screen
  const handleSelectedExercises = () => {
    if (selectedMuscles.length === 0) {
      Alert.alert('Error', 'Please select at least one muscle group first.');
      return;
    }
    navigation.navigate('ExerciseBrowser', {
      selectedMuscles,
      selectedDay,
    });
  };
  //Remove an exercise from a day's schedule
  const removeExercise = (day: DayOfWeek, exerciseId: string) => {
    const updatedSchedules = dailySchedules
      .map((schedule) => {
        if (schedule.day === day) {
          return {
            ...schedule,
            exercises: schedule.exercises.filter((ex) => ex.id !== exerciseId),
          };
        }
        return schedule;
      })
      .filter((schedule) => schedule.exercises.length > 0);
    setDailySchedules(updatedSchedules);
  };

  //Calculate calories burned for a single exercise
  const calculateCaloriesForExercise = (exercise: Exercise): number => {
    if(!exercise.metValue || !currentWeight){
      return 0;
    }
    const durationMinutes = estimateExerciseDuration(
      exercise.sets,
      exercise.reps,
      secondsPerRep,
      restBetweenSets
    );
    return calculateCaloriesBurned(exercise.metValue, lbsToKg(currentWeight), durationMinutes);
  };
  //Save the workout plan
  const handleSavePlan = async () => {
    if (!planName || !goal || dailySchedules.length === 0 || dailySchedules.every((schedule) => schedule.exercises.length === 0)) {
      Alert.alert('Error', 'Please provide a name, goal, and at least one exercise for a day.');
      return;
    }

    const plan = {
      name: planName,
      goal,
      userWeight: currentWeight,
      estimatedCaloriesBurned: showCalories && currentWeight 
      ? Math.round((isNaN(totalCalories) ? 0: totalCalories) * 100)/100 : undefined,
      dailySchedules: dailySchedules.map(schedule => ({
        ...schedule,
        exercises: schedule.exercises.map(exercise => ({
          ...exercise,
          caloriesBurned: showCalories && currentWeight 
          ? Math.round(calculateCaloriesForExercise(exercise) * 100)/100 : undefined,
        })),
      })),
    };
    try {
      await savePlan(plan);
      Alert.alert('Success', `"${planName}" saved to your workout plans.`);
      clearCurrentPlan();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save your workout plan.');
    }
  };
  //Handle cancellation with confirmation for unsaved changes
  const handleCancel = () => {
    const hasChanges = (
      planName !== '' ||
      goal !== undefined ||
      dailySchedules.length > 0 ||
      selectedMuscles.length > 0
    );

    if(!hasChanges){
      clearCurrentPlan();
      setWeightLbs(defaultWeight);
      setSecondsPerRep(4);
      setRestBetweenSets(60);
      setShowCalories(true);
      setUseDefaultWeight(true);
      setShowAdvancedSettings(false);
      setSelectedDay(0);
      navigation.goBack();
      return;
    }

    Alert.alert('Discard Changes','Are you sure you want to cancel? All unsaved changes will be lost.',
      [
        {text: 'Continue Editing',style: 'cancel'},
        {text: 'Discard',style: 'destructive',
          onPress: () => {
            clearCurrentPlan();
            setWeightLbs(defaultWeight);
            setSecondsPerRep(4);
            setRestBetweenSets(60);
            setShowCalories(true);
            setUseDefaultWeight(true);
            setShowAdvancedSettings(false);
            setSelectedDay(0);
            navigation.goBack();
          },
        },
      ]
    );
  };
  //Render main UI
  return (
    <View style={localStyles.container}>
      <ScrollView
        contentContainerStyle={localStyles.scrollContent}
        showsVerticalScrollIndicator={true}
        alwaysBounceVertical={true}
        nestedScrollEnabled={true}
      >
        <Text style={localStyles.headerTitle}>Create Workout Plan</Text>

        <View style={localStyles.section}>
          <Text style={localStyles.sectionTitle}>1. Basic Information</Text>

          <View style={localStyles.inputGroup}>
            <Text style={globalStyles.label}>Plan Name</Text>
            <TextInput
              style={globalStyles.input}
              value={planName}
              onChangeText={setPlanName}
              placeholder="Name your plan"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={localStyles.inputGroup}>
            <Text style={globalStyles.label}>Your Goal</Text>
            <View style={localStyles.goalContainer}>
              {(['lose', 'maintain', 'gain'] as const).map((option) => (
                <Pressable
                  key={option}
                  style={[localStyles.goalButton, goal === option && localStyles.goalButtonSelected]}
                  onPress={() => setGoal(option)}
                >
                  <Text
                    style={[localStyles.goalButtonText, goal === option && localStyles.goalButtonTextSelected]}
                  >
                    {option === 'lose' ? 'Lose Weight' : option === 'maintain' ? 'Maintain' : 'Gain Muscle'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={localStyles.section}>
          <Text style={localStyles.sectionTitle}>2. Target Muscles</Text>

          <View style={localStyles.inputGroup}>
            <Pressable style={localStyles.muscleSelectButton} onPress={handleSelectedMuscles}>
              <Text style={localStyles.muscleSelectButtonText}>
                {selectedMuscles.length > 0 ? 'Change Selected Muscles' : 'Select Muscle Groups'}
              </Text>
            </Pressable>

            {selectedMuscles.length === 0 ? (
              <Text style={localStyles.musclePromptText}>
                Select muscle groups to choose exercises tailored to your goals.
              </Text>
            ) : (
              <View style={localStyles.selectedMusclesContainer}>
                {selectedMuscles.map((muscle) => (
                  <View key={muscle} style={localStyles.muscleBadge}>
                    <Text style={localStyles.muscleBadgeText}>{muscle}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={localStyles.section}>
          <TouchableOpacity
            style={localStyles.collapsibleHeader}
            onPress={() => setShowAdvancedSettings(!showAdvancedSettings)}
          >
            <Text style={localStyles.sectionTitle}>3. Weight & Calorie Settings</Text>
            <Text style={localStyles.expandCollapseText}>{showAdvancedSettings ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>

          <Collapsible collapsed={!showAdvancedSettings}>
            <View style={localStyles.settingsContainer}>
              <View style={localStyles.settingRow}>
                <Text style={localStyles.settingLabel}>Use Profile Weight</Text>
                <Switch
                  value={useDefaultWeight}
                  onValueChange={setUseDefaultWeight}
                  trackColor={{ false: '#767577', true: theme.colors.primary }}
                />
              </View>

              {!useDefaultWeight && (
                <View style={localStyles.inputGroup}>
                  <Text style={globalStyles.label}>Your Weight (lbs)</Text>
                  <TextInput
                    style={globalStyles.input}
                    value={weightLbs}
                    onChangeText={setWeightLbs}
                    placeholder={`Enter weight (Default: ${defaultWeight || 'Not set'})`}
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>
              )}

              <View style={localStyles.settingRow}>
                <Text style={localStyles.settingLabel}>Show Calorie Estimates</Text>
                <Switch
                  value={showCalories}
                  onValueChange={setShowCalories}
                  trackColor={{ false: '#767577', true: theme.colors.primary }}
                />
              </View>

              {showCalories && currentWeight && (
                <>
                  <TouchableOpacity
                    style={localStyles.presetButton}
                    onPress={() => {
                      if (goal) {
                        const preset = GOAL_PRESETS[goal];
                        setSecondsPerRep(preset.pace);
                        setRestBetweenSets(preset.rest);
                        Alert.alert('Preset Applied', `Pace: ${paceLabel(preset.pace)}, Rest: ${preset.rest}s`);
                      } else {
                        Alert.alert('No Goal Selected', 'Please select a goal first to apply a preset.');
                      }
                    }}
                  >
                    <Text style={localStyles.presetButtonText}>Apply Preset Based on Goal</Text>
                  </TouchableOpacity>

                  <View style={localStyles.inputGroup}>
                    <Text style={globalStyles.label}>Movement Pace</Text>
                    <Slider
                      style={{ width: '100%', height: 40 }}
                      minimumValue={2}
                      maximumValue={6}
                      step={1}
                      value={secondsPerRep}
                      onValueChange={(value) => setSecondsPerRep(value)}
                      minimumTrackTintColor={theme.colors.primary}
                      maximumTrackTintColor="#000000"
                      thumbTintColor={theme.colors.primary}
                    />
                    <Text style={localStyles.sliderDescription}>
                      Pace: <Text style={localStyles.sliderValue}>{paceLabel(secondsPerRep)} ({secondsPerRep}s per rep)</Text>
                    </Text>
                  </View>

                  <View style={localStyles.inputGroup}>
                    <Text style={globalStyles.label}>Rest Between Sets</Text>
                    <Slider
                      style={{ width: '100%', height: 40 }}
                      minimumValue={30}
                      maximumValue={120}
                      step={15}
                      value={restBetweenSets}
                      onValueChange={(value) => setRestBetweenSets(value)}
                      minimumTrackTintColor={theme.colors.primary}
                      maximumTrackTintColor="#000000"
                      thumbTintColor={theme.colors.primary}
                    />
                    <Text style={localStyles.sliderDescription}>
                      Rest: <Text style={localStyles.sliderValue}>{restLabel(restBetweenSets)} ({restBetweenSets}s)</Text>
                    </Text>
                  </View>
                </>
              )}
            </View>
          </Collapsible>
        </View>

        <View style={localStyles.section}>
          <Text style={localStyles.sectionTitle}>4. Schedule Your Exercises</Text>

          <View style={localStyles.daySelectionContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {DAYS_OF_WEEK.map((day, index) => {
                const hasExercises = dailySchedules.some(
                  (schedule) => schedule.day === index && schedule.exercises.length > 0
                );

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      localStyles.dayTab,
                      selectedDay === index && localStyles.activeDayTab,
                      hasExercises && localStyles.dayTabWithExercises,
                    ]}
                    onPress={() => setSelectedDay(index as DayOfWeek)}
                  >
                    <Text
                      style={[localStyles.dayTabText, selectedDay === index && localStyles.activeDayTabText]}
                    >
                      {day.substring(0, 3)}
                    </Text>
                    {hasExercises && <View style={localStyles.exerciseDot} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={localStyles.dayContent}>
            <Text style={localStyles.selectedDayTitle}>{DAYS_OF_WEEK[selectedDay]}</Text>

            <Pressable
              style={[
                localStyles.addExercisesButton,
                selectedMuscles.length === 0 && localStyles.addExercisesButtonDisabled,
              ]}
              onPress={handleSelectedExercises}
              disabled={selectedMuscles.length === 0}
            >
              <Text style={localStyles.addExercisesButtonText}>
                {selectedMuscles.length === 0 ? 'Select muscles first' : 'Add Exercises'}
              </Text>
            </Pressable>

            {(() => {
              const daySchedule = dailySchedules.find((schedule) => schedule.day === selectedDay);
              if(daySchedule && daySchedule.exercises.length > 0){
                return (
                  <View style={localStyles.exercisesContainer}>
                    {daySchedule.exercises.map((exercise) => (
                      <View key={exercise.id} style={localStyles.exerciseCard}>
                        <View style={localStyles.exerciseDetails}>
                          <Text style={localStyles.exerciseName}>{exercise.name}</Text>
                          <Text style={localStyles.exerciseInfo}>
                            {exercise.sets} sets × {exercise.reps} reps
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={localStyles.removeButton}
                          onPress={() => removeExercise(selectedDay, exercise.id)}
                        >
                          <Text style={localStyles.removeButtonText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}

                    {showCalories && currentWeight && (
                      <View style={localStyles.dayCalorieInfo}>
                        <Text style={localStyles.dayCalorieText}>
                          Estimated: ~{Math.round(caloriesByDay[selectedDay] || 0)} calories
                        </Text>
                      </View>
                    )}
                  </View>
                );
              }
              return (
                <View style={localStyles.noExercisesContainer}>
                  <Text style={localStyles.noExercisesText}>
                    No exercises scheduled for {DAYS_OF_WEEK[selectedDay]}
                  </Text>
                </View>
              );
            })()}
          </View>
        </View>

        {dailySchedules.length > 0 && showCalories && currentWeight && (
          <View style={localStyles.weeklySummary}>
            <Text style={localStyles.weeklySummaryTitle}>Weekly Summary</Text>
            <Text style={localStyles.weeklySummaryText}>
              Total calories: ~{isNaN(totalCalories) ? 0:Math.round(totalCalories)} calories
            </Text>
            <Text style={localStyles.weeklyDetailText}>
              {dailySchedules.length} active days ·{' '}
              {dailySchedules.reduce((total, schedule) => total + schedule.exercises.length, 0)}{' '}
              exercises
            </Text>
          </View>
        )}

        <View style={localStyles.actionButtonsContainer}>
          <TouchableOpacity style={localStyles.cancelButton} onPress={handleCancel}>
            <Text style={localStyles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={localStyles.saveButton} onPress={handleSavePlan}>
            <Text style={localStyles.saveButtonText}>Save Workout Plan</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

//Define local styles
const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 80,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.cardBackground || '#fff',
    borderRadius: 12,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandCollapseText: {
    color: theme.colors.primary,
    fontSize: 14,
  },
  goalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalButton: {
    flex: 1,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  goalButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  goalButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  goalButtonTextSelected: {
    color: 'white',
  },
  muscleSelectButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  muscleSelectButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  musclePromptText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  selectedMusclesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
  },
  muscleBadge: {
    backgroundColor: theme.colors.backgroundSecondary || '#e0e0e0',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
    margin: 4,
  },
  muscleBadgeText: {
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  settingsContainer: {
    marginTop: theme.spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  settingLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  pickerContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  presetButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
  },
  presetButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  sliderDescription: {
    marginTop: 6,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  sliderValue: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  daySelectionContainer: {
    marginBottom: theme.spacing.md,
  },
  dayTab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
    backgroundColor: '#f0f0f0',
    minWidth: 70,
    alignItems: 'center',
  },
  activeDayTab: {
    backgroundColor: theme.colors.primary,
  },
  dayTabWithExercises: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  dayTabText: {
    fontWeight: '500',
    color: theme.colors.text,
  },
  activeDayTabText: {
    color: 'white',
  },
  exerciseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent || 'orange',
    marginTop: 4,
  },
  dayContent: {
    padding: theme.spacing.sm,
  },
  selectedDayTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  addExercisesButton: {
    backgroundColor: theme.colors.accent || '#4CAF50',
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  addExercisesButtonDisabled: {
    opacity: 0.6,
  },
  addExercisesButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  exercisesContainer: {
    marginTop: theme.spacing.sm,
  },
  exerciseCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  exerciseInfo: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  noExercisesContainer: {
    padding: theme.spacing.md,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  noExercisesText: {
    color: theme.colors.textSecondary,
  },
  dayCalorieInfo: {
    alignItems: 'flex-end',
    marginTop: theme.spacing.sm,
  },
  dayCalorieText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  weeklySummary: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  weeklySummaryTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  weeklySummaryText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  weeklyDetailText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.success || '#2E7D32',
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.colors.textSecondary || '#757575',
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default CreateWorkoutPlanScreen;
