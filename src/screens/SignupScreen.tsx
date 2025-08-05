import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { AuthStackParamList, RootStackParamList, Gender, ActivityLevel } from '../types/types';
import { theme } from '../styles/theme';
import { styles } from '../styles/styles';
import { useAuth } from '../firebase/AuthContext';
import { Picker } from '@react-native-picker/picker';
import AllergenSelector from '../utils/AllergenSelectorUtil';

//Composite navigation prop to access Auth and Root stacks
type SignupScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<AuthStackParamList, 'Signup'>,
  StackNavigationProp<RootStackParamList>
>;

type SignupScreenProps = {
  navigation: SignupScreenNavigationProp;
};

const SignupScreen = ({ navigation }: SignupScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [weight, setWeight] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  
  // DOB picker states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 25); // Default to 25 years ago
  const [selectedMonth, setSelectedMonth] = useState(0); // January
  const [selectedDay, setSelectedDay] = useState(1); // 1st day
  
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('sedentary');
  const [tosAccepted, setTosAccepted] = useState(false);
  const [ppAccepted, setPpAccepted] = useState(false);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [customAllergens, setCustomAllergens] = useState<string[]>([]);

  const { signUp, loading } = useAuth(); //Firebase auth hook
  
  //Generate years array (from 1920 to current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1919 }, (_, i) => currentYear - i);
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const [days, setDays] = useState<number[]>([]);
  
  //Update days array based on selcted month and year
  useEffect(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const newDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    setDays(newDays);
    
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [selectedYear, selectedMonth]);
  
  //Validate DOB to make sure user is 13-120 years old
  const validateDob = (): boolean => {
    const dobDate = new Date(selectedYear, selectedMonth, selectedDay);
    const today = new Date();
    const age = today.getFullYear() - dobDate.getFullYear() -
                (today.getMonth() < dobDate.getMonth() ||
                 (today.getMonth() === dobDate.getMonth() && today.getDate() < dobDate.getDate()) ? 1 : 0);
    return age >= 13 && age <= 120;
  };
  //Format DOB as MM/DD/YYYY
  const formatDob = (): string => {
    const month = String(selectedMonth + 1).padStart(2, '0');
    const day = String(selectedDay).padStart(2, '0');
    const year = selectedYear;
    return `${month}/${day}/${year}`;
  };

  const handleSignup = async () => {
    setError(null);

    if (!tosAccepted || !ppAccepted) {
      setError('You must agree to both the Terms of Service and Privacy Policy.');
      return;
    }

    if (!email || !password || !confirmPassword || !firstName || !lastName || !weight || !heightFt || !heightIn) {
      setError('Please fill out all fields.');
      return;
    }
    //Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }

    const parsedWeight = parseFloat(weight);
    const parsedHeightFt = parseInt(heightFt, 10);
    const parsedHeightIn = parseInt(heightIn, 10);

    //Input validation
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      setError('Please enter a valid weight in lbs.');
      return;
    }
    if (isNaN(parsedHeightFt) || isNaN(parsedHeightIn) || parsedHeightFt < 0 || parsedHeightIn < 0 || parsedHeightIn > 11) {
      setError('Please enter a valid height in feet and inches.');
      return;
    }
    if (!validateDob()) {
      setError('Please select a valid date of birth (age 13–120).');
      return;
    }

    if(customAllergens.some(allergen => !allergen.trim())){
      setError('Custom allergens cannot be empty.');
      return;
    }

    try {
      await signUp(
        email,
        password,
        firstName,
        lastName,
        gender,
        parsedWeight,
        parsedHeightFt,
        parsedHeightIn,
        formatDob(),
        activityLevel,
        selectedAllergens,
        customAllergens
      );
      //Navigate to Home screen after successful signup
      navigation.navigate('Main', { screen: 'Home', params: { screen: 'HomeScreen' } });
    } catch (err: any) {
      let errorMessage = 'An error occurred during sign up.';
      if (err.code) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'Email is already registered.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Please use a stronger password.';
            break;
          default:
            console.error('Firebase error code:', err.code);
            errorMessage = 'An unknown error occurred.';
        }
      }
      setError(errorMessage);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
      <Text style={[styles.homeScreenTitle, { color: theme.colors.text }]}>Create Account</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
        placeholderTextColor={theme.colors.textSecondary}
      />

      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
        placeholderTextColor={theme.colors.textSecondary}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        placeholderTextColor={theme.colors.textSecondary}
        secureTextEntry
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholderTextColor={theme.colors.textSecondary}
        secureTextEntry
        editable={!loading}
      />

      <View style={localStyles.genderContainer}>
        <Text style={styles.label}>Gender</Text>
        <View style={localStyles.genderOptions}>
          {(['male', 'female'] as Gender[]).map((option) => (
            <TouchableOpacity
              key={option}
              style={[localStyles.genderButton, gender === option && localStyles.genderButtonActive]}
              onPress={() => setGender(option)}
              disabled={loading}
            >
              <Text style={[localStyles.genderButtonText, gender === option && localStyles.genderButtonTextActive]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={localStyles.heightContainer}>
        <Text style={styles.label}>Height</Text>
        <View style={localStyles.heightInputs}>
          <TextInput
            style={[styles.input, localStyles.heightInput]}
            placeholder="ft"
            value={heightFt}
            onChangeText={setHeightFt}
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numeric"
          />
          <Text style={localStyles.heightUnit}>ft</Text>
          <TextInput
            style={[styles.input, localStyles.heightInput]}
            placeholder="in"
            value={heightIn}
            onChangeText={setHeightIn}
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numeric"
          />
          <Text style={localStyles.heightUnit}>in</Text>
        </View>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Weight (lbs)"
        value={weight}
        onChangeText={setWeight}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType="numeric"
      />

      {/* Date of Birth Picker */}
      <View style={localStyles.dobContainer}>
        <Text style={styles.label}>Date of Birth</Text>
        <View style={localStyles.dobPickersContainer}>
          {/* Month Picker */}
          <View style={localStyles.dobPickerWrapper}>
            <Text style={localStyles.dobPickerLabel}>Month</Text>
            <View style={localStyles.pickerContainer}>
              <Picker
                selectedValue={selectedMonth}
                onValueChange={(itemValue) => setSelectedMonth(Number(itemValue))}
                style={localStyles.dobPicker}
                itemStyle={localStyles.pickerItem}
              >
                {months.map((month, index) => (
                  <Picker.Item key={month} label={month} value={index} />
                ))}
              </Picker>
            </View>
          </View>
          
          {/* Day Picker */}
          <View style={localStyles.dobPickerWrapper}>
            <Text style={localStyles.dobPickerLabel}>Day</Text>
            <View style={localStyles.pickerContainer}>
              <Picker
                selectedValue={selectedDay}
                onValueChange={(itemValue) => setSelectedDay(Number(itemValue))}
                style={localStyles.dobPicker}
                itemStyle={localStyles.pickerItem}
              >
                {days.map((day) => (
                  <Picker.Item key={day} label={String(day)} value={day} />
                ))}
              </Picker>
            </View>
          </View>
          
          {/* Year Picker */}
          <View style={localStyles.dobPickerWrapper}>
            <Text style={localStyles.dobPickerLabel}>Year</Text>
            <View style={localStyles.pickerContainer}>
              <Picker
                selectedValue={selectedYear}
                onValueChange={(itemValue) => setSelectedYear(Number(itemValue))}
                style={localStyles.dobPicker}
                itemStyle={localStyles.pickerItem}
              >
                {years.map((year) => (
                  <Picker.Item key={year} label={String(year)} value={year} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </View>

      <View style={localStyles.activityLevelContainer}>
        <Text style={styles.label}>Activity Level</Text>
        <View style={localStyles.pickerContainer}>
          <Picker
            selectedValue={activityLevel}
            onValueChange={(itemValue) => setActivityLevel(itemValue as ActivityLevel)}
            style={localStyles.activityLevelPicker}
            itemStyle={localStyles.pickerItem}
          >
            <Picker.Item label="Sedentary (Little or no exercise)" value="sedentary" />
            <Picker.Item label="Lightly Active (Light exercise: 1-3 days a week)" value="light" />
            <Picker.Item label="Moderately Active (Moderate exercise 3-5 days a week)" value="moderate" />
            <Picker.Item label="Very Active (Heavy exercise 6-7 days a week)" value="active" />
            <Picker.Item label="Extra Active (Very heavy exercise/2x times a day)" value="veryActive" />
          </Picker>
        </View>
      </View>

      <View style={localStyles.allergenContainer}>
        <Text style={styles.label}>Allergies</Text>
        <AllergenSelector selectedAllergens={selectedAllergens} customAllergens={customAllergens}
          onAllergensChange={(allergens: string[]) => setSelectedAllergens(allergens)}
          onCustomAllergensChange={(allergens: string[]) => setCustomAllergens(allergens)}
        />
      </View>


      {/* Terms of Service Checkbox */}
      <View style={localStyles.termsContainer}>
        <TouchableOpacity
          style={[localStyles.checkbox, tosAccepted && localStyles.checkboxActive]}
          onPress={() => setTosAccepted(!tosAccepted)}
          disabled={loading}
        >
          {tosAccepted && <Text style={localStyles.checkmark}>✓</Text>}
        </TouchableOpacity>
        <Text style={localStyles.termsText}>
          I agree to the{' '}
          <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
            <Text style={localStyles.legalText}>Terms of Service</Text>
          </TouchableOpacity>
        </Text>
      </View>

      {/* Privacy Policy Checkbox */}
      <View style={localStyles.termsContainer}>
        <TouchableOpacity
          style={[localStyles.checkbox, ppAccepted && localStyles.checkboxActive]}
          onPress={() => setPpAccepted(!ppAccepted)}
          disabled={loading}
        >
          {ppAccepted && <Text style={localStyles.checkmark}>✓</Text>}
        </TouchableOpacity>
        <Text style={localStyles.termsText}>
          I agree to the{' '}
          <TouchableOpacity onPress={() => navigation.navigate('Privacy')}>
            <Text style={localStyles.legalText}>Privacy Policy</Text>
          </TouchableOpacity>
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Sign Up</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        style={styles.loginLink}
        disabled={loading}
      >
        <Text style={styles.loginLinkText}>Already have an account? Log In</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const localStyles = StyleSheet.create({
  genderContainer: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.backgroundSecondary, 
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: theme.colors.primary, 
  },
  genderButtonText: {
    color: theme.colors.text,
    fontWeight: '500',
  },
  genderButtonTextActive: {
    color: theme.colors.white, 
  },
  heightContainer: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  heightInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heightInput: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border, 
    borderRadius: theme.borderRadius.md,
    color: theme.colors.text, 
  },
  heightUnit: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary, 
  },
  //DOB picker styles
  dobContainer: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  dobPickersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
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
  // Activity Level styles
  activityLevelContainer: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  pickerContainer: {
    backgroundColor: theme.colors.background, 
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border, 
    overflow: 'hidden',
  },
  activityLevelPicker: {
    backgroundColor: theme.colors.background, 
    color: theme.colors.text, 
    height: Platform.OS === 'ios' ? 150 : 50,
  },
  pickerItem: {
    color: theme.colors.text, // #000000
    fontSize: theme.fonts.sizes.md,
  },
  //Alergen styles
  allergenContainer: {
    width: '100%',
    marginBottom: theme.spacing.md
  },
  // Terms of Service and Privacy Policy styles
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: theme.colors.textSecondary,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  checkboxActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text,
  },
  legalText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.primary, 
  },
});

export default SignupScreen;
