import React, { useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { NutritionStackParamList, FoodItem } from '../types/types';
import { styles } from '../styles/styles';
import { theme } from '../styles/theme';

type FoodDetailsScreenNavigationProp = StackNavigationProp<NutritionStackParamList, 'FoodDetailsScreen'>;
type FoodDetailsScreenRouteProp = RouteProp<NutritionStackParamList, 'FoodDetailsScreen'>;

type FoodDetailsScreenProps = {
  navigation: FoodDetailsScreenNavigationProp;
  route: FoodDetailsScreenRouteProp;
};

const FoodDetailsScreen = ({ navigation, route }: FoodDetailsScreenProps) => {
  const { food } = route.params;
  const [showMacronutrients, setShowMacronutrients] = useState(true);
  const [showMicronutrients, setShowMicronutrients] = useState(false);
  const [showServingSizes, setShowServingSizes] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);
  const [selectedServing, setSelectedServing] = useState(food.altMeasures?.[0] || { measure: 'default', qty: 1, serving_weight: food.servingWeight || 0 });

  //Handle back navigation
  const handleGoBack = () => {
    navigation.goBack();
  };

  //Scale nutritional values based on selected serving size
  const scaleNutrient = (nutrient: number | undefined, baseWeight: number) => {
    if(!nutrient || !baseWeight || !selectedServing.serving_weight){
      return 0;
    }
    return (nutrient * selectedServing.serving_weight) / baseWeight;
  };

  //Calculate macro ratios based on scaled values
  const scaledCalories = scaleNutrient(food.calories, food.servingWeight || 0);
  const scaledCarbs = scaleNutrient(food.carbs, food.servingWeight || 0);
  const scaledProtein = scaleNutrient(food.protein, food.servingWeight || 0);
  const scaledFat = scaleNutrient(food.fat, food.servingWeight || 0);
  //Convert macros to calories for ratio calculation
  const totalCalories = scaledCalories || 0;
  const carbCalories = scaledCarbs * 4;
  const proteinCalories = scaledProtein * 4;
  const fatCalories = scaledFat * 9;
  //Calculate macro ratios as precentages
  const macroRatios = {
    carbs: totalCalories ? ((carbCalories / totalCalories) * 100).toFixed(1) : '0',
    protein: totalCalories ? ((proteinCalories / totalCalories) * 100).toFixed(1) : '0',
    fat: totalCalories ? ((fatCalories / totalCalories) * 100).toFixed(1) : '0',
  };
  //Add scaled food item to nutrition lan
  const handleAddFood = () => {
    const scaledFood: FoodItem = {
      ...food,
      calories: scaledCalories,
      carbs: scaledCarbs,
      protein: scaledProtein,
      fat: scaledFat,
      servingWeight: selectedServing.serving_weight,
      sugars: scaleNutrient(food.sugars, food.servingWeight || 0),
      fiber: scaleNutrient(food.fiber, food.servingWeight || 0),
      potassium: scaleNutrient(food.potassium, food.servingWeight || 0),
      sodium: scaleNutrient(food.sodium, food.servingWeight || 0),
      calcium: scaleNutrient(food.calcium, food.servingWeight || 0),
      iron: scaleNutrient(food.iron, food.servingWeight || 0),
      vitaminC: scaleNutrient(food.vitaminC, food.servingWeight || 0),
    };
    console.log('Navigating with scaled food:', scaledFood);
    navigation.navigate('CreateNutritionPlan', {
      selectedFood: scaledFood,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={localStyles.contentContainer}>
      {/*Header with back button, food name, and add button*/}
      <View style={styles.header}>
        <Pressable onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.title, localStyles.headerTitle]}>{food.name}</Text>
        <Pressable style={styles.addButton} onPress={handleAddFood}>
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.buttonText}>Add to Plan</Text>
        </Pressable>
      </View>
      {/*Show food photo provided by Nutrionix API if available */}
      {food.photo && (
        <Image
          source={{ uri: food.photo }}
          style={localStyles.image}
          resizeMode="cover"
        />
      )}
      <View style={localStyles.nutritionContainer}>
        <TouchableOpacity
          onPress={() => setShowMacronutrients(!showMacronutrients)}
          style={localStyles.toggleButton}
        >
          <Text style={localStyles.sectionTitle}>
            Macronutrients {showMacronutrients ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>
        {showMacronutrients && (
          <View style={localStyles.nutrientList}>
            {/*Round calories */}
            <Text style={localStyles.nutritionText}>Calories: {Math.round(scaledCalories)} cal</Text>
            <Text style={localStyles.nutritionText}>Carbs: {scaledCarbs.toFixed(1)} g</Text>
            <Text style={localStyles.nutritionText}>Fat: {scaledFat.toFixed(1)} g</Text>
            <Text style={localStyles.nutritionText}>Protein: {scaledProtein.toFixed(1)} g</Text>
            <Text style={localStyles.nutritionText}>
              Macro Ratios: Carbs {macroRatios.carbs}%, Protein {macroRatios.protein}%, Fat {macroRatios.fat}%
            </Text>
            {/*Visual bar chart showing macro ratios */}
            <View style={localStyles.macroBars}>
              <View style={[localStyles.macroBar, { flex: parseFloat(macroRatios.carbs), backgroundColor: '#4caf50' }]} />
              <View style={[localStyles.macroBar, { flex: parseFloat(macroRatios.protein), backgroundColor: '#f44336' }]} />
              <View style={[localStyles.macroBar, { flex: parseFloat(macroRatios.fat), backgroundColor: '#ffeb3b' }]} />
            </View>
          </View>
        )}
      </View>
      <View style={localStyles.nutritionContainer}>
        <TouchableOpacity
          onPress={() => setShowMicronutrients(!showMicronutrients)}
          style={localStyles.toggleButton}
        >
          <Text style={localStyles.sectionTitle}>
            Micronutrients {showMicronutrients ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>
        {showMicronutrients && (
          <View style={localStyles.nutrientList}>
            <Text style={localStyles.nutritionText}>Sugars: {scaleNutrient(food.sugars, food.servingWeight || 0).toFixed(1)} g</Text>
            <Text style={localStyles.nutritionText}>Fiber: {scaleNutrient(food.fiber, food.servingWeight || 0).toFixed(1)} g</Text>
            <Text style={localStyles.nutritionText}>Potassium: {scaleNutrient(food.potassium, food.servingWeight || 0).toFixed(0)} mg</Text>
            <Text style={localStyles.nutritionText}>Sodium: {scaleNutrient(food.sodium, food.servingWeight || 0).toFixed(0)} mg</Text>
            <Text style={localStyles.nutritionText}>Calcium: {scaleNutrient(food.calcium, food.servingWeight || 0).toFixed(0)} mg</Text>
            <Text style={localStyles.nutritionText}>Iron: {scaleNutrient(food.iron, food.servingWeight || 0).toFixed(1)} mg</Text>
            <Text style={localStyles.nutritionText}>Vitamin C: {scaleNutrient(food.vitaminC, food.servingWeight || 0).toFixed(0)} mg</Text>
          </View>
        )}
      </View>
      {food.altMeasures && food.altMeasures.length > 0 && (
        <View style={localStyles.servingContainer}>
          <TouchableOpacity
            onPress={() => setShowServingSizes(!showServingSizes)}
            style={localStyles.toggleButton}
          >
            <Text style={localStyles.sectionTitle}>
              Serving Sizes {showServingSizes ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
          {showServingSizes && (
            <View style={localStyles.nutrientList}>
              {/*Picker for changing serving size */}
              <Picker
                selectedValue={selectedServing}
                onValueChange={(itemValue) => setSelectedServing(itemValue)}
                style={localStyles.picker}
              >
                {food.altMeasures.map((measure, index) => (
                  <Picker.Item
                    key={index}
                    label={`${measure.qty} ${measure.measure} (${measure.serving_weight}g)`}
                    value={measure}
                  />
                ))}
              </Picker>
              {food.altMeasures.map((measure, index) => (
                <Text key={index} style={localStyles.nutritionText}>
                  {measure.qty} {measure.measure} ({measure.serving_weight}g)
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
      <View style={localStyles.ingredientsContainer}>
        <TouchableOpacity
          onPress={() => setShowIngredients(!showIngredients)}
          style={localStyles.toggleButton}
        >
          <Text style={localStyles.sectionTitle}>
            Ingredients {showIngredients ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>
        {showIngredients && (
          <View style={localStyles.nutrientList}>
            {food.ingredients && food.ingredients.length > 0 ? (
              food.ingredients.map((ingredient, index) => (
                <Text key={index} style={localStyles.nutritionText}>
                  • ${ingredient}
                </Text>
              ))
            ) : (
              <Text style={localStyles.nutritionText}>No ingredients listed</Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const localStyles = StyleSheet.create({
  contentContainer: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.md,
  },
  nutritionContainer: {
    backgroundColor: theme.colors.secondaryBackground,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  servingContainer: {
    backgroundColor: theme.colors.secondaryBackground,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  ingredientsContainer: {
    backgroundColor: theme.colors.secondaryBackground,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  nutrientList: {
    paddingLeft: theme.spacing.sm,
  },
  nutritionText: {
    fontSize: 16,
    color: theme.colors.text,
    marginVertical: theme.spacing.xs,
  },
  toggleButton: {
    marginBottom: theme.spacing.sm,
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: theme.spacing.sm,
  },
  macroBars: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  macroBar: {
    height: '100%',
  },
});

export default FoodDetailsScreen;