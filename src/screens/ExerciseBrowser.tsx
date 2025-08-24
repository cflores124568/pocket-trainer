import React, { useState, useMemo } from 'react';
import {View,Text,ScrollView, StyleSheet, TextInput, TouchableOpacity} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WorkoutStackParamList, MuscleGroup, Exercise } from '../types/types';
import exercises from '../data/ExercisesWithCalories'; 
import { theme } from '../styles/theme';
import { useWorkoutPlan } from '../context/WorkoutPlanContext';

type ExerciseBrowserRouteProp = RouteProp<WorkoutStackParamList, 'ExerciseBrowser'>;
type ExerciseBrowserNavigationProp = StackNavigationProp<WorkoutStackParamList, 'ExerciseBrowser'>;

type ExerciseBrowserProps = {
  route: ExerciseBrowserRouteProp;
  navigation: ExerciseBrowserNavigationProp;
}

//Group type for categorized exercises
type ExerciseGroup = {
  title: string;
  data: Exercise[];
}

const ExerciseBrowserScreen = ({ route, navigation }: ExerciseBrowserProps) => {
  const { selectedMuscles, selectedDay } = route.params;
  const {dailySchedules, setDailySchedules} = useWorkoutPlan();
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'primary' | 'secondary'>('all');

  //Filter exercises based on selected muscles and search query
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      //Filter by muscle groups based on view mode
      const muscleMatch = 
        viewMode === 'all' ? (
          selectedMuscles.some(m => 
            ex.primaryMuscles.includes(m) || ex.secondaryMuscles.includes(m)
          )
        ) : viewMode === 'primary' ? (
          selectedMuscles.some(m => ex.primaryMuscles.includes(m))
        ) : (
          selectedMuscles.some(m => ex.secondaryMuscles.includes(m))
        );
      
      //Filter by search query
      const searchMatch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      return muscleMatch && searchMatch;
    });
  }, [selectedMuscles, searchQuery, viewMode]);

  //Group exercises by primary muscle group for better organization
  const groupedExercises = useMemo(() => {
    const groups: ExerciseGroup[] = [];
    const seenExerciseIds = new Set<string>();
    
    //Helper to get unique muscle groups
    const getUniqueMuscles = (exercises: Exercise[]): MuscleGroup[] => {
      const allMuscles = exercises.flatMap(ex => [...ex.primaryMuscles]);
      return [...new Set(allMuscles)] as MuscleGroup[];
    };
    
    //Get unique muscle groups from filtered exercises
    const uniqueMuscles = getUniqueMuscles(filteredExercises);
    
    //Create a group for each muscle
    uniqueMuscles.forEach(muscle => {
      const muscleExercises = filteredExercises.filter(ex => 
        ex.primaryMuscles.includes(muscle) && !seenExerciseIds.has(ex.id)
      );
      
      if(muscleExercises.length > 0){
        muscleExercises.forEach(ex => seenExerciseIds.add(ex.id));
        groups.push({
          title: muscle,
          data: muscleExercises
        });
      }
    });
    
    // Add a group for exercises that don't match by primary muscle but by secondary
    const secondaryOnlyExercises = filteredExercises.filter(ex => 
      !seenExerciseIds.has(ex.id)
    );
    
    if(secondaryOnlyExercises.length > 0){
      groups.push({
        title: 'Other Related Exercises',
        data: secondaryOnlyExercises
      });
    }
    
    return groups;
  }, [filteredExercises]);

  const toggleExercise = (exercise: Exercise) => {
    setSelectedExercises(prev =>
      prev.some(e => e.id === exercise.id)
        ? prev.filter(e => e.id !== exercise.id)
        : [...prev, exercise]
    );
  };

  const isExerciseSelected = (exerciseId: string) => {
    return selectedExercises.some(e => e.id === exerciseId);
  };

  const handleDone = () => {
    if (selectedExercises.length === 0){
      navigation.goBack();
      return;
    }

    setDailySchedules((prev) => {
      const newExercises = selectedExercises.filter(
        (ex) => !prev.some((schedule) => schedule.day === selectedDay && schedule.exercises.some((e) => e.id === ex.id))
      );
      const updatedSchedules = [...prev];
      const daySchedule = updatedSchedules.find((schedule) => schedule.day === selectedDay);
      if(daySchedule){
        daySchedule.exercises = [...daySchedule.exercises, ...newExercises];
      }
      else{
        updatedSchedules.push({day: selectedDay, exercises: newExercises});
      }
      return updatedSchedules;
    });
    navigation.goBack();
  };

  //Determine which muscles are selected as primary vs secondary
  const getMuscleTypeInfo = (exercise: Exercise) => {
    const primaryMatches = selectedMuscles.filter(m => 
      exercise.primaryMuscles.includes(m)
    );
    
    const secondaryMatches = selectedMuscles.filter(m => 
      exercise.secondaryMuscles.includes(m)
    );
    
    return { primaryMatches, secondaryMatches };
  };

  //Render a single exercise item
  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    const { primaryMatches, secondaryMatches } = getMuscleTypeInfo(item);
    const isSelected = isExerciseSelected(item.id);
    
    return (
      <TouchableOpacity
        style={[
          localStyles.exerciseCard,
          isSelected && localStyles.selectedExerciseCard
        ]}
        onPress={() => toggleExercise(item)}
        activeOpacity={0.7}
      >
        <View style={localStyles.exerciseInfo}>
          <Text style={localStyles.exerciseName}>{item.name}</Text>
          <Text style={localStyles.exerciseDetail}>{item.sets} sets × {item.reps} reps</Text>
          
          {/* Muscle targeting badges */}
          <View style={localStyles.muscleBadgesContainer}>
            {primaryMatches.length > 0 && (
              <View style={localStyles.primaryMuscleBadge}>
                <Text style={localStyles.muscleBadgeText}>
                  Primary: {primaryMatches.join(', ')}
                </Text>
              </View>
            )}
            
            {secondaryMatches.length > 0 && (
              <View style={localStyles.secondaryMuscleBadge}>
                <Text style={localStyles.muscleBadgeText}>
                  Secondary: {secondaryMatches.join(', ')}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={localStyles.selectIndicator}>
          {isSelected ? (
            <View style={localStyles.selectedIndicator}>
              <Text style={localStyles.selectedIndicatorText}>✓</Text>
            </View>
          ) : (
            <View style={localStyles.unselectedIndicator} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={localStyles.container}>
      <View style={localStyles.header}>
        <Text style={localStyles.headerTitle}>Select Exercises</Text>
        <Text style={localStyles.selectedCount}>
          {selectedExercises.length} selected
        </Text>
      </View>
      
      {/*Search Box for exercises */}
      <View style={localStyles.searchContainer}>
        <TextInput
          style={localStyles.searchInput}
          placeholder="Search exercises..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>
      
      {/*Tabs to filter exercises by muscle group */}
      <View style={localStyles.filterTabs}>
        <TouchableOpacity
          style={[
            localStyles.filterTab,
            viewMode === 'all' && localStyles.activeFilterTab
          ]}
          onPress={() => setViewMode('all')}
        >
          <Text style={[
            localStyles.filterTabText,
            viewMode === 'all' && localStyles.activeFilterTabText
          ]}>
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            localStyles.filterTab,
            viewMode === 'primary' && localStyles.activeFilterTab
          ]}
          onPress={() => setViewMode('primary')}
        >
          <Text style={[
            localStyles.filterTabText,
            viewMode === 'primary' && localStyles.activeFilterTabText
          ]}>
            Primary
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            localStyles.filterTab,
            viewMode === 'secondary' && localStyles.activeFilterTab
          ]}
          onPress={() => setViewMode('secondary')}
        >
          <Text style={[
            localStyles.filterTabText,
            viewMode === 'secondary' && localStyles.activeFilterTabText
          ]}>
            Secondary
          </Text>
        </TouchableOpacity>
      </View>
      
      {/*Selected Muscles Summary*/}
      <View style={localStyles.selectedMusclesSummary}>
        <Text style={localStyles.selectedMusclesLabel}>Target muscles:</Text>
        <Text style={localStyles.selectedMusclesText}>
          {selectedMuscles.join(', ')}
        </Text>
      </View>
      
      {/*Exercise List */}
      <ScrollView style={localStyles.exercisesList}>
        {groupedExercises.length > 0 ? (
          groupedExercises.map((group) => (
            <View key={group.title} style={localStyles.exerciseGroup}>
              <Text style={localStyles.groupTitle}>{group.title}</Text>
              
              {group.data.map((exercise) => (
                <React.Fragment key={exercise.id}>
                  {renderExerciseItem({ item: exercise })}
                </React.Fragment>
              ))}
            </View>
          ))
        ) : (
          <View style={localStyles.noResults}>
            <Text style={localStyles.noResultsText}>
              No exercises found for the selected criteria.
            </Text>
          </View>
        )}
      </ScrollView>
      
      {/*Action buttons for canceling or saving selections*/}
      <View style={localStyles.actionBar}>
        <TouchableOpacity
          style={localStyles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={localStyles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            localStyles.doneButton,
            selectedExercises.length === 0 && localStyles.disabledButton
          ]}
          onPress={handleDone}
          disabled={selectedExercises.length === 0}
        >
          <Text style={localStyles.doneButtonText}>
            Add {selectedExercises.length > 0 ? `(${selectedExercises.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  selectedCount: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: theme.spacing.sm,
    fontSize: 16,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  filterTab: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginRight: theme.spacing.sm,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  activeFilterTab: {
    backgroundColor: theme.colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  activeFilterTabText: {
    color: 'white',
    fontWeight: '500',
  },
  selectedMusclesSummary: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
  },
  selectedMusclesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginRight: theme.spacing.xs,
  },
  selectedMusclesText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  exercisesList: {
    flex: 1,
  },
  exerciseGroup: {
    marginBottom: theme.spacing.md,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  exerciseCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    borderRadius: 8,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedExerciseCard: {
    backgroundColor: 'rgba(33, 150, 243, 0.08)', //Light blue background for selected items
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  exerciseDetail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  muscleBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  primaryMuscleBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)', //Light green background
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  secondaryMuscleBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.15)', //Light orange background
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  muscleBadgeText: {
    fontSize: 12,
    color: theme.colors.text,
  },
  selectIndicator: {
    justifyContent: 'center',
    paddingLeft: theme.spacing.sm,
  },
  unselectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicatorText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noResults: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: 'white',
  },
  cancelButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: theme.colors.text,
    fontWeight: '500',
  },
  doneButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    marginLeft: theme.spacing.md,
  },
  disabledButton: {
    opacity: 0.5,
  },
  doneButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ExerciseBrowserScreen;
