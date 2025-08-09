import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/types';
import { theme } from '../styles/theme';
import { styles } from '../styles/styles';
import { useAuth } from '../firebase/AuthContext';
//Navigation prop type
type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

type ForgotPasswordScreenProps = {
  navigation: ForgotPasswordScreenNavigationProp;
}

const ForgotPasswordScreen = ({ navigation }: ForgotPasswordScreenProps) => {
  //States for email, errors, and loading status
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth(); 

  const handleResetPassword = async () => {
    setError(null);
    if (email.trim() === '') {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      Alert.alert(
        'Password Reset Email Sent',
        `An email has been sent to ${email} with instructions on how to reset your password. Please check your inbox (and spam folder).`,
        [{ text: 'OK', onPress: () => navigation.goBack() }] //Go back to the login screen
      );
    } catch (err: any) {
      let errorMessage = 'Failed to send password reset email.';
      //Handle firebase auth errors
      switch (err.code) {
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'There is no user record corresponding to this email.';
          break;
        default:
          console.error('Firebase password reset error:', err.code);
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.homeScreenTitle}>Forgot Password</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Text style={styles.label}>Enter your email address:</Text>
      <TextInput
        style={[styles.input, loading && { opacity: 0.5 }]} //Dim input while processing
        placeholder="Email"
        placeholderTextColor={theme.colors.darkGray}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
        autoFocus={true}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Send Reset Email</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.loginLinkText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ForgotPasswordScreen;
