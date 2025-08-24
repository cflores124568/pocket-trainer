import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Image, Alert, Modal, Switch, TouchableOpacity, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { FoodItem, ScheduledFoodItem, ActivityLevel, NutritionStackParamList, Gender, MealTime, DayOfWeek } from '../types/types';
import { useNutritionPlan } from '../context/NutritionContext';
import { useAuth } from '../firebase/AuthContext';
import FoodSearch from '../components/FoodSearch';
import { styles } from '../styles/styles';
import { theme } from '../styles/theme';
import AllergenSelector from '../utils/AllergenSelectorUtil';
import { updateUserProfile } from '../firebase/firebase';
import uuid from 'react-native-uuid';

type CreateNutritionPlanNavigationProp = StackNavigationProp<NutritionStackParamList, 'CreateNutritionPlan'>;
type CreateNutritionPlanRouteProp = RouteProp<NutritionStackParamList, 'CreateNutritionPlan'>;

type CreateNutritionPlanProps = {
  navigation: CreateNutritionPlanNavigationProp;
  route: CreateNutritionPlanRouteProp;
};

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MEAL_TIMES: MealTime[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CreateNutritionPlanScreen = ({ navigation, route }: CreateNutritionPlanProps) => {
  const { gender: paramGender, weight: paramWeight, selectedFood } = route.params || {};
  const { planName, setPlanName, goal, setGoal, selectedFoods, setSelectedFoods, savePlan, clearCurrentPlan, dailyCalorieTarget, macroRatios, updateCalorieAndMacroTargets } = useNutritionPlan();
  const { user, userData } = useAuth();
  //Generare unique ID for plan
  const [tempPlanId] = useState(() => {
    const id = uuid.v4() as string | number[];
    return typeof id === 'string' ? id: id.join('');
  });

  //States for user stats and UI controls
  const [useDefaultStats, setUseDefaultStats] = useState<boolean>(true);
  const [weight, setWeight] = useState<string>('');
  const [heightFeet, setHeightFeet] = useState<string>('');
  const [heightInches, setHeightInches] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 25);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedDay, setSelectedDay] = useState(1);
  const [days, setDays] = useState<number[]>([]);
  const [gender, setGender] = useState<Gender>(paramGender || 'male');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [customAllergens, setCustomAllergens] = useState<string[]>([]);
  //Modal for adding foods to specific days/meals
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedFoodState, setSelectedFoodState] = useState<FoodItem | null>(null);
  const [selectedModalDay, setSelectedModalDay] = useState<DayOfWeek>(0);
  const [selectedMealTime, setSelectedMealTime] = useState<MealTime>('breakfast');
  const [servings, setServings] = useState<string>('1');
  //Update days in month when year or month changes
  useEffect(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const newDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    setDays(newDays);
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [selectedYear, selectedMonth, selectedDay]);
  //Fill out user stats based on default settings or route params
  useEffect(() => {
    if(useDefaultStats && userData){
      setWeight(userData.weight?.toString() || '');
      setHeightFeet(userData.heightFt?.toString() || '');
      setHeightInches(userData.heightIn?.toString() || '');
      setDob(userData.dob || '');
      if(userData.dob){
        const [month, day, year] = userData.dob.split('/').map(Number);
        setSelectedMonth(month - 1);
        setSelectedDay(day);
        setSelectedYear(year);
      }
      setGender(userData.gender || paramGender || 'male');
      setActivityLevel(userData.activityLevel || 'moderate');
      setSelectedAllergens(userData.allergies || []);
      setCustomAllergens(userData.customAllergens || []);
    } else{
      setWeight(paramWeight?.toString() || '');
      setHeightFeet('');
      setHeightInches('');
      setDob('');
      setSelectedMonth(0);
      setSelectedDay(1);
      setSelectedYear(new Date().getFullYear() - 25);
      setGender(paramGender || 'male');
      setActivityLevel('moderate');
      setSelectedAllergens([]);
      setCustomAllergens([]);
    }
  }, [useDefaultStats, userData, paramWeight, paramGender]);
  //Update calorie and macro targets when user stats change
  useEffect(() => {
    if(weight && heightFeet && dob){
      const weightLbs: number = parseFloat(weight);
      const feet: number = parseFloat(heightFeet) || 0;
      const inches: number = parseFloat(heightInches) || 0;
      const totalHeightInches: number = feet * 12 + inches;
      if(!isNaN(weightLbs) && !isNaN(totalHeightInches)){ //Calculate targets based on user stats
        updateCalorieAndMacroTargets(weightLbs, totalHeightInches, dob, gender, activityLevel, goal);
      }
    }
  }, [weight, heightFeet, heightInches, dob, activityLevel, goal, gender, updateCalorieAndMacroTargets]);
  //Prevent navigation without confirming unsaved changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if(!planName && selectedFoods.length === 0){
        return;
      }
      e.preventDefault();
      handleCancel(() => navigation.dispatch(e.data.action));
    });
    return unsubscribe; //Clean up listener on component unmount
  }, [navigation, planName, selectedFoods]);

  const handleAddFood = useCallback((food: FoodItem) => {
    setSelectedFoodState(food);
    setSelectedModalDay(0);
    setSelectedMealTime('breakfast');
    setServings('1');
    setModalVisible(true);
  }, []);
  //Handle food passed from FoodDetails screen
  useEffect(() => {
    if(selectedFood){
      console.log('Received food from FoodDetails: ', selectedFood);
      handleAddFood(selectedFood);
    }
  }, [selectedFood, handleAddFood]);

  const confirmAddFood = () => {
    if(!selectedFoodState){
      console.log('No selected food');
      return;
    }
    const servingsNum: number = parseInt(servings, 10);
    if(isNaN(servingsNum) || servingsNum <= 0){
      Alert.alert('Error', 'Please enter a valid number of servings.');
      return;
    }
    const newFood: ScheduledFoodItem = {
      ...selectedFoodState,
      day: selectedModalDay,
      mealTime: selectedMealTime,
      servings: servingsNum,
      planId: tempPlanId,
    };
    console.log('Adding new food:', newFood);
    setSelectedFoods([...selectedFoods, newFood]);
    console.log('Updated selectedFoods:', [...selectedFoods, newFood]);
    setModalVisible(false);
    setSelectedFoodState(null);
    setServings('1');
  };
  //Format DOB as MM/DD/YYYY
  const formatDob = (): string => {
    const month = String(selectedMonth + 1).padStart(2, '0');
    const day = String(selectedDay).padStart(2, '0');
    const year = selectedYear;
    return `${month}/${day}/${year}`;
  };
  //Make sure user is between 13 and 120 years old
  const validateDob = (): boolean => {
    const dobDate = new Date(selectedYear, selectedMonth, selectedDay);
    const today = new Date();
    const age = today.getFullYear() - dobDate.getFullYear() - (today.getMonth() < dobDate.getMonth() ||
                 (today.getMonth() === dobDate.getMonth() && today.getDate() < dobDate.getDate()) ? 1 : 0);
    return age >= 13 && age <= 120;
  };

  const handleRemoveFood = (foodId: string) => {
    setSelectedFoods(selectedFoods.filter((f) => f.id !== foodId));
  };
  //Handle cancellation with confirmation
  const handleCancel = (navigate?: () => void) => {
    if(planName || selectedFoods.length > 0){
      Alert.alert('Cancel Plan',
        'Are you sure you want to cancel? All changes will be lost.',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            style: 'destructive',
            onPress: () => {
              clearCurrentPlan();
              if(navigate){
                navigate();
              }
              else{
                navigation.goBack();
              }
            },
          },
        ]
      );
    } else{
      clearCurrentPlan();
      if(navigate){
        navigate();
      } else{
        navigation.goBack();
      }
    }
  };
  //Save the nutrtiion plan with validation 
  const handleSave = async () => {
    if(!planName || selectedFoods.length === 0){
      Alert.alert('Error', 'Please add a name and at least one food.');
      return;
    }
    const weightLbs: number = parseFloat(weight);
    const feet: number = parseFloat(heightFeet) || 0;
    const inches: number = parseFloat(heightInches) || 0;
    const totalHeightInches: number = feet * 12 + inches;

    if(isNaN(weightLbs) || isNaN(feet)){
      Alert.alert('Error', 'Please enter valid weight and height.');
      return;
    }
    if(inches >= 12){
      Alert.alert('Error', 'Inches must be less than 12.');
      return;
    }
    if(!validateDob()){
      Alert.alert('Error', 'Please select a valid date of birth (age 13–120).');
      return;
    }
    const dobFormatted = formatDob();
    if(!/^\d{2}\/\d{2}\/\d{4}$/.test(dobFormatted)){
      Alert.alert('Error', 'Invalid date of birth format.');
      return;
    }
    if(!useDefaultStats && customAllergens.some(allergen => !allergen.trim())){
      Alert.alert('Error', 'Custom allergens cannot be empty.');
      return;
    }

    const plan = {
      name: planName,
      goal,
      foods: selectedFoods,
      dailyCalorieTarget,
      macroRatios,
      allergies: selectedAllergens,
      customAllergens,
      userStats: {
        weight: weightLbs,
        height: totalHeightInches,
        dob: dobFormatted,
        gender,
        activityLevel,
      },
    };

    try{
      if(!useDefaultStats && user){
        await updateUserProfile(user.uid, {
          weight: weightLbs,
          heightFt: feet,
          heightIn: inches,
          dob: dobFormatted,
          activityLevel,
          allergies: selectedAllergens,
          customAllergens, 
        }); //Update user profile if not using default stats
      }
      await savePlan(plan);
      Alert.alert('Success', `Plan: ${planName} added to your nutrition plans`, [
        {
          text: 'OK',
          onPress: () => navigation.navigate('ViewNutritionPlan'),
        },
      ]);
      clearCurrentPlan();
    }catch(error){
      console.error('Error saving plan:', error);
      Alert.alert('Error', 'Failed to save your plan. Please try again.');
    }
  };
  //Calculate total plan calories
  const totalCalories = Math.round(selectedFoods.reduce((sum, food) => sum + food.calories * food.servings, 0) * 10) / 10;
  //Provide calorie recommendations based on fitness goal 
  const getRecommendation = () => {
    if (dailyCalorieTarget === 0) return 'Please enter your stats to get personalized recommendations';

    const calorieStatus = Math.abs(totalCalories - dailyCalorieTarget);

    if(goal === 'lose'){
      if(totalCalories > dailyCalorieTarget){
        return `Your plan exceeds your calorie target by ${calorieStatus} calories. Consider removing some high-calorie foods.`;
      }
      else{
        return `Great! Your plan is within your calorie target for weight loss.`;
      }
    } 
    else if(goal === 'gain'){
      if(totalCalories < dailyCalorieTarget){
        return `Your plan is ${calorieStatus} calories below your target. Consider adding more nutrient-dense foods.`;
      }
      else{
        return `Great! Your plan meets your calorie target for muscle gain.`;
      }
    }
    else{
      if(Math.abs(totalCalories - dailyCalorieTarget) > 200){
        return `Your plan is ${calorieStatus} calories ${totalCalories > dailyCalorieTarget ? 'above' : 'below'} your maintenance target.`;
      }
      else{
        return `Great! Your plan is close to your maintenance calorie target.`;
      }
    }
  };

  const caloriesByDay = DAYS_OF_WEEK.reduce((acc, _, index) => {
    const dayCalories = Math.round(selectedFoods.filter((food) => food.day === index).reduce((sum, food) => sum + food.calories * food.servings, 0) * 10) / 10;
    acc[index as DayOfWeek] = dayCalories;
    return acc;
  }, {} as Record<DayOfWeek, number>);

  const getGoalText = (g: 'lose' | 'maintain' | 'gain') => {
    switch (g) {
      case 'lose':
        return 'Lose Weight';
      case 'gain':
        return 'Gain Muscle';
      default:
        return 'Maintain Weight';
    }
  };
  //Sections for FlatList
  const sections = [
    { type: 'planName', data: {} },
    { type: 'goal', data: {} },
    { type: 'statsToggle', data: {} },
    { type: 'stats', data: {} },
    { type: 'targets', data: {} },
    { type: 'search', data: {} },
    { type: 'schedule', data: {} },
    { type: 'summary', data: {} },
    { type: 'buttons', data: {} },
  ];
  //Render each section 
  const renderSection = ({ item }: { item: { type: string; data: any } }) => {
    switch(item.type){
      case 'planName':
        return (
          <View style={localStyles.section}>
            <Text style={styles.sectionTitle}>Create Nutrition Plan</Text>
            <TextInput
              style={styles.input}
              value={planName}
              onChangeText={setPlanName}
              placeholder="Plan Name"
              placeholderTextColor={'gray'}
            />
          </View>
        );
      case 'goal':
        return (
          <View style={localStyles.section}>
            <Text style={localStyles.labelText}>Your Goal:</Text>
            <View style={localStyles.goalContainer}>
              {(['lose', 'maintain', 'gain'] as const).map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGoal(g)}
                  style={[
                    styles.button,
                    goal === g && styles.buttonActive,
                    localStyles.goalButton,
                  ]}
                >
                  <Text style={goal === g ? localStyles.activeButtonText : localStyles.buttonText}>
                    {getGoalText(g)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );
      case 'statsToggle':
        return (
          <View style={localStyles.section}>
            <View style={localStyles.advancedSettingsToggle}>
              <Text style={localStyles.labelText}>Use Profile Stats:</Text>
              <Switch value={useDefaultStats} onValueChange={setUseDefaultStats} />
            </View>
          </View>
        );
      case 'stats':
        return (
          <View style={[localStyles.section, localStyles.statsContainer]}>
            <Text style={localStyles.sectionSubtitle}>Your Stats</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder="Weight (lbs)"
              placeholderTextColor={'gray'}
              keyboardType="numeric"
              editable={!useDefaultStats}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                value={heightFeet}
                onChangeText={(text) => setHeightFeet(text.replace(/[^0-9]/g, ''))}
                placeholder="Height (ft)"
                placeholderTextColor={'gray'}
                keyboardType="numeric"
                editable={!useDefaultStats}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={heightInches}
                onChangeText={(text) => setHeightInches(text.replace(/[^0-9]/g, ''))}
                placeholder="Inches"
                placeholderTextColor={'gray'}
                keyboardType="numeric"
                editable={!useDefaultStats}
              />
            </View>
            <View style={localStyles.dobContainer}>
              <Text style={styles.label}>Date of Birth</Text>
              <View style={localStyles.dobPickersContainer}>
                <View style={localStyles.dobPickerWrapper}>
                  <Text style={localStyles.dobPickerLabel}>Month</Text>
                  <View style={localStyles.pickerContainer}>
                    <Picker
                      selectedValue={selectedMonth}
                      onValueChange={(itemValue) => setSelectedMonth(Number(itemValue))}
                      style={localStyles.dobPicker}
                      enabled={!useDefaultStats}
                      accessibilityLabel="Select month"
                    >
                      {MONTHS.map((month, index) => (
                        <Picker.Item key={month} label={month} value={index} />
                      ))}
                    </Picker>
                  </View>
                </View>
                <View style={localStyles.dobPickerWrapper}>
                  <Text style={localStyles.dobPickerLabel}>Day</Text>
                  <View style={localStyles.pickerContainer}>
                    <Picker
                      selectedValue={selectedDay}
                      onValueChange={(itemValue) => setSelectedDay(Number(itemValue))}
                      style={localStyles.dobPicker}
                      enabled={!useDefaultStats}
                      accessibilityLabel="Select day"
                    >
                      {days.map((day) => (
                        <Picker.Item key={day} label={String(day)} value={day} />
                      ))}
                    </Picker>
                  </View>
                </View>
                <View style={localStyles.dobPickerWrapper}>
                  <Text style={localStyles.dobPickerLabel}>Year</Text>
                  <View style={localStyles.pickerContainer}>
                    <Picker
                      selectedValue={selectedYear}
                      onValueChange={(itemValue) => setSelectedYear(Number(itemValue))}
                      style={localStyles.dobPicker}
                      enabled={!useDefaultStats}
                      accessibilityLabel="Select year"
                    >
                      {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <Picker.Item key={year} label={String(year)} value={year} />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.button, { marginTop: theme.spacing.sm }]}
                onPress={() => {
                  if (validateDob()) {
                    setDob(formatDob());
                    console.log('DOB Valid:', formatDob());
                  } else {
                    Alert.alert('Error', 'Please select a valid date of birth (age 13–120).');
                  }
                }}
                disabled={useDefaultStats}
              >
                <Text style={styles.buttonText}>Validate DOB</Text>
              </TouchableOpacity>
            </View>
            <Text style={localStyles.labelText}>Gender:</Text>
            <View style={localStyles.genderContainer}>
              {(['male', 'female'] as Gender[]).map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGender(g)}
                  style={[
                    localStyles.genderButton,
                    gender === g && localStyles.genderButtonActive,
                    useDefaultStats && localStyles.genderButtonDisabled,
                  ]}
                  disabled={useDefaultStats}
                >
                  <Text style={gender === g ? localStyles.activeButtonText : localStyles.buttonText}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={localStyles.labelText}>Activity Level:</Text>
            <View style={localStyles.activityContainer}>
              {(['sedentary', 'light', 'moderate', 'active', 'veryActive'] as const).map((level) => (
                <Pressable
                  key={level}
                  onPress={() => setActivityLevel(level)}
                  style={[
                    localStyles.activityButton,
                    activityLevel === level && localStyles.activityButtonActive,
                    !useDefaultStats && localStyles.editableActivityButton,
                  ]}
                  disabled={useDefaultStats}
                >
                  <Text style={activityLevel === level ? localStyles.activeButtonText : localStyles.buttonText}>
                    {level.charAt(0).toUpperCase() + level.slice(1).replace(/([A-Z])/g, ' $1')}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={localStyles.labelText}>Allergies:</Text>
            {useDefaultStats ? (
              <Text style={localStyles.allergenText}>
                {[...selectedAllergens, ...customAllergens].length > 0 ? [...selectedAllergens, ...customAllergens].join(', '): 'None'}
              </Text>
            ) : (
              <AllergenSelector
                selectedAllergens={selectedAllergens}
                customAllergens={customAllergens}
                onAllergensChange={(allergens: string[]) => setSelectedAllergens(allergens)}
                onCustomAllergensChange={(allergens: string[]) => setCustomAllergens(allergens)}
                showDisclaimer={true}
              />
            )}
          </View>
        );
      case 'targets':
        return dailyCalorieTarget > 0 ? (
          <View style={[localStyles.section, localStyles.targetsContainer]}>
            <Text style={localStyles.sectionSubtitle}>Your Daily Targets</Text>
            <Text style={localStyles.targetText}>Calories: {dailyCalorieTarget} cals</Text>
            <View style={localStyles.macrosContainer}>
              <Text style={localStyles.macroText}>Protein: {macroRatios.protein}%</Text>
              <Text style={localStyles.macroText}>Carbs: {macroRatios.carbs}%</Text>
              <Text style={localStyles.macroText}>Fat: {macroRatios.fat}%</Text>
            </View>
          </View>
        ) : null;
      case 'search':
        return (
          <View style={[localStyles.section, localStyles.searchSection]}>
            <Text style={localStyles.sectionSubtitle}>Add Foods to Your Plan</Text>
            <FoodSearch
              onSelectFood={handleAddFood}
              selectedAllergens={selectedAllergens}
              customAllergens={customAllergens}
            />
          </View>
        );
      case 'schedule':
        return (
          <View style={localStyles.section}>
            <Text style={styles.sectionTitle}>Schedule Your Meals</Text>
            <View style={localStyles.daySelectionContainer}>
              <FlatList
                horizontal
                data={DAYS_OF_WEEK}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => {
                  const hasFoods = selectedFoods.some((food) => food.day === index);
                  return (
                    <TouchableOpacity
                      style={[
                        localStyles.dayTab,
                        selectedModalDay === index && localStyles.activeDayTab,
                        hasFoods && localStyles.dayTabWithFoods,
                      ]}
                      onPress={() => setSelectedModalDay(index as DayOfWeek)}
                    >
                      <Text
                        style={[localStyles.dayTabText, selectedModalDay === index && localStyles.activeDayTabText]}
                      >
                        {item.substring(0, 3)}
                      </Text>
                      {hasFoods && <View style={localStyles.foodDot} />}
                    </TouchableOpacity>
                  );
                }}
                showsHorizontalScrollIndicator={false}
              />
            </View>
            <View style={localStyles.dayContent}>
              <Text style={localStyles.selectedDayTitle}>{DAYS_OF_WEEK[selectedModalDay]}</Text>
              <Pressable
                style={localStyles.addFoodButton}
                onPress={() => setModalVisible(true)}
              >
                <Text style={localStyles.addFoodButtonText}>Add Food</Text>
              </Pressable>
              {(() => {
                const dayFoods = selectedFoods.filter((food) => food.day === selectedModalDay);
                if(dayFoods.length > 0){
                  return (
                    <View style={localStyles.foodsContainer}>
                      {dayFoods.map((item) => (
                        <View key={item.id} style={localStyles.foodItem}>
                          <View style={localStyles.foodDetails}>
                            {item.photo && (
                              <Image
                                source={{ uri: item.photo }}
                                style={{ width: 40, height: 40, marginRight: 10 }}
                              />
                            )}
                            <View>
                              <Text style={localStyles.foodName}>{item.name}</Text>
                              <Text style={localStyles.foodCalories}>
                                {Math.round(item.calories * item.servings)} cal | Meal: {item.mealTime || 'Any'} | Servings: {item.servings}
                              </Text>
                            </View>
                          </View>
                          <Pressable
                            onPress={() => handleRemoveFood(item.id)}
                            style={localStyles.removeButton}
                          >
                            <Text style={localStyles.removeText}>✕</Text>
                          </Pressable>
                        </View>
                      ))}
                      {dailyCalorieTarget > 0 && (
                        <View style={localStyles.dayCalorieInfo}>
                          <Text style={localStyles.dayCalorieText}>
                            Estimated: ~{Math.round(caloriesByDay[selectedModalDay] || 0)} calories
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                }
                return (
                  <View style={localStyles.noFoodsContainer}>
                    <Text style={localStyles.noFoodsText}>
                      No foods scheduled for {DAYS_OF_WEEK[selectedModalDay]}
                    </Text>
                  </View>
                );
              })()}
            </View>
          </View>
        );
      case 'summary':
        return selectedFoods.length > 0 && dailyCalorieTarget > 0 ? (
          <View style={[localStyles.section, localStyles.progressContainer]}>
            <Text style={localStyles.sectionSubtitle}>Weekly Summary</Text>
            <Text style={localStyles.targetText}>
              Total Calories: {Math.round(totalCalories)} / {Math.round(dailyCalorieTarget * 7)}
            </Text>
            <View style={localStyles.calorieProgressContainer}>
              <View style={localStyles.progressBar}>
                <View
                  style={[
                    localStyles.progressFill,
                    {
                      width: `${Math.min(100, (totalCalories / (dailyCalorieTarget * 7)) * 100)}%`,
                      backgroundColor: totalCalories > dailyCalorieTarget * 7 ? theme.colors.error : theme.colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
            <Text style={localStyles.recommendationText}>{getRecommendation()}</Text>
          </View>
        ) : null;
      case 'buttons':
        return (
          <View style={[localStyles.section, localStyles.buttonContainer]}>
            <Pressable style={[styles.saveButton, localStyles.saveButton]} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Plan</Text>
            </Pressable>
            <Pressable style={[styles.saveButton, localStyles.cancelButton]} onPress={() => handleCancel()}>
              <Text style={styles.saveButtonText}>Cancel</Text>
            </Pressable>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={sections}
        renderItem={renderSection}
        keyExtractor={(item) => item.type}
        contentContainerStyle={localStyles.contentContainer}
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <Text style={localStyles.modalTitle}>
              Add {selectedFoodState?.name || 'Food'}
            </Text>
            <Text style={localStyles.modalLabel}>Day:</Text>
            <View style={localStyles.pickerContainer}>
              {DAYS_OF_WEEK.map((day, index) => (
                <Pressable
                  key={day}
                  onPress={() => setSelectedModalDay(index as DayOfWeek)}
                  style={selectedModalDay === index ? [localStyles.dayButton, localStyles.dayButtonActive]: localStyles.dayButton}
                  accessibilityLabel={`Select ${day}`}
                >
                  <Text
                    style={selectedModalDay === index ? localStyles.activeText: localStyles.inactiveText}
                  >
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
                  style={
                    selectedMealTime === meal
                      ? [localStyles.mealButton, localStyles.mealButtonActive]
                      : localStyles.mealButton
                  }
                  accessibilityLabel={`Select ${meal}`}
                >
                  <Text
                    style={selectedMealTime === meal ? localStyles.activeText: localStyles.inactiveText}
                  >
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
              placeholderTextColor={'gray'}
              accessibilityLabel="Enter number of servings"
            />
            <View style={localStyles.modalButtonContainer}>
              <Pressable
                style={[localStyles.modalButton, localStyles.cancelButton]}
                onPress={() => setModalVisible(false)}
                accessibilityLabel="Cancel food selection"
              >
                <Text style={localStyles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[localStyles.modalButton, localStyles.confirmButton]}
                onPress={confirmAddFood}
                accessibilityLabel="Confirm food selection"
              >
                <Text style={localStyles.modalButtonText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const localStyles = StyleSheet.create({
  contentContainer: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.cardBackground || '#fff',
    borderRadius: 12,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: theme.spacing.md,
  },
  goalButton: {
    flex: 1,
    margin: 4,
    paddingVertical: 12,
  },
  searchSection: {
    marginVertical: theme.spacing.md,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: theme.spacing.sm,
  },
  foodDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  foodCalories: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center'
  },
  removeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsContainer: {
    backgroundColor: '#f5f5f5',
    padding: theme.spacing.md,
    borderRadius: 8,
    marginVertical: theme.spacing.md,
  },
  advancedSettingsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
  },
  targetsContainer: {
    backgroundColor: '#f0f8ff',
    padding: theme.spacing.md,
    borderRadius: 8,
    marginVertical: theme.spacing.md,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    color: theme.colors.primary,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: theme.spacing.sm,
    marginBottom: 4,
  },
  activityContainer: {
    flexDirection: 'column',
  },
  activityButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 2,
    borderRadius: 4,
    backgroundColor: '#eee',
  },
  editableActivityButton: {
    backgroundColor: '#ddd',
  },
  activityButtonActive: {
    backgroundColor: theme.colors.primary || '#007bff',
  },
  buttonText: {
    textAlign: 'center',
    color: theme.colors.text,
  },
  activeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: theme.spacing.sm,
  },
  genderButton: {
    flex: 1,
    padding: theme.spacing.sm,
    marginHorizontal: 4,
    borderRadius: 4,
    backgroundColor: '#eee',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: theme.colors.primary || '#007bff',
  },
  genderButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  allergenText: {
    fontSize: 14,
    color: '#666',
    marginBottom: theme.spacing.sm,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  targetText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  macroText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  progressContainer: {
    backgroundColor: '#f9f9f9',
    padding: theme.spacing.md,
    borderRadius: 8,
    marginVertical: theme.spacing.md,
  },
  calorieProgressContainer: {
    marginVertical: theme.spacing.sm,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  recommendationText: {
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
    color: theme.colors.textSecondary,
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
    color: theme.colors.text,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
    color: theme.colors.text,
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
    minWidth: 50,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: theme.colors.primary || '#007bff',
  },
  mealButton: {
    padding: 8,
    margin: 4,
    borderRadius: 4,
    backgroundColor: '#eee',
    minWidth: 80,
    alignItems: 'center',
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
    backgroundColor: theme.colors.error || '#ccc',
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary || '#007bff',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  saveButton: {
    flex: 1,
    marginRight: 8,
  },
  daySelectionContainer: {
    marginBottom: theme.spacing.md,
  },
  dayTab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
    backgroundColor: '#f0f0f0',
    minWidth: 70,
    alignItems: 'center',
  },
  activeDayTab: {
    backgroundColor: theme.colors.primary,
  },
  dayTabWithFoods: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  dayTabText: {
    fontWeight: '500',
    color: theme.colors.text,
  },
  activeDayTabText: {
    color: 'white',
  },
  foodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent || 'orange',
    marginTop: 4,
  },
  dayContent: {
    padding: theme.spacing.sm,
  },
  selectedDayTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  addFoodButton: {
    backgroundColor: theme.colors.accent || '#4CAF50',
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  addFoodButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  foodsContainer: {
    marginTop: theme.spacing.sm,
  },
  noFoodsContainer: {
    padding: theme.spacing.md,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  noFoodsText: {
    color: theme.colors.textSecondary,
  },
  dayCalorieInfo: {
    alignItems: 'flex-end',
    marginTop: theme.spacing.sm,
  },
  dayCalorieText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  dobContainer: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  dobPickersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: 'gray'
  },
  dobPickerWrapper: {
    flex: 1,
  },
  dobPickerLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  dobPicker: {
    height: Platform.OS === 'ios' ? 120 : 50,
    width: '100%',
  },
});

export default CreateNutritionPlanScreen;
