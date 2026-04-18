import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useWorkoutHistory } from '../context/WorkoutHistoryContext';
import { styles as globalStyles } from '../styles/styles';

const WorkoutHistoryScreen = () => {
  const { completedWorkouts, loading } = useWorkoutHistory();

  if (loading) {
    return (
      <View style={globalStyles.container}>
        <Text style={globalStyles.title}>Loading workout history...</Text>
      </View>
    );
  }

  if (completedWorkouts.length === 0) {
    return (
      <View style={globalStyles.container}>
        <Text style={globalStyles.title}>No completed workouts found.</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Workout History</Text>
      <FlatList
        data={completedWorkouts}
        keyExtractor={(item) => item.id || item.date}
        renderItem={({ item }) => (
          <View style={localStyles.card}>
            <Text style={localStyles.planName}>{item.planName}</Text>
            <Text>Completed: {item.completed ? 'Yes' : 'No'}</Text>
            <Text>Duration: {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}</Text>
            <Text>Date: {new Date(item.date).toLocaleString()}</Text>
            <Text>Calories Burned: ~{Math.round(item.caloriesBurned)} cal</Text>
          </View>
        )}
      />
    </View>
  );
};

const localStyles = StyleSheet.create({
  card: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    marginVertical: 8,
    borderRadius: 10,
  },
  planName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});

export default WorkoutHistoryScreen;
