import React, { useState, useEffect } from 'react';
import { View, TextInput, Pressable, FlatList, Text, Image, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNutritionPlan } from '../context/NutritionContext';
import { styles } from '../styles/styles';
import { FoodItem, NutritionStackParamList } from '../types/types';
import { theme } from '../styles/theme';
const SEARCH_PLAN_ID = 'search';

type FoodSearchProps = {
  onSelectFood: (food: FoodItem) => void;
  selectedAllergens: string[];
  customAllergens: string[];
};

type NavigationProp = StackNavigationProp<NutritionStackParamList, 'FoodDetailsScreen'>;

const FoodSearch = ({ onSelectFood, selectedAllergens, customAllergens }: FoodSearchProps) => {
  const navigation = useNavigation<NavigationProp>();
  const { searchFood, getNutrients } = useNutritionPlan();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  //Listen for food selection result from FoodDetailsScreen
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      const params = (e.data?.action?.payload || {}) as { result?: { food: FoodItem } };
      if (params?.result?.food) {
        onSelectFood(params.result.food);
      }
    });
    return unsubscribe;
  }, [navigation, onSelectFood]);

  const handleSearch = async () => {
    const foods = await searchFood(query);
    setResults(foods);
  };
  //Check if a food contains any user allergens
  const hasAllergen = (foodName: string, foodAllergens: { [key: string]: boolean } | undefined) => {
    if (!foodAllergens) return { matches: false, matchedAllergens: [] };
    const allAllergens = [...selectedAllergens, ...customAllergens].map(a => a.toLowerCase());
    const matchedAllergens = Object.keys(foodAllergens)
      .filter(allergen => foodAllergens[allergen] && allAllergens.includes(allergen.toLowerCase()));
    //Additional check for allergens in the food name 
    const allergenMatchesInName = allAllergens.filter(allergen => foodName.toLowerCase().includes(allergen));
    const finalMatchedAllergens = [...matchedAllergens, ...allergenMatchesInName];
    return { matches: finalMatchedAllergens.length > 0, matchedAllergens: finalMatchedAllergens };
  };

  const handleFoodSelect = async (food: FoodItem) => {
    const allergenInfo = hasAllergen(food.name, food.allergens);
    if (allergenInfo.matches) {
      Alert.alert(
        'Allergen Warning',
        `${food.name} contains allergens: ${allergenInfo.matchedAllergens.join(', ')}. Proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add',
            onPress: async () => {
              const detailedFood = await getNutrients(food.name, SEARCH_PLAN_ID);
              navigation.navigate('FoodDetailsScreen', {
                food: { ...detailedFood, photo: food.photo },
              });
            },
          },
        ]
      );
    } else {
      const detailedFood = await getNutrients(food.name, SEARCH_PLAN_ID);
      navigation.navigate('FoodDetailsScreen', {
        food: { ...detailedFood, photo: food.photo },
      });
    }
  };

  return (
    <View style={localStyles.container}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Search Foods"
        placeholderTextColor={'gray'}
      />
      <Pressable style={styles.button} onPress={handleSearch}>
        <Text style={styles.buttonText}>Search</Text>
      </Pressable>
      <FlatList
        data={results}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => {
          const allergenInfo = hasAllergen(item.name, item.allergens);
          return (
            <Pressable
              onPress={() => handleFoodSelect(item)}
              style={[
                localStyles.foodItem,
                allergenInfo.matches && localStyles.allergenWarning,
              ]}
            >
              <View style={localStyles.foodRow}>
                {item.photo && (
                  <Image
                    source={{ uri: item.photo }}
                    style={{ width: 50, height: 50, marginRight: 10 }}
                  />
                )}
                <Text style={localStyles.foodName}>{item.name}</Text>
                {allergenInfo.matches && (
                  <Text style={localStyles.warningText}>
                    ⚠️ Contains: {allergenInfo.matchedAllergens.join(', ')}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        }}
        nestedScrollEnabled={true}
      />
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    // Removed flex: 1 to avoid stretching
  },
  foodItem: {
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  allergenWarning: {
    borderColor: theme.colors.error || '#ff0000',
    borderWidth: 2,
    backgroundColor: '#fff0f0',
    borderRadius: 4,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodName: {
    fontSize: 16,
    fontWeight: '500',
  },
  warningText: {
    color: theme.colors.error || '#ff0000',
    marginLeft: 10,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default FoodSearch;