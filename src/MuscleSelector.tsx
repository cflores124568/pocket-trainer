import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WorkoutStackParamList, MuscleGroup } from '../types/types';
import { styles } from '../styles/styles';
import { theme } from '../styles/theme';

//Define navigation prop type
type MuscleSelectorNavigationProp = StackNavigationProp<WorkoutStackParamList, 'MuscleSelector'>;

type MuscleSelectorProps = {
  navigation: MuscleSelectorNavigationProp;
}

//Main component for muscle group selection
const MuscleSelectorScreen = ({ navigation }: MuscleSelectorProps) => {
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([]);

  //Define available muscle groups
  const muscleGroups: MuscleGroup[] = [
    MuscleGroup.Abs,
    MuscleGroup.Chest,
    MuscleGroup.Biceps,
    MuscleGroup.Forearms,
    MuscleGroup.Deltoids,
    MuscleGroup.Quadriceps,
    MuscleGroup.Calves,
    MuscleGroup.Lats,
    MuscleGroup.Glutes,
    MuscleGroup.Triceps,
    MuscleGroup.Hamstrings,
    MuscleGroup.UpperTraps,
    MuscleGroup.LowerTraps,
    MuscleGroup.Traps,
    MuscleGroup.LowerBack,
  ];

  //Toggle muscle group selection
  const toggleMuscle = (muscle: MuscleGroup) => {
    setSelectedMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle): [...prev, muscle]
    );
  };

  //Navigate back with selected muscles
  const handleDone = () => {
    navigation.navigate('CreateWorkoutPlan', { selectedMuscles });
  };

  //Render UI
  return (
    <ScrollView contentContainerStyle={[styles.container,styles.section]}>
      <View>
        <Text style={styles.sectionTitle}>Select Muscle Groups</Text>
        {muscleGroups.map((muscle) => (
          <Pressable
            key={muscle}
            style={[
              styles.button,
              selectedMuscles.includes(muscle) && localStyles.selectedButton,
            ]}
            onPress={() => toggleMuscle(muscle)}
          >
            <Text style={[styles.buttonText, selectedMuscles.includes(muscle) && localStyles.selectedButtonText]}>
              {muscle}
            </Text>
          </Pressable>
        ))}
        <Pressable style={styles.saveButton} onPress={handleDone}>
          <Text style={styles.saveButtonText}>Done</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

//Define local styles
const localStyles = StyleSheet.create({
  selectedButton: {
    backgroundColor: theme.colors.primary,
  },
  selectedButtonText: {
    color: 'white',
  },
});

export default MuscleSelectorScreen;
