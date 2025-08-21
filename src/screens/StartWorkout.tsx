import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Alert, StyleSheet, ActivityIndicator, Vibration, Animated, Platform, DimensionValue} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Audio } from 'expo-av';
import { WorkoutStackParamList, WorkoutPlan, Exercise } from '../types/types';
import { styles } from '../styles/styles';
import { theme } from '../styles/theme';
import Checkbox from 'expo-checkbox';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkoutPlan } from '../context/WorkoutPlanContext';
import { useWorkoutHistory } from '../context/WorkoutHistoryContext';
import { useAuth } from '../firebase/AuthContext';

type StartWorkoutRouteProp = RouteProp<WorkoutStackParamList, 'StartWorkout'>;
type StartWorkoutNavigationProp = StackNavigationProp<WorkoutStackParamList, 'StartWorkout'>;

type StartWorkoutProps = {
  route: StartWorkoutRouteProp;
  navigation: StartWorkoutNavigationProp;
};

const DEFAULT_REST_TIME = 60;
const VIBRATION_PATTERN = [0, 300, 100, 300];

//ExerciseItem component to render each exercise with its timer and checkbox
const ExerciseItem = ({
  exercise,
  isCompleted,
  onToggle,
  timer,
  togglePauseTimer,
  stopTimer,
  isWorkoutPaused,
}: {
  exercise: Exercise;
  isCompleted: boolean;
  onToggle: () => void;
  timer: { timeLeft: number; isRunning: boolean };
  togglePauseTimer: () => void;
  stopTimer: () => void;
  isWorkoutPaused: boolean;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  //Animate exercise item when completed 
  useEffect(() => {
    if(isCompleted){
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [isCompleted]);

  return (
    <Animated.View
      style={[localStyles.exerciseContainer, isCompleted && localStyles.completedExercise, { transform: [{ scale: scaleAnim }] }]}
      accessible={true}
      accessibilityLabel={`Exercise ${exercise.name}, ${exercise.sets} sets, ${exercise.reps} reps. ${isCompleted ? 'Completed' : 'Not completed'}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isCompleted }}
      accessibilityHint={isCompleted ? 'Exercise marked as completed' : 'Tap to mark exercise as completed'}
    >
      <View style={localStyles.exerciseRow}>
        <Checkbox
          value={isCompleted}
          onValueChange={onToggle}
          color={isCompleted ? theme.colors.primary : undefined}
          disabled={isWorkoutPaused}
          style={localStyles.checkbox}
        />
        <View style={localStyles.exerciseDetails}>
          <Text style={localStyles.exerciseName}>{exercise.name}</Text>
          <Text style={localStyles.exerciseInfo}>
            {exercise.sets} sets, {exercise.reps} reps
          </Text>
        </View>
      </View>

      {isCompleted && (
        <View style={localStyles.timerContainer}>
          <View style={localStyles.timerDisplay}>
            <FontAwesome5 name="clock" size={14} color={timer.timeLeft === 0 ? theme.colors.success : theme.colors.text}/>
            <Text style={[localStyles.timerText, timer.timeLeft === 0 && localStyles.completedTimer]}>
              {timer.timeLeft === 0 ? 'Rest Complete' : `Rest: ${timer.timeLeft}s`}
            </Text>
          </View>

          <View style={localStyles.timerControls}>
            <Pressable
              style={[localStyles.timerButton, timer.isRunning ? localStyles.pauseButton : localStyles.startButton]}
              onPress={togglePauseTimer}
              disabled={isWorkoutPaused || timer.timeLeft === 0}
              accessibilityLabel={timer.isRunning ? 'Pause rest timer' : 'Start rest timer'}
              accessibilityHint="Controls the rest timer for this exercise"
            >
              <FontAwesome5 name={timer.isRunning ? 'pause' : 'play'} size={12} color="white" />
              <Text style={localStyles.timerButtonText}>{timer.isRunning ? 'Pause' : 'Start'}</Text>
            </Pressable>
            <Pressable
              style={[localStyles.timerButton, localStyles.resetButton]}
              onPress={stopTimer}
              disabled={isWorkoutPaused}
              accessibilityLabel="Reset rest timer"
              accessibilityHint="Resets the rest timer to its initial value"
            >
              <FontAwesome5 name="redo" size={12} color="white" />
              <Text style={localStyles.timerButtonText}>Reset</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Animated.View>
  );
};
//WorkoutStats component to display progress bar and stats
const WorkoutStats = ({ completedCount, totalCount }: { completedCount: number; totalCount: number }) => {
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const progressBarWidth = `${progressPercentage}%`;

  return (
    <View style={localStyles.statsContainer}>
      <View style={localStyles.progressContainer}>
        <View style={localStyles.progressTextContainer}>
          <Text style={localStyles.progressText}>
            Progress: {completedCount} / {totalCount}
          </Text>
          <Text style={localStyles.progressPercentage}>{progressPercentage.toFixed(0)}%</Text>
        </View>
        <View style={localStyles.progressBar}>
          <View style={[localStyles.progressFill, { width: progressBarWidth as DimensionValue }]} />
        </View>
      </View>
    </View>
  );
};
//Main component for this screen
const StartWorkoutScreen = ({ route, navigation }: StartWorkoutProps) => {
  const { planName, completedExercises: initialCompletedExercises = [] } = route.params;
  const { user } = useAuth();
  const { workoutPlans, loading } = useWorkoutPlan();
  const { saveCompletedWorkout, getCompletedWorkoutsForDate } = useWorkoutHistory();
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [completedExercises, setCompletedExercises] = useState<{ [exerciseId: string]: boolean }>({});
  const [timers, setTimers] = useState<{ [exerciseId: string]: { timeLeft: number; isRunning: boolean } }>({});
  const [isWorkoutPaused, setIsWorkoutPaused] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [workoutDuration, setWorkoutDuration] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const timerRefs = useRef<{ [exerciseId: string]: NodeJS.Timeout }>({});
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const insets = useSafeAreaInsets();
  const sound = useRef<Audio.Sound | null>(null);

   //Calculate total calories burned for completed exercises
  const caloriesBurned = useMemo(() => {
    return allExercises
      .filter((ex) => completedExercises[ex.id])
      .reduce((sum, ex) => sum + (ex.caloriesBurned || 0), 0);
  }, [allExercises, completedExercises]);

  const savePartialProgress = useCallback(async () => {
    if(!user || isSaving){
      return;
    }
    setIsSaving(true);
    try{
      await saveCompletedWorkout({
        userId: user.uid,
        completed: false,
        planName,
        duration: workoutDuration,
        date: new Date().toISOString(),
        caloriesBurned,
        completedExercises: Object.keys(completedExercises).filter((id) => completedExercises[id]),
      });
    }catch(error: any){
      console.error('Failed to save partial progress:', error);
    }finally{
      setIsSaving(false);
    }
  }, [user, planName, workoutDuration, completedExercises, caloriesBurned, saveCompletedWorkout]);
  //Load workout plan and initialize state
  useEffect(() => {
    const loadWorkout = async () => {
      if(loading){
        return;
      }

      const plan = workoutPlans.find((p) => p.name === planName) || null;
      setWorkoutPlan(plan);

      if(plan){
        const exercisesFromPlan = plan.dailySchedules.reduce((acc: Exercise[], schedule) => {
          return [...acc, ...schedule.exercises];
        }, []);
        setAllExercises(exercisesFromPlan);

        //Load existing progress
        let initialCompletion: { [exerciseId: string]: boolean } = exercisesFromPlan.reduce(
          (acc, ex) => {
            acc[ex.id] = false;
            return acc;
          },
          {} as { [key: string]: boolean }
        );

        if(initialCompletedExercises.length > 0){
          initialCompletedExercises.forEach((exerciseId) => {
            initialCompletion[exerciseId] = true;
          });
          setIsResuming(true);
        }
        else{
          //Check for existing partial progress
          const today = new Date().toISOString().split('T')[0];
          const completedWorkouts = await getCompletedWorkoutsForDate(user!.uid, today);
          const planWorkout = completedWorkouts.find((w) => w.planName === planName && !w.completed);
          if(planWorkout?.completedExercises?.length){
            planWorkout.completedExercises.forEach((exerciseId) => {
              initialCompletion[exerciseId] = true;
            });
            setIsResuming(true);
          }
        }
        setCompletedExercises(initialCompletion);
        const initialTimers = exercisesFromPlan.reduce((acc, ex) => {
          acc[ex.id] = { timeLeft: DEFAULT_REST_TIME, isRunning: false };
          return acc;
        }, {} as { [key: string]: { timeLeft: number; isRunning: boolean } });
        setTimers(initialTimers);
        setWorkoutStartTime(new Date());
        startDurationTimer();
      } 
      else{
        Alert.alert('Error', `Workout plan "${planName}" not found.`);
      }
    };

    if(user){
      loadWorkout();
    }
  }, [planName, workoutPlans, loading, user, initialCompletedExercises]);
  //Start duration timer for tracking workout time
  const startDurationTimer = () => {
    if(durationTimerRef.current){
      clearInterval(durationTimerRef.current);
    }
    durationTimerRef.current = setInterval(() => {
      if(workoutStartTime){
        const now = new Date();
        const seconds = Math.floor((now.getTime() - workoutStartTime.getTime()) / 1000);
        setWorkoutDuration(seconds);
      }
    }, 1000);
  };
  //Format duration in MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  //Cleanup timers and audio on component unmount
  useEffect(() => {
    return () => {
      Object.values(timerRefs.current).forEach((timer) => clearInterval(timer));
      if(durationTimerRef.current){
        clearInterval(durationTimerRef.current);
      }
      if (sound.current) {
        sound.current.unloadAsync();
      }
    };
  }, []);
  //Toggle workout pause state
  const toggleWorkoutPause = useCallback(() => {
    setIsWorkoutPaused((prev) => {
      const newPausedState = !prev;
      if(newPausedState){
        Object.keys(timers).forEach((exerciseId) => {
          if(timers[exerciseId].isRunning){
            clearInterval(timerRefs.current[exerciseId]);
          }
        });
        if(durationTimerRef.current){
          clearInterval(durationTimerRef.current);
        }
        savePartialProgress();
      } 
      else{
        Object.keys(timers).forEach((exerciseId) => {
          if(completedExercises[exerciseId] && timers[exerciseId].timeLeft > 0 && timers[exerciseId].isRunning){
            startTimer(exerciseId);
          }
        });
        startDurationTimer();
      }
      return newPausedState;
    });
  }, [timers, completedExercises, savePartialProgress]);
  //Toggle exercise completion status
  const toggleExercise = useCallback(
    (exerciseId: string) => {
      if(isWorkoutPaused){
        return;
      }
      setCompletedExercises((prev) => {
        const isNowCompleted = !prev[exerciseId];
        if(isNowCompleted){
          startTimer(exerciseId);
          Vibration.vibrate(100);
          savePartialProgress();
        } 
        else{
          stopTimer(exerciseId);
        }
        return { ...prev, [exerciseId]: isNowCompleted };
      });
    },
    [isWorkoutPaused, savePartialProgress]
  );
  //Start the rest timer for an exericse
  const startTimer = useCallback(
    (exerciseId: string) => {
      if(isWorkoutPaused){
        return;
      }
      stopTimer(exerciseId);
      setTimers((prev) => ({
        ...prev,
        [exerciseId]: { ...prev[exerciseId], isRunning: true },
      }));
      timerRefs.current[exerciseId] = setInterval(() => {
        setTimers((prev) => {
          const currentTime = prev[exerciseId].timeLeft;
          if(currentTime <= 1){
            clearInterval(timerRefs.current[exerciseId]);
            Vibration.vibrate(VIBRATION_PATTERN);
            return {
              ...prev,
              [exerciseId]: { timeLeft: 0, isRunning: false },
            };
          }
          return {
            ...prev,
            [exerciseId]: { timeLeft: currentTime - 1, isRunning: true },
          };
        });
      }, 1000);
    },
    [isWorkoutPaused]
  );
  //Stop rest timer
  const stopTimer = useCallback((exerciseId: string) => {
    if (timerRefs.current[exerciseId]) {
      clearInterval(timerRefs.current[exerciseId]);
      delete timerRefs.current[exerciseId];
    }
    setTimers((prev) => ({
      ...prev,
      [exerciseId]: { timeLeft: DEFAULT_REST_TIME, isRunning: false },
    }));
  }, []);

  const togglePauseTimer = useCallback(
    (exerciseId: string) => {
      if (isWorkoutPaused) return;
      setTimers((prev) => {
        const isRunning = prev[exerciseId].isRunning;
        if (isRunning) {
          clearInterval(timerRefs.current[exerciseId]);
        } else if (prev[exerciseId].timeLeft > 0) {
          startTimer(exerciseId);
        }
        return {
          ...prev,
          [exerciseId]: { ...prev[exerciseId], isRunning: !isRunning },
        };
      });
    },
    [isWorkoutPaused, startTimer]
  );

  const isWorkoutComplete = useMemo(() => {
    return allExercises.every((ex) => completedExercises[ex.id]);
  }, [allExercises, completedExercises]);
  //Get number of completed exercises
  const completedCount = useMemo(() => {
    return Object.values(completedExercises).filter(Boolean).length;
  }, [completedExercises]);
  //Handle workout completion
  const handleFinishWorkout = useCallback(() => {
    if (isSaving) return;

    const totalTime = workoutDuration;
    const formattedTime = formatDuration(totalTime);
    const workoutDate = new Date().toISOString();

    const saveAndNavigate = async (completed: boolean) => {
      if (!user) {
        Alert.alert('Error', 'No user signed in.');
        return;
      }

      setIsSaving(true);
      try {
        await saveCompletedWorkout({
          userId: user.uid,
          completed,
          planName,
          duration: totalTime,
          date: workoutDate,
          caloriesBurned,
          completedExercises: Object.keys(completedExercises).filter((id) => completedExercises[id]),
        });
        navigation.navigate('WorkoutHistory', {
          completed,
          planName,
          duration: totalTime,
          date: workoutDate,
        });
      } catch (error: any) {
        Alert.alert(
          'Error',
          error.code === 'permission-denied'
            ? 'You do not have permission to save this workout.'
            : error.code === 'unavailable'
            ? 'Network error. Please check your connection and try again.'
            : 'Failed to save workout. Please try again.'
        );
      } finally {
        setIsSaving(false);
      }
    };

    if(isWorkoutComplete){
      Alert.alert('Workout Complete!',`Great job! You completed "${planName}" in ${formattedTime}.`,
        [
          { text: 'Save Results', onPress: () => saveAndNavigate(true) },
          { text: 'Back to Workouts', style: 'cancel', onPress: () => navigation.goBack() }
        ]
      );
    } 
    else{
      Alert.alert('Workout Incomplete', "You haven't finished all exercises. Do you want to save this as an incomplete workout?",
        [
          { text: 'Continue Workout', style: 'cancel' },
          { text: 'Save as Incomplete', onPress: () => saveAndNavigate(false) },
        ]
      );
    }
  }, [
    isSaving,
    workoutDuration,
    planName,
    caloriesBurned,
    isWorkoutComplete,
    navigation,
    saveCompletedWorkout,
    user,
  ]);
  //Render loading state
  if(loading){
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.text}>Loading workout plan...</Text>
      </View>
    );
  }
  //Render error state if no workout plan found
  if(!workoutPlan){
    return (
      <View style={[styles.container, styles.centered]}>
        <FontAwesome5 name="exclamation-circle" size={24} color={theme.colors.error} />
        <Text style={styles.text}>No workout plan found for "{planName}"</Text>
        <Pressable style={[styles.button, { marginTop: 20 }]} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={localStyles.headerContainer}>
        <View style={localStyles.titleContainer}>
          <Text style={styles.sectionTitle}>{planName}</Text>
          <View style={localStyles.durationContainer}>
            <FontAwesome5 name="stopwatch" size={16} color={theme.colors.text} />
            <Text style={localStyles.durationText}>{formatDuration(workoutDuration)}</Text>
          </View>
          {isResuming && (
            <Text style={localStyles.resumeText}>Resuming in-progress workout</Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            style={[
              localStyles.workoutPauseButton,
              isWorkoutPaused && localStyles.resumeButton,
            ]}
            onPress={toggleWorkoutPause}
            accessibilityLabel={isWorkoutPaused ? 'Resume workout' : 'Pause workout'}
            accessibilityHint="Pauses or resumes the entire workout session"
          >
            <FontAwesome5
              name={isWorkoutPaused ? 'play' : 'pause'}
              size={14}
              color="white"
              style={localStyles.buttonIcon}
            />
            <Text style={localStyles.pauseButtonText}>{isWorkoutPaused ? 'Resume' : 'Pause'}</Text>
          </Pressable>
          <Pressable
            style={[localStyles.workoutPauseButton, { marginLeft: theme.spacing.sm }]}
            onPress={() => {
              const newCompleted = Object.fromEntries(allExercises.map((ex) => [ex.id, true]));
              setCompletedExercises(newCompleted);
              const newTimers = Object.fromEntries(
                allExercises.map((ex) => [ex.id, { timeLeft: 0, isRunning: false }])
              );
              setTimers(newTimers);
            }}
            disabled={isWorkoutPaused}
            accessibilityLabel="Mark all exercises as completed"
            accessibilityHint="Marks all exercises in this workout as completed"
          >
            <FontAwesome5 name="check" size={14} color="white" style={localStyles.buttonIcon} />
            <Text style={localStyles.pauseButtonText}>Complete All</Text>
          </Pressable>
        </View>
      </View>

      <WorkoutStats completedCount={completedCount} totalCount={allExercises.length} />

      <ScrollView contentContainerStyle={localStyles.scrollContainer} showsVerticalScrollIndicator={false}>
        {allExercises.map((exercise, index) => (
          <ExerciseItem
            key={`${exercise.id}-${index}`}
            exercise={exercise}
            isCompleted={completedExercises[exercise.id] || false}
            onToggle={() => toggleExercise(exercise.id)}
            timer={timers[exercise.id]}
            togglePauseTimer={() => togglePauseTimer(exercise.id)}
            stopTimer={() => stopTimer(exercise.id)}
            isWorkoutPaused={isWorkoutPaused}
          />
        ))}
        <View style={localStyles.spacer} />
      </ScrollView>

      <View style={localStyles.bottomContainer}>
        <Pressable
          style={[
            localStyles.finishButton,
            isWorkoutComplete ? localStyles.completeButton : localStyles.incompleteButton,
            isSaving && localStyles.disabledButton,
          ]}
          onPress={handleFinishWorkout}
          disabled={isSaving}
          accessibilityLabel="Finish workout"
          accessibilityHint={isWorkoutComplete ? 'Save and complete the workout' : 'End and save as incomplete'}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <FontAwesome5
              name={isWorkoutComplete ? 'check-circle' : 'flag'}
              size={16}
              color="white"
              style={localStyles.buttonIcon}
            />
          )}
          <Text style={localStyles.finishButtonText}>
            {isSaving ? 'Saving...' : isWorkoutComplete ? 'Complete Workout' : 'End Workout'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  durationText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  resumeText: {
    fontSize: 14,
    color: theme.colors.accent,
    marginTop: theme.spacing.xs,
  },
  workoutPauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.secondary,
    borderRadius: 8,
  },
  resumeButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonIcon: {
    marginRight: theme.spacing.xs,
  },
  pauseButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  progressContainer: {
    width: '100%',
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  progressText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.textSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  scrollContainer: {
    padding: theme.spacing.md,
  },
  exerciseContainer: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  completedExercise: {
    borderColor: theme.colors.success,
    borderLeftWidth: 4,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    borderRadius: 4,
    margin: theme.spacing.xs,
  },
  exerciseDetails: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  exerciseInfo: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  timerContainer: {
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  timerText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
    marginLeft: theme.spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  completedTimer: {
    color: theme.colors.success,
  },
  timerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 6,
    minWidth: 80,
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: theme.colors.success,
  },
  pauseButton: {
    backgroundColor: theme.colors.secondary,
  },
  resetButton: {
    backgroundColor: theme.colors.textSecondary,
  },
  timerButtonText: {
    color: 'white',
    fontSize: 14,
    marginLeft: theme.spacing.xs,
  },
  bottomContainer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: 'white',
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
  },
  completeButton: {
    backgroundColor: theme.colors.success,
  },
  incompleteButton: {
    backgroundColor: theme.colors.secondary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  finishButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  spacer: {
    height: 60,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StartWorkoutScreen;
