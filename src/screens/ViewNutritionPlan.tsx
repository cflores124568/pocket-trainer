
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { NutritionStackParamList, NutritionPlan, ScheduledFoodItem } from '../types/types';
import { useNutritionPlan } from '../context/NutritionContext';
import { useAuth } from '../firebase/AuthContext';
import { styles as globalStyles } from '../styles/styles';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNutritionHistory } from '../context/NutritionHistoryContext';
import Collapsible from 'react-native-collapsible';
import Checkbox from 'expo-checkbox';

type NavigationProp = StackNavigationProp<NutritionStackParamList, 'ViewNutritionPlan'>;

const ViewNutritionPlansScreen = ({ navigation }: { navigation: NavigationProp }) => {
  const { nutritionPlans, deletePlan, loading, setActivePlan } = useNutritionPlan();
  const { userData } = useAuth();
  const { completedPlanIdsForToday, saveConsumption, getConsumptionForPlan } = useNutritionHistory();
  const [collapsedPlans, setCollapsedPlans] = useState<{ [key: string]: boolean }>({});
  const [consumptionMap, setConsumptionMap] = useState<
    Record<string, { id: string; consumed: boolean }[] | null>
  >({});
  const [initializing, setInitializing] = useState(false);
  const [saving, setSaving] = useState<{ [planId: string]: string | null }>({});

  useEffect(() => {
    const fetchAllConsumptions = async () => {
      const newConsumptionMap: Record<string, { id: string; consumed: boolean }[] | null> = {};
      for (const plan of nutritionPlans) {
        const consumption = await getConsumptionForPlan(plan.id!);
        newConsumptionMap[plan.id!] = consumption?.foods || [];
      }
      setConsumptionMap(newConsumptionMap);
    };
    if (nutritionPlans.length > 0) fetchAllConsumptions();
  }, [nutritionPlans, getConsumptionForPlan]);

  useEffect(() => {
    const initializeConsumption = async () => {
      setInitializing(true);
      try {
        for (const plan of nutritionPlans) {
          const consumption = await getConsumptionForPlan(plan.id!);
          if ((!consumption || !consumption.foods) && plan.foods.length > 0) {
            const initialFoods = plan.foods.map((food) => ({ id: food.id!, consumed: false }));
            await Promise.all(
              initialFoods.map((food) => saveConsumption(plan.id!, food.id, false))
            );
            setConsumptionMap((prev) => ({
              ...prev,
              [plan.id!]: initialFoods,
            }));
          }
        }
      } catch (error: any) {
        Alert.alert(
          'Error',
          error.code === 'unavailable'
            ? 'Network error. Please check your connection.'
            : 'Failed to initialize consumption data.'
        );
      } finally {
        setInitializing(false);
      }
    };
    if (nutritionPlans.length > 0) initializeConsumption();
  }, [nutritionPlans, saveConsumption, getConsumptionForPlan]);

  const handleEditPlan = (planId: string) => {
    navigation.navigate('EditNutritionPlan', { planId });
  };

  const handleDeletePlan = async (planId: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this plan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePlan(planId);
            Alert.alert('Success', 'Plan deleted successfully.');
          } catch (error: any) {
            Alert.alert(
              'Error',
              error.code === 'permission-denied'
                ? 'You do not have permission to delete this plan.'
                : 'Failed to delete the plan. Please try again.'
            );
          }
        },
      },
    ]);
  };

  const toggleCollapse = (planId: string) => {
    setCollapsedPlans((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  const renderFood = ({ item }: { item: ScheduledFoodItem }) => {
    const planId = item.planId;
    if (!planId) {
    console.warn('Missing planId for food item:', item);
    return null;
  }
    const consumption = consumptionMap[planId] || [];
    const isConsumed = consumption.find((food) => food.id === item.id)?.consumed || false;

    const handleCheck = async () => {
      setSaving((prev) => ({ ...prev, [planId]: item.id }));
      try {
        await saveConsumption(planId, item.id!, !isConsumed);
        setConsumptionMap((prev) => ({
          ...prev,
          [planId]: (prev[planId] || []).map((food) =>
            food.id === item.id ? { ...food, consumed: !isConsumed } : food
          ),
        }));
      } catch (error: any) {
        Alert.alert(
          'Error',
          error.code === 'unavailable'
            ? 'Network error. Please check your connection.'
            : 'Failed to save consumption status.'
        );
      } finally {
        setSaving((prev) => ({ ...prev, [planId]: null }));
      }
    };

    return (
      <View style={localStyles.foodItem}>
        <View style={localStyles.checkboxContainer}>
          {saving[planId] === item.id ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Checkbox
              value={isConsumed}
              onValueChange={handleCheck}
              color={isConsumed ? theme.colors.success : undefined}
              accessibilityLabel={`Mark ${item.name} as ${isConsumed ? 'not consumed' : 'consumed'}`}
              accessibilityHint="Toggles the consumption status of this food item"
            />
          )}
          <View style={localStyles.foodDetailsContainer}>
            <Text style={localStyles.foodName}>{item.name}</Text>
            <Text style={localStyles.foodDetails}>
              {item.calories} cal | Protein: {item.protein}g | Carbs: {item.carbs}g | Fat: {item.fat}g
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPlan = ({ item }: { item: NutritionPlan }) => {
    const isCollapsed = collapsedPlans[item.id!] || false;
    const isCompletedToday = completedPlanIdsForToday.includes(item.id!);
    const consumption = consumptionMap[item.id!] || [];
    const consumedCount = consumption.filter((food) => food.consumed).length;
    const totalFoods = item.foods.length;
    const allConsumed = totalFoods > 0 && consumedCount === totalFoods;

    const getButtonStatus = () => {
      if (!item.isActive) return 'Start';
      if (item.isActive && !isCompletedToday && !allConsumed) return 'Resume';
      if (item.isActive && (isCompletedToday || allConsumed)) return 'Completed';
      return 'Start';
    };

    return (
      <View style={[localStyles.planItem, item.isActive && { borderColor: theme.colors.primary, borderWidth: 2 }]}>
        <TouchableOpacity
          style={localStyles.planHeader}
          onPress={() => toggleCollapse(item.id!)}
          accessibilityLabel={`Toggle details for ${item.name}`}
        >
          <View style={localStyles.planInfo}>
            <Text style={localStyles.planName}>{item.name}</Text>
            <Text style={localStyles.planDetails}>
              Goal: {item.goal} | Foods: {item.foods.length}
            </Text>
            {item.isActive && !isCompletedToday && !allConsumed && (
              <Text style={localStyles.progressText}>
                {consumedCount}/{totalFoods} foods consumed
              </Text>
            )}
          </View>
          <Text style={localStyles.expandText}>{isCollapsed ? 'Show' : 'Hide'}</Text>
        </TouchableOpacity>

        <Collapsible collapsed={isCollapsed}>
          <View style={localStyles.foodList}>
            <FlatList
              data={item.foods}
              keyExtractor={(food, index) => food.id || `${food.name}-${index}`}
              renderItem={renderFood}
              ListEmptyComponent={<Text style={localStyles.emptyText}>No foods added</Text>}
            />
          </View>
        </Collapsible>

        <View style={localStyles.actions}>
          <Pressable
            style={({ pressed }) => [
              localStyles.actionButton,
              localStyles.editButton,
              pressed && localStyles.buttonPressed,
            ]}
            onPress={() => handleEditPlan(item.id!)}
            accessibilityLabel="Edit nutrition plan"
          >
            <Ionicons name="create-outline" size={20} color="white" />
            <Text style={localStyles.actionButtonText}>Edit</Text>
          </Pressable>

          {item.isActive ? (
            isCompletedToday || allConsumed ? (
              <View style={[localStyles.actionButton, localStyles.completedButton]}>
                <Ionicons name="checkmark-done" size={20} color="white" />
                <Text style={localStyles.actionButtonText}>Completed</Text>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  localStyles.actionButton,
                  localStyles.completeButton,
                  pressed && localStyles.buttonPressed,
                ]}
                onPress={() => toggleCollapse(item.id!)} // Expand to resume marking foods
                accessibilityLabel="Resume nutrition plan"
                accessibilityHint="Expands the plan to continue marking foods as consumed"
              >
                <Ionicons name="play-outline" size={20} color="white" />
                <Text style={localStyles.actionButtonText}>Resume</Text>
              </Pressable>
            )
          ) : (
            <Pressable
              style={({ pressed }) => [
                localStyles.actionButton,
                localStyles.startButton,
                pressed && localStyles.buttonPressed,
              ]}
              onPress={async () => {
                try {
                  await setActivePlan(item.id!);
                  Alert.alert('Plan Started', `"${item.name}" is now active.`);
                } catch (error: any) {
                  Alert.alert(
                    'Error',
                    error.code === 'permission-denied'
                      ? 'You do not have permission to start this plan.'
                      : 'Failed to start the plan.'
                  );
                }
              }}
              accessibilityLabel="Start nutrition plan"
            >
              <Ionicons name="play-outline" size={20} color="white" />
              <Text style={localStyles.actionButtonText}>Start</Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [
              localStyles.actionButton,
              localStyles.deleteButton,
              pressed && localStyles.buttonPressed,
            ]}
            onPress={() => handleDeletePlan(item.id!)}
            accessibilityLabel="Delete nutrition plan"
          >
            <Ionicons name="trash-outline" size={20} color="white" />
            <Text style={localStyles.actionButtonText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  if (loading || initializing) {
    return (
      <View style={globalStyles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={globalStyles.label}>
          {initializing ? 'Initializing consumption data...' : 'Loading nutrition plans...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.sectionTitle}>Your Nutrition Plans</Text>
      {nutritionPlans.length === 0 ? (
        <Text style={localStyles.emptyText}>No plans yet. Create one!</Text>
      ) : (
        <FlatList
          data={nutritionPlans}
          keyExtractor={(item, index) => item.id || `plan-${index}`}
          renderItem={renderPlan}
          contentContainerStyle={localStyles.list}
        />
      )}
      <Pressable
        style={globalStyles.button}
        onPress={() =>
          navigation.navigate('CreateNutritionPlan', {
            gender: userData?.gender || 'male',
            weight: userData?.weight || 0,
          })
        }
        accessibilityLabel="Create new nutrition plan"
      >
        <Ionicons name="add" size={20} color="white" style={{ marginRight: theme.spacing.xs }} />
        <Text style={globalStyles.buttonText}>Create New Plan</Text>
      </Pressable>
    </View>
  );
};

const localStyles = StyleSheet.create({
  planItem: {
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  planDetails: {
    fontSize: 14,
    color: '#666',
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  expandText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  foodList: {
    marginTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: theme.spacing.sm,
  },
  foodItem: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodDetailsContainer: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  foodDetails: {
    fontSize: 12,
    color: '#666',
  },
  actions: {
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
  completeButton: {
    backgroundColor: theme.colors.accent || '#FFB300',
  },
  completedButton: {
    backgroundColor: theme.colors.success || '#2E7D32',
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
  editButton: {
    backgroundColor: theme.colors.accent || '#4CAF50',
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
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: theme.spacing.lg,
  },
  list: {
    paddingBottom: theme.spacing.lg,
  },
});

export default ViewNutritionPlansScreen;
