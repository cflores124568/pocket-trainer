import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { MuscleGroup, Exercise, Gender, DiagramView } from '../types/types';
import exercises from '../data/Exercises';
import { styles } from '../styles/styles';
import { theme } from '../styles/theme';
import YouTube from 'react-native-youtube-iframe';
import { useAuth } from '../firebase/AuthContext';
import FemaleFrontMuscles from '../svgs/FemaleFrontMusclesOG.svg';
import FemaleRearMuscles from '../svgs/FemaleRearMusclesOG.svg';
import MaleFrontMuscles from '../svgs/MaleFrontMusclesOG.svg';
import MaleRearMuscles from '../svgs/MaleRearMusclesOG.svg';
import { Dimensions } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { musclePathData } from '../data/MusclePathData';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useWorkoutPlan } from '../context/WorkoutPlanContext';

type MuscleDiagramScreenProps = {
  navigation: any;
  route?: {
    params?: {
      mode?: 'explore' | 'plan';
      selectedMuscles?: MuscleGroup[]; // Added for initialization
    };
  };
};

const MuscleDiagramScreen = ({ navigation, route }: MuscleDiagramScreenProps) => {
  const { userData, loading: authLoading } = useAuth();
  const { setSelectedMuscles } = useWorkoutPlan();
  const mode = route?.params?.mode || 'explore';
  // Initialize with selectedMuscles from route params, if provided
  const initialMuscles = route?.params?.selectedMuscles || [];
  const [view, setView] = useState<DiagramView>('front');
  const [selectedMuscles, setLocalSelectedMuscles] = useState<MuscleGroup[]>(initialMuscles);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [playing, setPlaying] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [showExercises, setShowExercises] = useState(false);

  const getMuscleColor = (muscleId: string) => {
    const gender = (userData?.gender?.toLowerCase() as Gender) || 'male';
    const musclePaths = musclePathData[gender][view];
    return Object.entries(musclePaths).some(([muscle, paths]) =>
      selectedMuscles.includes(muscle as MuscleGroup) && paths.some((p) => p.id === muscleId)) ? 'red' : 'transparent';
  };

  useEffect(() => {
    if(selectedMuscles.length > 0){
      const filtered = exercises.filter((exercise) =>
        selectedMuscles.some((muscle) =>
          exercise.primaryMuscles.includes(muscle) || exercise.secondaryMuscles.includes(muscle))
      );
      setFilteredExercises(filtered);
      if(mode === 'explore'){
        setShowExercises(true);
      }
      else{
        setShowExercises(false);
      }
    }
    else{
      setFilteredExercises([]);
      setShowExercises(false);
    }
  }, [selectedMuscles, mode]);

  const handleMusclePress = (muscleName: MuscleGroup) => {
    if(mode === 'explore'){
      setLocalSelectedMuscles((prev) => (prev.includes(muscleName) ? [] : [muscleName]));
    }
    else{
      setLocalSelectedMuscles((prev) =>
        prev.includes(muscleName) ? prev.filter((m) => m !== muscleName) : [...prev, muscleName]
      );
    }
  };

  const toggleView = () => {
    setView((prev) => (prev === 'front' ? 'rear' : 'front'));
    // Removed setSelectedMuscles([]) to preserve selections
    setShowExercises(false);
  };

  const handleExploreMode = () => {
    navigation.setParams({ mode: 'explore' });
    setSelectedMuscles(selectedMuscles.length > 1 ? [selectedMuscles[0]] : selectedMuscles);
    setShowExercises(selectedMuscles.length > 0);
  };

  const handlePlanMode = () => {
    navigation.setParams({ mode: 'plan' });
    setShowExercises(false);
  };

  const togglePlaying = (videoId: string) => {
    if(currentVideoId === videoId){
      setPlaying((prev) => !prev);
    }
    else{
      setCurrentVideoId(videoId);
      setPlaying(true);
    }
  };

  const handleDone = () => {
    if(mode === 'plan' && selectedMuscles.length > 0){
      setShowExercises(true);
    }
  };

  const handleSaveToPlan = () => {
    if(mode === 'plan' && selectedMuscles.length > 0){
      setSelectedMuscles(selectedMuscles);
      navigation.goBack();
    }
  };

  const renderMuscleDiagram = () => {
    const screenWidth = Dimensions.get('window').width;
    const svgWidth = screenWidth * 1.0;
    const svgHeight = svgWidth * (470 / 300);
    const gender = (userData?.gender?.toLowerCase() as Gender) || 'male';
    const BaseDiagram =
      gender === 'male'
        ? view === 'front'
          ? MaleFrontMuscles
          : MaleRearMuscles
        : view === 'front'
        ? FemaleFrontMuscles
        : FemaleRearMuscles;
    const muscleGroups = musclePathData[gender]?.[view];
    if(!muscleGroups) return null;

    return (
      <View style={[styles.diagramContainer, { height: svgHeight }]}>
        <BaseDiagram width={svgWidth} height={svgHeight} />
        <Svg width={svgWidth} height={svgHeight} viewBox="0 0 300 470" style={{ position: 'absolute', top: 0, left: -15 }}>
          <G>
            {Object.entries(muscleGroups).map(([muscleName, muscleArray]) =>
              muscleArray.map((muscle) => (
                <Path
                  key={muscle.id}
                  d={muscle.d}
                  fill={getMuscleColor(muscle.id)}
                  stroke="black"
                  strokeWidth="0.5"
                  onPress={() => handleMusclePress(muscleName as MuscleGroup)}
                />
              ))
            )}
          </G>
        </Svg>
      </View>
    );
  };

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') setPlaying(false);
  }, []);

  if (authLoading) {
    return <ActivityIndicator size="large" color={theme.colors.primary} />;
  }

  return (
    <ScrollView
      contentContainerStyle={{
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background,
        paddingBottom: 50,
      }}
      bounces={false}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.toggleContainer}>
        <Pressable style={({ pressed }) => [styles.button, { marginBottom: theme.spacing.md }, pressed && { opacity: 0.7 }]} onPress={toggleView}>
          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            <Ionicons name="swap-horizontal" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Switch to {view === 'front' ? 'Rear' : 'Front'} View</Text>
          </View>
        </Pressable>
      </View>

      {/* Mode Toggle */}
      <View style={[styles.toggleContainer, { flexDirection: 'column', alignItems: 'center' }]}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            mode === 'explore' ? styles.buttonActive : styles.buttonInactive,
            { marginBottom: theme.spacing.sm },
            pressed && { opacity: 0.7 },
          ]}
          onPress={handleExploreMode}
        >
          <Text style={styles.buttonText}>Explore (Single Muscle)</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.button, mode === 'plan' ? styles.buttonActive : styles.buttonInactive, pressed && { opacity: 0.7 }]}
          onPress={handlePlanMode}
        >
          <Text style={styles.buttonText}>Plan Workout (Multi-Muscle)</Text>
        </Pressable>
      </View>

      {renderMuscleDiagram()}

      {/* Selected Muscles Feedback (Plan Mode) */}
      {mode === 'plan' && selectedMuscles.length > 0 && !showExercises && (
        <Text style={styles.label}>Selected: {selectedMuscles.join(', ')}</Text>
      )}

      {/* Exercise List (Both Modes) */}
      {showExercises && selectedMuscles.length > 0 && (
        <View style={styles.muscleDiagramExerciseList}>
          <Text style={styles.muscleDiagramMuscleName}>Exercises for: {selectedMuscles.join(', ')}</Text>
          {filteredExercises.length > 0 ? (
            filteredExercises.map((exercise) => {
              const videoId = exercise.videoUrl ? exercise.videoUrl.split('watch?v=')[1] || '' : '';
              const isPlaying = currentVideoId === videoId && playing;
              return (
                <View
                  key={exercise.id}
                  style={[styles.muscleDiagramExerciseItem, isPlaying ? styles.activeExerciseItem : null]}
                >
                  <Pressable onPress={() => navigation.navigate('ExerciseDetails', { exerciseId: exercise.id })}>
                    <Text style={styles.muscleDiagramExerciseName}>{exercise.name}</Text>
                    <Text>{`Sets: ${exercise.sets}, Reps: ${exercise.reps}`}</Text>
                  </Pressable>
                  {videoId && (
                    <View style={styles.videoContainer}>
                      <YouTube videoId={videoId} play={isPlaying} height={200} onChangeState={onStateChange} />
                      <Pressable
                        style={[styles.videoControlButton, isPlaying ? styles.pauseButton : styles.playButton]}
                        onPress={() => togglePlaying(videoId)}
                      >
                        <MaterialIcons name={isPlaying ? 'pause-circle' : 'play-circle'} size={24} />
                        <Text style={styles.videoControlText}>{isPlaying ? 'Pause' : 'Play'}</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <Text>No exercises found for these muscle groups.</Text>
          )}
        </View>
      )}

      {/* Buttons */}
      {mode === 'plan' && !showExercises && (
        <Pressable
          style={[styles.saveButton, selectedMuscles.length === 0 && styles.buttonDisabled]}
          onPress={handleDone}
          disabled={selectedMuscles.length === 0}
        >
          <Text style={styles.saveButtonText}>Done</Text>
        </Pressable>
      )}
      {mode === 'plan' && showExercises && (
        <Pressable style={styles.saveButton} onPress={handleSaveToPlan}>
          <Text style={styles.saveButtonText}>Save to Plan</Text>
        </Pressable>
      )}
    </ScrollView>
  );
};

export default MuscleDiagramScreen;
