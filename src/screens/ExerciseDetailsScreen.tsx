import React, { useState } from 'react';
import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons} from '@expo/vector-icons';
import YouTube from 'react-native-youtube-iframe';
import { WorkoutStackParamList, Exercise, MuscleGroup } from '../types/types';
import { theme } from '../styles/theme';
import { styles } from '../styles/styles';
import exercises from '../data/Exercises';
import { useWorkoutPlan } from '../context/WorkoutPlanContext';

type ExerciseDetailScreenRouteProp = RouteProp<WorkoutStackParamList, 'ExerciseDetails'>;
type ExerciseDetailScreenNavigationProp = StackNavigationProp<WorkoutStackParamList, 'ExerciseDetails'>;

type ExerciseDetailProps = {
  route: ExerciseDetailScreenRouteProp;
  navigation: ExerciseDetailScreenNavigationProp;
};

const ExerciseDetailsScreen = ({ route, navigation }: ExerciseDetailProps) => {
  //Get the exercise ID from navigation params
  const { exerciseId, selectedMuscles } = route.params;
  const exercise = exercises.find(ex => ex.id === exerciseId);
  const { setSelectedExercises } = useWorkoutPlan(); // Access workout plan context
  
  //Control video playback state
  const [playing, setPlaying] = useState(false);

  const handleGoBack = () => {
    navigation.goBack();
  };

  if(!exercise){
    return (
      <View style={styles.container}>
        <Text>Exercise not found</Text>
      </View>
    );
  }
  
  //Extract video ID from youtube url
  const videoId = exercise.videoUrl ? exercise.videoUrl.split('watch?v=')[1] || '' : '';
  
  //Reusable component for displaying muscle group chips
  const renderMuscleGroups = (title: string, muscles: readonly MuscleGroup[]) => {
    if(muscles.length === 0){
      return null;
    }
    
    return (
      <View style={styles.muscleGroupContainer}>
        <Text style={styles.sectionSubtitle}>{title}</Text>
        <View style={styles.chipContainer}>
          {muscles.map((muscle) => (
            <View key={muscle} style={styles.chip}>
              <Text style={styles.chipText}>{muscle}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const handleAddToWorkout = () => {
    setSelectedExercises((prev: Exercise[]) => {
      //Prevent adding duplicates
      if(prev.some((e) => e.id === exercise.id)){
        return prev;
      }
      return [...prev, exercise];
    });
    navigation.goBack();
  };
  return (
    <ScrollView style={styles.container} contentContainerStyle={{alignItems: 'center'}}>
      {/* Header with back button, title, and add button */}
      <View style={styles.header}>
        <Pressable onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text}/>
        </Pressable>
        <Text style={styles.title}>{exercise.name}</Text>
        <Pressable style={styles.addButton} onPress={handleAddToWorkout}>
          <MaterialIcons name="playlist-add" size={24} color="white" />
          <Text style={styles.buttonText}>Add to Workout</Text>
        </Pressable>
      </View>
      {/* Show exercise demonstration GIF if available */}
      {exercise.gifUrl && (<Image source={{ uri: exercise.gifUrl }} style={styles.gif}resizeMode="contain"/>)}
      {/* Step-by-step instructions section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.description}>
          {exercise.description || "No instructions available for this exercise."}
        </Text>
      </View>
      
      {/* Visual breakdown of which muscles this exercise targets */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Muscles Worked</Text>
        {renderMuscleGroups('Primary', exercise.primaryMuscles)}
        {renderMuscleGroups('Secondary', exercise.secondaryMuscles)}
      </View>
      
      {/* Default sets/reps recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended</Text>
        <View style={styles.recommendedContainer}>
          <View style={styles.recommendedItem}>
            <Text style={styles.recommendedLabel}>Sets</Text>
            <Text style={styles.recommendedValue}>{exercise.sets}</Text>
          </View>
          <View style={styles.recommendedItem}>
            <Text style={styles.recommendedLabel}>Reps</Text>
            <Text style={styles.recommendedValue}>{exercise.reps}</Text>
          </View>
        </View>
      </View>
      
      {/* Embedded YouTube video player */}
      {videoId && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Video Demonstration</Text>
          <View style={styles.videoContainer}>
            <YouTube
              videoId={videoId}
              play={playing}
              height={220}
              onChangeState={(state) => {
                //Auto-pause when video ends
                if(state === 'ended'){
                  setPlaying(false);
                }
              }}
            />
            <Pressable 
              style={[styles.videoButton, playing ? styles.pauseButton : styles.playButton]}
              onPress={() => setPlaying(!playing)}
            >
              <MaterialIcons name={playing ? 'pause' : 'play-arrow'} size={20} color="white" />
              <Text style={styles.videoButtonText}>{playing ? 'Pause' : 'Play'}</Text>
            </Pressable>
          </View>
        </View>
      )}
      
      {/* Horizontal scroll of related exercises to explore */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Similar Exercises</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relatedContainer}>
          {exercises
          //Find exercises that work at least one of the same primary muscles
            .filter(ex => ex.id !== exercise.id && ex.primaryMuscles.some(m => exercise.primaryMuscles.includes(m))
            )
            .slice(0, 5) //Limit to 5 suggestions
            .map(ex => (
              <Pressable 
                key={ex.id} 
                style={styles.relatedExercise}
                onPress={() => navigation.push('ExerciseDetails', { exerciseId: ex.id })}
              >
                <Text style={styles.relatedName}>{ex.name}</Text>
              </Pressable>
            ))
          }
        </ScrollView>
      </View>
    </ScrollView>
  );
};

export default ExerciseDetailsScreen;
