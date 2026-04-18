import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNutritionPlan } from '../context/NutritionContext';
import { NutritionPlan, MacroRatios } from '../types/types';
import { theme } from '../styles/theme';

const screenWidth = Dimensions.get('window').width;

interface MacroChartProps {
  nutritionData?: MacroRatios;
  planName?: string;
}

const MacroDistributionChart: React.FC<MacroChartProps> = ({ nutritionData, planName }) => {
  const { nutritionPlans, loading } = useNutritionPlan();
  const [selectedMacro, setSelectedMacro] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<number | 'combined'>('combined');

  //Round to 2 decimal places
  const roundToTwoDecimals = (value: number): number => {
    return Math.round(value*100) / 100;
  };

  const transformedPlans = nutritionPlans.map((plan: NutritionPlan) => ({
    name: plan.name,
    protein: roundToTwoDecimals(plan.foods.reduce((sum, food) => sum + (food.protein || 0) * (food.servings || 1), 0)),
    carbs: roundToTwoDecimals(plan.foods.reduce((sum, food) => sum + (food.carbs || 0) * (food.servings || 1), 0)),
    fat: roundToTwoDecimals(plan.foods.reduce((sum, food) => sum + (food.fat || 0) * (food.servings || 1), 0)),
  }));

  const combinedData = transformedPlans.reduce(
    (acc, plan) => ({
      protein: roundToTwoDecimals(acc.protein + plan.protein),
      carbs: roundToTwoDecimals(acc.carbs + plan.carbs),
      fat: roundToTwoDecimals(acc.fat + plan.fat),
    }),
    { protein: 0, carbs: 0, fat: 0 }
  );

  const currentData = nutritionData 
    ? nutritionData 
    : (selectedPlan === 'combined' 
        ? combinedData 
        : transformedPlans[selectedPlan as number]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!nutritionData && !transformedPlans.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No nutrition plans available</Text>
      </View>
    );
  }

  const totalGrams = roundToTwoDecimals(currentData.protein + currentData.carbs + currentData.fat) || 1;
  const calories = {
    protein: roundToTwoDecimals(currentData.protein * 4),
    carbs: roundToTwoDecimals(currentData.carbs * 4),
    fat: roundToTwoDecimals(currentData.fat * 9),
  };
  const totalCalories = Math.round(calories.protein + calories.carbs + calories.fat);

  const data = [
    {
      name: 'Protein',
      value: currentData.protein,
      calories: Math.round(calories.protein),
      percentage: Math.round((currentData.protein / totalGrams) * 100),
      color: '#4CAF50',
    },
    {
      name: 'Carbs',
      value: currentData.carbs,
      calories: Math.round(calories.carbs),
      percentage: Math.round((currentData.carbs / totalGrams) * 100),
      color: '#2196F3',
    },
    {
      name: 'Fat',
      value: currentData.fat,
      calories: Math.round(calories.fat),
      percentage: Math.round((currentData.fat / totalGrams) * 100),
      color: '#FFC107',
    },
  ];

  const renderCustomizedPieChart = () => {
    let startAngle = -90;

    return (
      <View style={styles.pieChartContainer}>
        <View style={styles.pieBorder}>
          <Svg width={160} height={160}>
            {data.map((item, index) => {
              const angle = (item.value / totalGrams) * 360;
              const endAngle = startAngle + angle;
              const startAngleRad = (startAngle * Math.PI) / 180;
              const endAngleRad = (endAngle * Math.PI) / 180;
              const radius = 70;
              const centerX = 80;
              const centerY = 80;
              const largeArcFlag = angle > 180 ? 1 : 0;
              const startX = centerX + radius * Math.cos(startAngleRad);
              const startY = centerY + radius * Math.sin(startAngleRad);
              const endX = centerX + radius * Math.cos(endAngleRad);
              const endY = centerY + radius * Math.sin(endAngleRad);
              const path = `
                M ${centerX},${centerY}
                L ${startX},${startY}
                A ${radius},${radius} 0 ${largeArcFlag},1 ${endX},${endY}
                Z
              `;

              const result = (
                <Path
                  key={`segment-${index}`}
                  d={path}
                  fill={item.color}
                  opacity={selectedMacro === item.name ? 1 : 0.85}
                  stroke="#fff"
                  strokeWidth={2}
                  onPress={() => setSelectedMacro(selectedMacro === item.name ? null : item.name)}
                />
              );

              startAngle = endAngle;
              return result;
            })}
          </Svg>
          <View style={styles.centerTextContainer}>
            <Text style={styles.centerTextValue}>{totalCalories}</Text>
            <Text style={styles.centerTextLabel}>calories</Text>
          </View>
        </View>
      </View>
    );
  };

  const displayPlanName = nutritionData && planName 
    ? planName 
    : (selectedPlan === 'combined' 
        ? 'Combined' 
        : transformedPlans[selectedPlan as number]?.name || 'Custom');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Macronutrient Breakdown - {displayPlanName}
      </Text>

      {!nutritionData && transformedPlans.length > 0 && (
        <View style={styles.planSelector}>
          {transformedPlans.map((plan, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.planButton,
                selectedPlan === index && styles.selectedPlanButton,
              ]}
              onPress={() => setSelectedPlan(index)}
            >
              <Text style={styles.planButtonText}>{plan.name}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[
              styles.planButton,
              selectedPlan === 'combined' && styles.selectedPlanButton,
            ]}
            onPress={() => setSelectedPlan('combined')}
          >
            <Text style={styles.planButtonText}>Combined</Text>
          </TouchableOpacity>
        </View>
      )}

      {renderCustomizedPieChart()}
      <View style={styles.legendContainer}>
        {data.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={[
              styles.legendItem,
              selectedMacro === item.name && styles.selectedLegendItem,
            ]}
            onPress={() => setSelectedMacro(selectedMacro === item.name ? null : item.name)}
            activeOpacity={0.7}
          >
            <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
            <View style={styles.legendTextContainer}>
              <Text style={styles.legendLabel}>{item.name}</Text>
              <View style={styles.legendValues}>
                <Text style={styles.legendValue}>{item.value.toFixed(1)}g</Text>
                <Text style={styles.legendPercentage}>{item.percentage}%</Text>
              </View>
              {selectedMacro === item.name && (
                <Text style={styles.calorieText}>{item.calories} calories</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Tap segments or legend items for details</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  pieChartContainer: {
    alignItems: 'center',
  },
  pieBorder: {
    position: 'relative',
  },
  centerTextContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -20 }],
    alignItems: 'center',
  },
  centerTextValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  centerTextLabel: {
    fontSize: 12,
    color: '#666',
  },
  legendContainer: {
    marginTop: theme.spacing.lg,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: 4,
    marginVertical: 4,
  },
  selectedLegendItem: {
    backgroundColor: '#f0f0f0',
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.sm,
  },
  legendTextContainer: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  legendValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendValue: {
    fontSize: 14,
    color: '#333',
  },
  legendPercentage: {
    fontSize: 14,
    color: '#666',
  },
  calorieText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  infoContainer: {
    marginTop: theme.spacing.md,
  },
  infoText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  planSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  planButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    margin: 4,
  },
  selectedPlanButton: {
    backgroundColor: theme.colors.primary,
  },
  planButtonText: {
    color: '#333',
    fontSize: 14,
  },
});

export default MacroDistributionChart;