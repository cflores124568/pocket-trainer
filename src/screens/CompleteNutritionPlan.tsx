import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, Alert, StyleSheet } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NutritionStackParamList, NutritionPlan, ScheduledFoodItem } from '../types/types';
import { useNutritionPlan } from '../context/NutritionContext';
import { useNutritionHistory } from '../context/NutritionHistoryContext';
import { useAuth } from '../firebase/AuthContext';
import { styles as globalStyles } from '../styles/styles';
import { theme } from '../styles/theme';
import { Switch } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

type CompleteNutritionPlanRouteProp = RouteProp<NutritionStackParamList, 'CompleteNutritionPlan'>;

const getFoodTrackingId = (food: ScheduledFoodItem, index: number): string =>
  food.entryId || `${food.id}-${food.day}-${food.mealTime || 'any'}-${index}`;

// ProgressStats component (inspired by WorkoutStats)
const ProgressStats = ({ consumedCount, totalCount }: { consumedCount: number; totalCount: number }) => {
  const progressPercentage = totalCount > 0 ? (consumedCount / totalCount) * 100 : 0;

  return (
    <View style={localStyles.statsContainer}>
      <View style={localStyles.progressContainer}>
        <View style={localStyles.progressTextContainer}>
          <Text style={localStyles.progressText}>
            Consumed: {consumedCount} / {totalCount} foods
          </Text>
          <Text style={localStyles.progressPercentage}>
            {progressPercentage.toFixed(0)}%
          </Text>
        </View>
        <View style={localStyles.progressBar}>
          <View
            style={[localStyles.progressFill, { width: `${progressPercentage}%` }]}
          />
        </View>
      </View>
    </View>
  );
};

const CompleteNutritionPlanScreen = ({ route }: { route: CompleteNutritionPlanRouteProp }) => {
  const { planId } = route.params;
  const navigation = useNavigation();
  const { nutritionPlans } = useNutritionPlan();
  const { saveCompletedNutritionPlan } = useNutritionHistory();
  const { user } = useAuth();
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [consumedFoods, setConsumedFoods] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const targetPlan = nutritionPlans.find((p) => p.id === planId) || null;
    setPlan(targetPlan);
    if (targetPlan) {
      // Initialize consumption states
      const initialConsumption = targetPlan.foods.reduce((acc, food, index) => {
        acc[getFoodTrackingId(food, index)] = false;
        return acc;
      }, {} as Record<string, boolean>);
      setConsumedFoods(initialConsumption);
    }
    setLoading(false);
  }, [nutritionPlans, planId]);

  const getTotalMacros = (foods: ScheduledFoodItem[]) => {
    return foods.reduce(
      (totals, food, index) => {
        if (consumedFoods[getFoodTrackingId(food, index)]) {
          totals.calories += (food.calories || 0) * food.servings;
          totals.protein += (food.protein || 0) * food.servings;
          totals.carbs += (food.carbs || 0) * food.servings;
          totals.fat += (food.fat || 0) * food.servings;
        }
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const toggleFoodConsumption = (foodId: string) => {
    setConsumedFoods((prev) => ({
      ...prev,
      [foodId]: !prev[foodId],
    }));
  };

  const handleCompleteAll = () => {
    const newConsumed = Object.fromEntries(
      plan!.foods.map((food, index) => [getFoodTrackingId(food, index), true])
    );
    setConsumedFoods(newConsumed);
  };

  const handleComplete = async () => {
    if (!user || !plan) return;

    const selectedFoods = plan.foods.filter((food, index) => consumedFoods[getFoodTrackingId(food, index)]);
    if (selectedFoods.length === 0) {
      Alert.alert('No Foods Consumed', 'Please mark at least one food as consumed.');
      return;
    }

    const totals = getTotalMacros(plan.foods);
    const isFullyConsumed = selectedFoods.length === plan.foods.length;

    const saveAndNavigate = async () => {
      try {
        await saveCompletedNutritionPlan({
          planId: plan.id!,
          planName: plan.name,
          date: new Date().toISOString().split('T')[0],
          consumedFoods: selectedFoods,
          totalCalories: totals.calories,
          totalProtein: totals.protein,
          totalCarbs: totals.carbs,
          totalFat: totals.fat,
          userId: user.uid,
        });
        navigation.goBack();
        Alert.alert(
          'Consumption Saved',
          isFullyConsumed
            ? `Great job! You completed "${plan.name}".`
            : `Saved consumption for "${plan.name}" (${selectedFoods.length}/${plan.foods.length} foods).`
        );
      } catch (err) {
        console.error('Error saving completion:', err);
        Alert.alert('Error', 'Failed to save consumption.');
      }
    };

    if (isFullyConsumed) {
      Alert.alert(
        '🎉 Plan Complete!',
        `You consumed all foods in "${plan.name}". Save your progress?`,
        [
          { text: 'Save', onPress: saveAndNavigate },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      Alert.alert(
        'Partial Consumption',
        `You consumed ${selectedFoods.length}/${plan.foods.length} foods. Save as incomplete?`,
        [
          { text: 'Continue', style: 'cancel' },
          { text: 'Save', onPress: saveAndNavigate },
        ]
      );
    }
  };

  if (loading || !plan) {
    return (
      <View style={globalStyles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Loading plan...</Text>
      </View>
    );
  }

  const totals = getTotalMacros(plan.foods);
  const consumedCount = Object.values(consumedFoods).filter(Boolean).length;

  return (
    <View style={globalStyles.container}>
      <View style={localStyles.headerContainer}>
        <Text style={globalStyles.sectionTitle}>{plan.name} - Track Consumption</Text>
        <Pressable
          style={localStyles.completeAllButton}
          onPress={handleCompleteAll}
          accessibilityLabel="Mark all foods as consumed"
        >
          <FontAwesome5 name="check" size={14} color="white" />
          <Text style={localStyles.completeAllButtonText}>Complete All</Text>
        </Pressable>
      </View>

      <ProgressStats consumedCount={consumedCount} totalCount={plan.foods.length} />

      <FlatList
        data={plan.foods}
        keyExtractor={(item, index) => getFoodTrackingId(item, index)}
        renderItem={({ item, index }) => {
          const trackingId = getFoodTrackingId(item, index);
          return (
          <View style={localStyles.foodItem}>
            <View style={localStyles.foodDetails}>
              <Text>{item.name}</Text>
              <Text>{item.servings} servings - {(item.calories * item.servings).toFixed(1)} cal</Text>
            </View>
            <Switch
              value={consumedFoods[trackingId] || false}
              onValueChange={() => toggleFoodConsumption(trackingId)}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
              thumbColor={consumedFoods[trackingId] ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>
          );
        }}
      />

      <View style={localStyles.bottomContainer}>
        <Pressable
          style={[
            globalStyles.saveButton,
            consumedCount === plan.foods.length ? localStyles.completeButton : localStyles.incompleteButton,
          ]}
          onPress={handleComplete}
          accessibilityLabel="Save consumption"
        >
          <FontAwesome5
            name={consumedCount === plan.foods.length ? 'check-circle' : 'save'}
            size={16}
            color="white"
          />
          <Text style={globalStyles.saveButtonText}>
            {consumedCount === plan.foods.length ? 'Complete Plan' : 'Save Consumption'}
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
    padding: theme.spacing.md,
  },
  completeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.secondary,
    borderRadius: 8,
  },
  completeAllButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
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
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  foodDetails: {
    flex: 1,
  },
  bottomContainer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: 'white',
  },
  completeButton: {
    backgroundColor: theme.colors.success,
  },
  incompleteButton: {
    backgroundColor: theme.colors.secondary,
  },
});

export default CompleteNutritionPlanScreen;
