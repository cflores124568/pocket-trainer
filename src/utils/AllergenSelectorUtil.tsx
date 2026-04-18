import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { theme } from '../styles/theme';

// Only Nutritionix-supported allergens
export const NUTRITIONIX_SUPPORTED_ALLERGENS : {id: string; name: string}[]= [
  { id: 'dairy', name: 'Dairy' },
  { id: 'peanuts', name: 'Peanuts' },
  { id: 'tree_nuts', name: 'Tree Nuts' },
  { id: 'eggs', name: 'Eggs' },
  { id: 'fish', name: 'Fish' },
  { id: 'shellfish', name: 'Shellfish' },
  { id: 'wheat', name: 'Wheat' },
  { id: 'gluten', name: 'Gluten' },
  { id: 'soy', name: 'Soy' },
  { id: 'sesame', name: 'Sesame' },
];

type AllergenSelectorProps = {
  selectedAllergens: string[];
  customAllergens: string[];
  onAllergensChange: (allergens: string[]) => void;
  onCustomAllergensChange: (allergens: string[]) => void;
  showDisclaimer?: boolean;
};

const AllergenSelector = ({
  selectedAllergens,
  customAllergens,
  onAllergensChange,
  onCustomAllergensChange,
  showDisclaimer = true,
}: AllergenSelectorProps) => {
  const [customInput, setCustomInput] = useState('');
  
  const toggleAllergen = (allergenId: string) => {
    const updatedAllergens = selectedAllergens.includes(allergenId)
      ? selectedAllergens.filter((id) => id !== allergenId)
      : [...selectedAllergens, allergenId];
    onAllergensChange(updatedAllergens);
  };

  const addCustomAllergen = () => {
    if (customInput.trim() && !customAllergens.includes(customInput.trim())) {
      const updatedCustomAllergens = [...customAllergens, customInput.trim()];
      onCustomAllergensChange(updatedCustomAllergens);
      setCustomInput('');
    }
  };

  const removeCustomAllergen = (allergen: string) => {
    const updatedCustomAllergens = customAllergens.filter(item => item !== allergen);
    onCustomAllergensChange(updatedCustomAllergens);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Food Allergies (Select all that apply)</Text>
      
      {showDisclaimer && (
        <Text style={styles.disclaimerText}>
          Select common allergies to receive warnings when searching foods. Our food search 
          will automatically check for these allergens in products.
        </Text>
      )}
      
      <ScrollView contentContainerStyle={styles.allergensGrid}>
        {NUTRITIONIX_SUPPORTED_ALLERGENS.map((allergen) => (
          <TouchableOpacity
            key={allergen.id}
            style={[
              styles.allergenButton,
              selectedAllergens.includes(allergen.id) && styles.allergenButtonActive,
            ]}
            onPress={() => toggleAllergen(allergen.id)}
          >
            <Text
              style={[
                styles.allergenButtonText,
                selectedAllergens.includes(allergen.id) && styles.allergenButtonTextActive,
              ]}
            >
              {allergen.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.customSection}>
        <Text style={styles.subLabel}>Add Other Allergies</Text>
        <Text style={styles.disclaimerText}>
          Add any additional allergies to track. Note: These will not be automatically
          checked by our search but will appear in your profile.
        </Text>
        
        <View style={styles.customInputContainer}>
          <TextInput
            style={styles.customInput}
            placeholder="List Allergies"
            value={customInput}
            onChangeText={setCustomInput}
            returnKeyType="done"
            onSubmitEditing={addCustomAllergen}
          />
          <TouchableOpacity 
            style={styles.addButton}
            onPress={addCustomAllergen}
            disabled={!customInput.trim()}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        
        {customAllergens.length > 0 && (
          <View style={styles.customAllergensList}>
            <Text style={styles.customAllergensTitle}>Your custom allergies:</Text>
            <View style={styles.customAllergensChips}>
              {customAllergens.map((allergen) => (
                <View key={allergen} style={styles.customAllergenChip}>
                  <Text style={styles.customAllergenText}>{allergen}</Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeCustomAllergen(allergen)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subLabel: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '500',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  disclaimerText: {
    fontSize: 12,
    color: theme.colors.textSecondary || '#666',
    marginBottom: theme.spacing.sm,
  },
  allergensGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  allergenButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.secondaryBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
    minWidth: '45%',
  },
  allergenButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  allergenButtonText: {
    color: theme.colors.text,
    fontSize: theme.fonts.sizes.md,
    textAlign: 'center',
  },
  allergenButtonTextActive: {
    color: theme.colors.white,
  },
  customSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fonts.sizes.md,
    backgroundColor: theme.colors.secondaryBackground,
  },
  addButton: {
    marginLeft: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  addButtonText: {
    color: theme.colors.white,
    fontWeight: '500',
  },
  customAllergensList: {
    marginTop: theme.spacing.sm,
  },
  customAllergensTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  customAllergensChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  customAllergenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondaryBackground,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  customAllergenText: {
    fontSize: 14,
    marginRight: 5,
  },
  removeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 20,
  },
});

export default AllergenSelector;