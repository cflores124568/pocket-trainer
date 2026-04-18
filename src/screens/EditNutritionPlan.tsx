import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert, Modal } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { NutritionStackParamList, NutritionPlan, ScheduledFoodItem, FoodItem, DayOfWeek, MealTime } from '../types/types';
import { useNutritionPlan } from '../context/NutritionContext';
import FoodSearch from '../components/FoodSearch';
import { styles } from '../styles/styles';
import { theme } from '../styles/theme';

type NavigationProp = StackNavigationProp<NutritionStackParamList, 'EditNutritionPlan'>;
type RoutePropType = RouteProp<NutritionStackParamList, 'EditNutritionPlan'>;

type EditNutritionPlanProps = {
  route: RoutePropType;
  navigation: NavigationProp;
};

const EditNutritionPlanScreen = ({ route, navigation }: EditNutritionPlanProps) => {
  const { nutritionPlans, savePlan, loading } = useNutritionPlan();
  const { planId, selectedFood: routeSelectedFood } = route.params;

  const createFoodEntryId = (foodId: string) =>
    `${foodId}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const withEntryIds = (planFoods: ScheduledFoodItem[]) =>
    planFoods.map((food, index) => ({
      ...food,
      entryId: food.entryId || `legacy-${food.id}-${food.day}-${food.mealTime || 'any'}-${index}`,
    }));

  // Find the plan to edit
  const planToEdit = nutritionPlans.find((p) => p.id === planId);
  const [name, setName] = useState(planToEdit?.name || '');
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>(planToEdit?.goal || 'maintain');
  const [foods, setFoods] = useState<ScheduledFoodItem[]>(withEntryIds(planToEdit?.foods || []));
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(0);
  const [selectedMealTime, setSelectedMealTime] = useState<MealTime>('snack');
  const [servings, setServings] = useState('1');

  useEffect(() => {
    if (!planToEdit) {
      Alert.alert('Error', 'Plan not found', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    }
  }, [planToEdit, navigation]);

  useEffect(() => {
    if (!planToEdit) return;
    setName(planToEdit.name);
    setGoal(planToEdit.goal);
    setFoods(withEntryIds(planToEdit.foods));
  }, [planToEdit]);

  const handleAddFood = (food: FoodItem) => {
    setSelectedFood(food);
    setSelectedDay(0);
    setSelectedMealTime('snack');
    setServings('1');
    setModalVisible(true);
  };

  useEffect(() => {
    if (!routeSelectedFood) return;
    handleAddFood(routeSelectedFood);
    navigation.setParams({ selectedFood: undefined });
  }, [routeSelectedFood, navigation]);

  const confirmAddFood = () => {
    if (!selectedFood) return;
    const servingsNum = parseInt(servings, 10);
    if (isNaN(servingsNum) || servingsNum <= 0) {
      Alert.alert('Error', 'Please enter a valid number of servings.');
      return;
    }
    const scheduledFood: ScheduledFoodItem = {
      ...selectedFood,
      entryId: createFoodEntryId(selectedFood.id),
      day: selectedDay,
      mealTime: selectedMealTime,
      servings: servingsNum,
      planId: planToEdit?.id ?? planId,
    };
    setFoods([...foods, scheduledFood]);
    setModalVisible(false);
    setSelectedFood(null);
    setServings('1');
  };

  const handleRemoveFood = (entryId: string) => {
    setFoods(foods.filter((f) => (f.entryId || f.id) !== entryId));
  };

  const handleSave = async () => {
    if (!name || foods.length === 0) {
      Alert.alert('Error', 'Please provide a name and at least one food.');
      return;
    }
    if (!planToEdit) return;

    const updatedPlan: NutritionPlan = {
      ...planToEdit,
      name,
      goal,
      foods,
    };

    try {
      await savePlan(updatedPlan);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save changes. Try again.');
    }
  };

  const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MEAL_TIMES: MealTime[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  if (loading || !planToEdit) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Edit Nutrition Plan</Text>

      {/* Plan Name */}
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Plan Name"
      />

      {/* Goal Selection */}
      <View style={localStyles.goalContainer}>
        {(['lose', 'maintain', 'gain'] as const).map((g) => (
          <Pressable
            key={g}
            onPress={() => setGoal(g)}
            style={[styles.button, goal === g && styles.buttonActive]}
          >
            <Text>{g}</Text>
          </Pressable>
        ))}
      </View>

      {/* Food Search */}
      <View style={localStyles.section}>
        <Text style={styles.sectionSubtitle}>Add Food</Text>
        <FoodSearch onSelectFood={handleAddFood} 
          selectedAllergens={planToEdit?.allergies || []}
          customAllergens={planToEdit?.customAllergens || []}
          sourceScreen="EditNutritionPlan"
          planId={planId}
        />
      </View>

      {/* Selected Foods */}
      <View style={localStyles.section}>
        <Text style={styles.sectionTitle}>Selected Foods</Text>
        {foods.length > 0 ? (
          foods.map((food) => (
            <View key={food.entryId || food.id} style={localStyles.foodItem}>
              <Text>
                {food.name} - {food.calories} cal (P: {food.protein}g, C: {food.carbs}g, F: {food.fat}g) - Day: {DAYS_OF_WEEK[food.day]}, Meal: {food.mealTime || 'None'}, Servings: {food.servings}
              </Text>
              <Pressable onPress={() => handleRemoveFood(food.entryId || food.id)}>
                <Text style={localStyles.removeText}>Remove</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <Text>No foods added yet</Text>
        )}
      </View>

      {/* Save Button */}
      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </Pressable>

      {/* Modal for Scheduling */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <Text style={localStyles.modalTitle}>Add {selectedFood?.name}</Text>

            <Text style={localStyles.modalLabel}>Day:</Text>
            <View style={localStyles.pickerContainer}>
              {DAYS_OF_WEEK.map((day, index) => (
                <Pressable
                  key={day}
                  onPress={() => setSelectedDay(index as DayOfWeek)}
                  style={[
                    localStyles.dayButton,
                    selectedDay === index && localStyles.dayButtonActive,
                  ]}
                >
                  <Text style={selectedDay === index ? localStyles.activeText : localStyles.inactiveText}>
                    {day.slice(0, 3)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={localStyles.modalLabel}>Meal Time:</Text>
            <View style={localStyles.pickerContainer}>
              {MEAL_TIMES.map((meal) => (
                <Pressable
                  key={meal}
                  onPress={() => setSelectedMealTime(meal)}
                  style={[localStyles.mealButton, selectedMealTime === meal && localStyles.mealButtonActive]}
                >
                  <Text style={selectedMealTime === meal ? localStyles.activeText : localStyles.inactiveText}>
                    {meal.charAt(0).toUpperCase() + meal.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={localStyles.modalLabel}>Servings:</Text>
            <TextInput
              style={localStyles.modalInput}
              value={servings}
              onChangeText={(text) => setServings(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              placeholder="Enter servings"
            />

            <View style={localStyles.modalButtonContainer}>
              <Pressable
                style={[localStyles.modalButton, localStyles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={localStyles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[localStyles.modalButton, localStyles.confirmButton]}
                onPress={confirmAddFood}
              >
                <Text style={localStyles.modalButtonText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const localStyles = StyleSheet.create({
  goalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: theme.spacing.md,
  },
  section: {
    marginVertical: theme.spacing.md,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  removeText: {
    color: theme.colors.error,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    padding: theme.spacing.lg,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: theme.spacing.sm,
  },
  dayButton: {
    padding: 8,
    margin: 4,
    borderRadius: 4,
    backgroundColor: '#eee',
  },
  dayButtonActive: {
    backgroundColor: theme.colors.primary || '#007bff',
  },
  mealButton: {
    padding: 8,
    margin: 4,
    borderRadius: 4,
    backgroundColor: '#eee',
  },
  mealButtonActive: {
    backgroundColor: theme.colors.primary || '#007bff',
  },
  activeText: {
    color: 'white',
    fontWeight: '500',
  },
  inactiveText: {
    color: '#333',
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginVertical: theme.spacing.sm,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary || '#007bff',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default EditNutritionPlanScreen;
