import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { useWorkoutPlan } from '../context/WorkoutPlanContext';
import { useWorkoutHistory } from '../context/WorkoutHistoryContext';
import { theme } from '../styles/theme';

// Type definitions
interface ActivityDistribution {
  name: string;
  calories: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const screenWidth = Dimensions.get('window').width;

const CalorieCharts = () => {
  const { workoutPlans, loading: planLoading } = useWorkoutPlan();
  const { completedWorkouts, loading: historyLoading } = useWorkoutHistory();
  
  // Calculate projected and actual calories
  const [projectedCalories, actualCalories, weeklyTotal] = useMemo((): [number[], number[], number] => {
    const proj: number[] = Array(7).fill(0);
    const act: number[] = Array(7).fill(0);
    
    workoutPlans.forEach(plan => {
      plan.dailySchedules?.forEach(({ day, exercises }) => {
        proj[day] += exercises.reduce((sum, ex) => sum + (ex.caloriesBurned || 0), 0);
      });
    });
    
    completedWorkouts.forEach(workout => {
      const date = new Date(workout.date);
      const day = date.getDay();
      act[day] += Math.max(workout.caloriesBurned || 0, 0);
    });
    
    // Round all values to integers
    const roundedProj = proj.map(val => Math.round(val));
    const roundedAct = act.map(val => Math.round(val));
    const totalActual = Math.round(roundedAct.reduce((sum, val) => sum + val, 0));
    
    return [roundedProj, roundedAct, totalActual];
  }, [workoutPlans, completedWorkouts]);

  // Calculate cumulative calories
  const cumulativeCalories = useMemo((): number[] => {
    const cumulative: number[] = [];
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      sum += actualCalories[i];
      cumulative.push(Math.round(sum)); // Round to ensure integer values
    }
    return cumulative;
  }, [actualCalories]);

  // Calculate activity distribution for pie chart
  const activityDistribution = useMemo((): ActivityDistribution[] => {
    const colors = ['#4285F4', '#0F9D58', '#F4B400', '#DB4437', '#9C27B0', '#3F51B5', '#00ACC1'];
  
    return actualCalories.map((value, index) => ({
      name: DAYS[index],
      calories: value || 0.1, // Avoid zero to ensure pie chart renders
      color: colors[index % colors.length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
  }, [actualCalories]);

  // Weekly goal calculation (example: 2000 calories)
  const weeklyGoal = 2000; // This should come from user settings or context
  const goalProgress = Math.min((weeklyTotal / weeklyGoal) * 100, 100);

  const chartConfig = {
    backgroundColor: theme.colors.background || '#ffffff',
    backgroundGradientFrom: theme.colors.background || '#ffffff',
    backgroundGradientTo: theme.colors.background || '#ffffff',
    decimalPlaces: 0, // Ensures whole numbers are displayed
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary || '#4285F4',
    },
    // Format y-axis labels to ensure they're integers
    formatYLabel: (value: string): string => Math.round(parseFloat(value)).toString(),
  };

  // Loading state
  if (planLoading || historyLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.noData}>Loading workout data...</Text>
      </View>
    );
  }
  
  // Empty state with call to action
  if (!workoutPlans.length && !completedWorkouts.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.noData}>No workout data available</Text>
        <TouchableOpacity 
          style={styles.actionButton}
          accessibilityRole="button"
          accessibilityLabel="Create your first workout plan"
        >
          <Text style={styles.actionButtonText}>Create your first workout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Bar chart data
  const barData = {
    labels: DAYS,
    datasets: [
      {
        data: projectedCalories,
        color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`, // Primary blue
        label: 'Projected',
      },
      {
        data: actualCalories,
        color: (opacity = 1) => `rgba(15, 157, 88, ${opacity})`, // Green
        label: 'Actual',
      },
    ],
    legend: ['Projected', 'Actual'],
  };

  // Line chart data
  const lineData = {
    labels: DAYS,
    datasets: [
      {
        data: cumulativeCalories,
        color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`, // Primary blue
        strokeWidth: 2,
      },
    ],
    legend: ['Cumulative Calories'],
  };

  // Pie chart data for activity distribution
  const pieData = activityDistribution.length > 0 
    ? activityDistribution 
    : [{ name: 'No data', calories: 1, color: '#CCCCCC', legendFontColor: '#7F7F7F', legendFontSize: 12 }];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Weekly Goal Progress */}
      <View style={styles.goalContainer}>
        <Text style={styles.title} accessibilityLabel="Weekly Calorie Goal Progress">
          Weekly Goal: {Math.round(weeklyTotal)} / {weeklyGoal} calories
        </Text>
        <View style={styles.progressBarContainer}>
          <View 
            style={[styles.progressBar, { width: `${Math.round(goalProgress)}%` }]} 
            accessibilityLabel={`${Math.round(goalProgress)}% of weekly goal completed`}
          />
        </View>
      </View>

      {/* Daily Calories Bar Chart */}
      <Text
        style={styles.title}
        accessibilityLabel="Projected vs Actual Calories Burned Chart"
      >
        Daily Calories: Projected vs Actual
      </Text>
      
      <View style={styles.chartContainer}>
        <BarChart
          data={barData}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          fromZero
          showBarTops
          showValuesOnTopOfBars
          withInnerLines={false}
          style={styles.chart}
          yAxisLabel=""
          yAxisSuffix=" cal"
          segments={4}
          verticalLabelRotation={0}
          //xAxisLabel="Day"
          yAxisInterval={1}
          //formatYLabel={(value: string): string => Math.round(parseFloat(value)).toString()}
        />
        <Text style={styles.axisLabel}>Days of Week</Text>
      </View>

      {/* Cumulative Calories Line Chart */}
      <Text
        style={[styles.title, { marginTop: 20 }]}
        accessibilityLabel="Cumulative Calories Burned Chart"
      >
        Cumulative Calories Burned
      </Text>
      
      <View style={styles.chartContainer}>
        <LineChart
          data={lineData}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          bezier
          fromZero
          style={styles.chart}
          yAxisLabel=""
          yAxisSuffix=" cal"
          segments={4}
          formatYLabel={(value: string): string => Math.round(parseFloat(value)).toString()}
          //xAxisLabel="Day"
        />
        <Text style={styles.axisLabel}>Days of Week</Text>
        <View style={styles.verticalAxisContainer}>
          <Text style={styles.verticalAxisLabel}>Calories</Text>
        </View>
      </View>

      {/* Activity Distribution Pie Chart */}
      {completedWorkouts.length > 0 && (
        <>
          <Text
            style={[styles.title, { marginTop: 20 }]}
            accessibilityLabel="Workout Type Distribution Chart"
          >
            Activity Distribution
          </Text>
          
          <View style={styles.chartContainer}>
            <PieChart
              data={pieData}
              width={screenWidth - 32}
              height={220}
              chartConfig={chartConfig}
              accessor="calories"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        </>
      )}

      {/* Summary stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{Math.round(weeklyTotal)}</Text>
          <Text style={styles.statLabel}>Total Calories</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {Math.max(...actualCalories) > 0 ? DAYS[actualCalories.indexOf(Math.max(...actualCalories))] : 'N/A'}
          </Text>
          <Text style={styles.statLabel}>Most Active Day</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {activityDistribution.length > 0 
              ? activityDistribution.sort((a, b) => b.calories - a.calories)[0].name 
              : 'N/A'}
          </Text>
          <Text style={styles.statLabel}>Top Activity</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    minHeight: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 10,
  },
  noData: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 10,
    position: 'relative',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  actionButton: {
    backgroundColor: theme.colors.primary || '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  axisLabel: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 5,
    fontWeight: '500',
  },
  verticalAxisContainer: {
    position: 'absolute',
    left: 5,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalAxisLabel: {
    fontSize: 14,
    color: theme.colors.text,
    transform: [{ rotate: '-90deg' }],
    width: 100,
    textAlign: 'center',
    fontWeight: '500',
  },
  goalContainer: {
    marginBottom: 24,
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
  },
  progressBarContainer: {
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary || '#4285F4',
    borderRadius: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary || '#4285F4',
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text,
    marginTop: 4,
    textAlign: 'center',
  }
});

export default CalorieCharts;