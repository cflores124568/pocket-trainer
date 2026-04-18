import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, FlatList, Alert, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WorkoutStackParamList, WorkoutPlan } from '../types/types';
import { useWorkoutPlan } from '../context/WorkoutPlanContext';
import { useWorkoutHistory } from '../context/WorkoutHistoryContext';
import { useAuth } from '../firebase/AuthContext';
import { styles as globalStyles } from '../styles/styles';
import { theme } from '../styles/theme';
import { MaterialIcons } from '@expo/vector-icons';
import Collapsible from 'react-native-collapsible';

type ViewWorkoutPlansNavigationProp = StackNavigationProp<WorkoutStackParamList, 'ViewWorkoutPlans'>;

type ViewWorkoutPlansProps = {
  navigation: ViewWorkoutPlansNavigationProp;
};

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ViewWorkoutPlansScreen = ({ navigation }: ViewWorkoutPlansProps) => {
  const { workoutPlans, deletePlan, loading } = useWorkoutPlan();
  const { getCompletedWorkoutsForDate } = useWorkoutHistory();
  const { user } = useAuth();
  //Track which plan cards are expanded/collapsed
  const [collapsedPlans, setCollapsedPlans] = useState<{ [key: string]: boolean }>({});
  //Track today's workout progress for each plan
  const [completionStatus, setCompletionStatus] = useState<{[key: string]: { completed: boolean; partial: boolean; completedExercises: string[]; totalExercises: number }}>({});
  //Show loading spinner on the specific plan being deleted
  const [deleting, setDeleting] = useState<string | null>(null);

  // Check today's workout progress for all plans when screen loads
  useEffect(() => {
    if(!user){
      return;
    }

    const fetchCompletionStatus = async () => {
      const today = new Date().toISOString().split('T')[0];
      const status: {[key: string]: { completed: boolean; partial: boolean; completedExercises: string[]; totalExercises: number }} = {};
      const getWorkoutSortTime = (date: string, createdAt: any) => {
        if (createdAt?.toDate) return createdAt.toDate().getTime();
        return new Date(date).getTime();
      };
      
      for(const plan of workoutPlans){
        const workoutsForToday = await getCompletedWorkoutsForDate(user.uid, today);
        const latestPlanWorkout = workoutsForToday
          .filter((w) => w.planName === plan.name)
          .sort((a, b) => getWorkoutSortTime(b.date, b.createdAt) - getWorkoutSortTime(a.date, a.createdAt))[0];
        
        // Calculate total exercises across all days in this plan
        const totalExercises = plan.dailySchedules.reduce(
          (sum, schedule) => sum + schedule.exercises.length,
          0
        );
        
        status[plan.id] = {
          completed: !!latestPlanWorkout?.completed, // Fully finished today
          partial: !!latestPlanWorkout && !latestPlanWorkout.completed, // Started but not finished
          completedExercises: latestPlanWorkout?.completedExercises || [],
          totalExercises,
        };
      }
      setCompletionStatus(status);
    };
    
    fetchCompletionStatus();
  }, [user, workoutPlans, getCompletedWorkoutsForDate]);

  const toggleCollapse = (planId: string) => {
    setCollapsedPlans((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  const handleStartWorkout = (planName: string, completedExercises: string[]) => {
    // Pass completed exercises so user can resume where they left off
    navigation.navigate('StartWorkout', { planName, completedExercises });
  };

  const handleEditPlan = (plan: WorkoutPlan) => {
    navigation.navigate('EditWorkoutPlan', { plan });
  };

  const handleDeletePlan = async (planId: string, planName: string) => {
    // Show confirmation dialog before deleting
    Alert.alert('Delete Workout Plan', `Are you sure you want to delete "${planName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(planId); // Show spinner on this plan
          try {
            await deletePlan(planId);
            Alert.alert('Success', `"${planName}" has been deleted.`);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete workout plan.');
          } finally {
            setDeleting(null); // Hide spinner
          }
        },
      },
    ]);
  };

  // Render each workout plan card
  const renderWorkoutPlan = ({ item }: { item: WorkoutPlan }) => {
    if (!item) return null;
    
    const schedules = item.dailySchedules || [];
    const status = completionStatus[item.id] || {
      completed: false,
      partial: false,
      completedExercises: [],
      totalExercises: 0,
    };
    const isCollapsed = collapsedPlans[item.id] || false;

    return (
      <View style={localStyles.planContainer}>
        {/* Tappable header to expand/collapse plan details */}
        <TouchableOpacity
          style={localStyles.collapsibleHeader}
          onPress={() => toggleCollapse(item.id)}
          accessibilityLabel={`Toggle details for ${item.name}`}
        >
          <View style={localStyles.planHeader}>
            <Text style={localStyles.planName}>{item.name}</Text>
            {/* Show progress if workout is partially completed today */}
            {status.partial && (
              <Text style={localStyles.progressText}>
                {status.completedExercises.length}/{status.totalExercises} exercises completed
              </Text>
            )}
          </View>
          <Text style={localStyles.expandCollapseText}>{isCollapsed ? 'Show' : 'Hide'}</Text>
        </TouchableOpacity>

        {/* Collapsible section showing plan details */}
        <Collapsible collapsed={isCollapsed}>
          <View style={localStyles.planDetailsContainer}>
            <Text style={localStyles.planDetail}>Goal: {item.goal || 'Not specified'}</Text>
            {/* Show what exercises are scheduled for each day */}
            {schedules.length > 0 ? (
              schedules.map((schedule) => (
                <Text key={schedule.day.toString()} style={localStyles.planDetail}>
                  {DAYS_OF_WEEK[schedule.day]}: {schedule.exercises.length} exercises (
                  {schedule.exercises.map((ex) => ex.name).join(', ') || 'None'})
                </Text>
              ))
            ) : (
              <Text style={localStyles.planDetail}>No exercises scheduled.</Text>
            )}
          </View>
        </Collapsible>

        {/* Action buttons for each plan */}
        <View style={localStyles.buttonContainer}>
          {/* Start/Resume/Completed button - changes based on today's progress */}
          <Pressable
            style={({ pressed }) => [
              localStyles.actionButton,
              status.completed ? localStyles.completedButton: status.partial ? localStyles.partialButton: localStyles.startButton,
              pressed && localStyles.buttonPressed
            ]}
            onPress={() => handleStartWorkout(item.name, status.completedExercises)}
            accessibilityLabel={
              status.completed ? 'Workout completed': status.partial ? 'Resume workout': 'Start workout'
            }
            disabled={status.completed || deleting === item.id}
          >
            <MaterialIcons
              name={status.completed ? 'check-circle' : status.partial ? 'hourglass-top' : 'play-arrow'}
              size={20}
              color="white"
            />
            <Text style={localStyles.actionButtonText}>
              {status.completed ? 'Completed' : status.partial ? 'Resume' : 'Start'}
            </Text>
          </Pressable>
          
          {/* Edit plan button */}
          <Pressable
            style={({ pressed }) => [
              localStyles.actionButton,
              localStyles.editButton,
              pressed && localStyles.buttonPressed,
              deleting === item.id && localStyles.disabledButton,
            ]}
            onPress={() => handleEditPlan(item)}
            accessibilityLabel="Edit workout plan"
            disabled={deleting === item.id}
          >
            <MaterialIcons name="edit" size={20} color="white" />
            <Text style={localStyles.actionButtonText}>Edit</Text>
          </Pressable>
          
          {/* Delete plan button with loading spinner */}
          <Pressable
            style={({ pressed }) => [
              localStyles.actionButton,
              localStyles.deleteButton,
              pressed && localStyles.buttonPressed,
              deleting === item.id && localStyles.disabledButton,
            ]}
            onPress={() => handleDeletePlan(item.id, item.name)}
            accessibilityLabel="Delete workout plan"
            disabled={deleting === item.id}
          >
            {deleting === item.id ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialIcons name="delete" size={20} color="white" />
            )}
            <Text style={localStyles.actionButtonText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  // Redirect to sign in if user is not authenticated
  if (!user) {
    return (
      <View style={globalStyles.container}>
        <Text style={globalStyles.label}>Please sign in to view workout plans.</Text>
        <Pressable
          style={globalStyles.button}
          onPress={() => {
            const rootNavigation = navigation.getParent()?.getParent() as any;
            rootNavigation?.navigate('Auth', { screen: 'Login' });
          }}
          accessibilityLabel="Sign in"
        >
          <Text style={globalStyles.buttonText}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  // Show loading screen while plans are being fetched
  if (loading) {
    return (
      <View style={globalStyles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={globalStyles.label}>Loading workout plans...</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.sectionTitle}>Your Workout Plans</Text>
      {workoutPlans.length === 0 ? (
        <Text style={globalStyles.label}>No workout plans found.</Text>
      ) : (
        <FlatList
          data={workoutPlans}
          renderItem={renderWorkoutPlan}
          keyExtractor={(item) => item.id}
          contentContainerStyle={localStyles.listContainer}
        />
      )}
      
      {/* Create new plan button */}
      <Pressable
        style={globalStyles.button}
        onPress={() => navigation.navigate('CreateWorkoutPlan', {})}
        accessibilityLabel="Create new workout plan"
      >
        <MaterialIcons name="add" size={20} color="white" style={{ marginRight: theme.spacing.xs }} />
        <Text style={globalStyles.buttonText}>Create New Plan</Text>
      </Pressable>
    </View>
  );
};

const localStyles = StyleSheet.create({
  planContainer: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: 12,
    backgroundColor: theme.colors.backgroundSecondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  planHeader: {
    flex: 1,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  expandCollapseText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  planDetailsContainer: {
    marginBottom: theme.spacing.sm,
  },
  planDetail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 8,
    marginLeft: theme.spacing.sm,
  },
  startButton: {
    backgroundColor: theme.colors.primary,
  },
  partialButton: {
    backgroundColor: theme.colors.accent || '#FFB300',
  },
  completedButton: {
    backgroundColor: theme.colors.success || '#2E7D32',
  },
  editButton: {
    backgroundColor: theme.colors.accent || '#4CAF50',
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  listContainer: {
    paddingBottom: theme.spacing.lg,
  },
});

export default ViewWorkoutPlansScreen;
