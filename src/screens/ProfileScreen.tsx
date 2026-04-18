import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { useAuth } from '../firebase/AuthContext';
import { theme } from '../styles/theme';
import { styles as globalStyles } from '../styles/styles';
import { Gender, ActivityLevel, AuthStackParamList } from '../types/types';
import { updateUserProfile, auth } from '../firebase/firebase';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AllergenSelector from '../utils/AllergenSelectorUtil';
import { FontAwesome } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

//Functions to handle DOB and age calculation (recycled from SignupScreen)
const calculateAge = (dob: string): number => {
  const [month, day, year] = dob.split('/').map(Number);
  const dobDate = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - dobDate.getFullYear();
  const monthDiff = today.getMonth() - dobDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
    age--;
  }
  return age;
};

const formatDob = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

//Typing for navigation prop
type ProfileScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Welcome'>;

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  uid: string;
  gender: Gender;
  weight: number;
  heightFt: number;
  heightIn: number;
  dob: string;
  activityLevel: ActivityLevel;
  allergies: string[];
  customAllergens: string[];
}

const ProfileScreen = ({ navigation }: { navigation: ProfileScreenNavigationProp }) => {
  const { user, loading, getUserProfile, deleteAccount } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [weight, setWeight] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('sedentary');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [customAllergens, setCustomAllergens] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      getUserProfile().then((userData: UserProfile) => {
        setProfile(userData);
        setWeight(userData.weight.toString() || '');
        setHeightFt(userData.heightFt.toString() || '');
        setHeightIn(userData.heightIn.toString() || '');
        setDob(new Date(userData.dob));
        setActivityLevel(userData.activityLevel);
        setSelectedAllergens(userData.allergies || []);
        setCustomAllergens(userData.customAllergens || []);
      }).catch((err) => {
        setError('Failed to load profile.');
        console.error(err);
      });
    }
  }, [user]);

  const handleDobChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDob(selectedDate);
    }
  };

  const handleSave = async () => {
    setError(null);

    const parsedWeight = parseFloat(weight);
    const parsedHeightFt = parseInt(heightFt, 10);
    const parsedHeightIn = parseInt(heightIn, 10);

    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      setError('Please enter a valid weight.');
      return;
    }
    if (isNaN(parsedHeightFt) || isNaN(parsedHeightIn) || parsedHeightFt < 0 || parsedHeightIn < 0 || parsedHeightIn > 11) {
      setError('Please enter a valid height.');
      return;
    }
    if (!dob || !dob.getTime()) {
      setError('Please select a valid date of birth (age 13–120).');
      return;
    }

    try {
      setIsSaving(true);
      const dobString = `${dob.getMonth() + 1}/${dob.getDate()}/${dob.getFullYear()}`;
      await updateUserProfile(user!.uid, {
        weight: parsedWeight,
        heightFt: parsedHeightFt,
        heightIn: parsedHeightIn,
        dob: dobString,
        activityLevel,
        allergies: selectedAllergens,
        customAllergens,
      });
      setProfile({
        ...profile!,
        weight: parsedWeight,
        heightFt: parsedHeightFt,
        heightIn: parsedHeightIn,
        dob: dobString,
        activityLevel,
        allergies: selectedAllergens,
        customAllergens,
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (err) {
      setError('Failed to update profile.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Warning',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deleteAccount();
              await auth.signOut();
              navigation.navigate('Welcome');  //Navigate to Welcome screen after account deletion
              Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
            } catch (err) {
              setError('Failed to delete account. Please try again.');
              console.error(err);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading || !profile || !dob) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={[globalStyles.homeScreenTitle, { color: theme.colors.text }]}>User Profile</Text>

      {error && (
        <View style={globalStyles.errorContainer}>
          <Text style={globalStyles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.infoText}>{`${profile.firstName} ${profile.lastName}`}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.infoText}>{profile.email}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Gender</Text>
        <Text style={styles.infoText}>{profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Weight (lbs)</Text>
        {isEditing ? (
          <TextInput
            style={globalStyles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholderTextColor="black"
          />
        ) : (
          <Text style={styles.infoText}>{profile.weight} lbs</Text>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Height</Text>
        {isEditing ? (
          <View style={styles.heightInputs}>
            <TextInput
              style={[globalStyles.input, styles.heightInput]}
              value={heightFt}
              onChangeText={setHeightFt}
              keyboardType="numeric"
              placeholder="ft"
              placeholderTextColor="black"
            />
            <Text style={styles.heightUnit}>ft</Text>
            <TextInput
              style={[globalStyles.input, styles.heightInput]}
              value={heightIn}
              onChangeText={setHeightIn}
              keyboardType="numeric"
              placeholder="in"
              placeholderTextColor="black"
            />
            <Text style={styles.heightUnit}>in</Text>
          </View>
        ) : (
          <Text style={styles.infoText}>{`${profile.heightFt} ft ${profile.heightIn} in`}</Text>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Date of Birth</Text>
        {isEditing ? (
          <View>
            <TouchableOpacity
              style={globalStyles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>{formatDob(dob)}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dob}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={handleDobChange}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
              />
            )}
          </View>
        ) : (
          <Text style={styles.infoText}>{profile.dob} (Age: {calculateAge(profile.dob)})</Text>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Activity Level</Text>
        {isEditing ? (
          <Picker
            selectedValue={activityLevel}
            onValueChange={(itemValue) => setActivityLevel(itemValue as ActivityLevel)}
            style={styles.activityLevelPicker}
          >
            <Picker.Item label="Sedentary (Little or no exercise)" value="sedentary" />
            <Picker.Item label="Lightly Active (Light exercise: 1-3 days a week)" value="light" />
            <Picker.Item label="Moderately Active (Moderate exercise 3-5 days a week)" value="moderate" />
            <Picker.Item label="Very Active (Heavy exercise 6-7 days a week)" value="active" />
            <Picker.Item label="Extra Active (Very heavy exercise/2x times a day)" value="veryActive" />
          </Picker>
        ) : (
          <Text style={styles.infoText}>
            {profile.activityLevel.charAt(0).toUpperCase() + profile.activityLevel.slice(1)}
          </Text>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Allergies</Text>
        {isEditing ? (
          <AllergenSelector
            selectedAllergens={selectedAllergens}
            customAllergens={customAllergens}
            onAllergensChange={(allergens: string[]) => setSelectedAllergens(allergens)}
            onCustomAllergensChange={(allergens: string[]) => setCustomAllergens(allergens)}
            showDisclaimer={false}
          />
        ) : (
          <Text style={styles.infoText}>
            {[...profile.allergies, ...profile.customAllergens].length > 0 ? 
              [...profile.allergies, ...profile.customAllergens].join(', ') : 'None'
            }
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[globalStyles.button, isSaving && globalStyles.buttonDisabled]}
          onPress={isEditing ? handleSave : () => setIsEditing(true)}
          disabled={isSaving || isDeleting}
        >
          {isSaving ? (
            <ActivityIndicator color="white" />
          ) : (
            <View style={styles.buttonContent}>
              <FontAwesome name="edit" size={20} color="white" style={styles.buttonIcon} />
              <Text style={globalStyles.buttonText}>{isEditing ? 'Save' : 'Edit Profile'}</Text>
            </View>
          )}
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity
            style={[globalStyles.button, styles.cancelButton]}
            onPress={() => {
              setIsEditing(false);
              setWeight(profile.weight.toString());
              setHeightFt(profile.heightFt.toString());
              setHeightIn(profile.heightIn.toString());
              setDob(new Date(profile.dob));
              setActivityLevel(profile.activityLevel);
              setSelectedAllergens(profile.allergies || []);
              setCustomAllergens(profile.customAllergens || []);
              setShowDatePicker(false);
              setError(null);
            }}
            disabled={isSaving || isDeleting}
          >
            <Text style={globalStyles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        )}

        {!isEditing && (
          <TouchableOpacity
            style={[globalStyles.button, styles.deleteButton, isDeleting && globalStyles.buttonDisabled]}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color="white" />
            ) : (
              <View style={styles.buttonContent}>
                <FontAwesome name="trash" size={20} color="white" style={styles.buttonIcon} />
                <Text style={globalStyles.buttonText}>Delete Account</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 5,
  },
  infoText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  dateText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  heightInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heightInput: {
    flex: 1,
    paddingVertical: 10,
  },
  heightUnit: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  activityLevelPicker: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    color: theme.colors.text,
  },
  cancelButton: {
    backgroundColor: theme.colors.error,
    marginTop: 10,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
    marginTop: 10,
  },
  buttonContainer: {
    marginTop: 10,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default ProfileScreen;
