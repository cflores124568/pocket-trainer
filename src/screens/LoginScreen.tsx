import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { AuthStackParamList, RootStackParamList } from '../types/types';
import { theme } from '../styles/theme';
import { styles } from '../styles/styles';
import { useAuth } from '../firebase/AuthContext';
import { Ionicons } from '@expo/vector-icons';
//Define navigation prop type for login screen
type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

type LoginScreenProps = {
  navigation: LoginScreenNavigationProp;
};

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth(); //Hook for firebase authentication methods

  const handleLogin = async () => {
    setError(null);

    if (email.trim() === '' || password.trim() === '') {
      setError('Please enter email and password.');
      return;
    }

    try {
      await login(email, password);
    } catch (err: any) {
      let errorMessage = 'An error occurred during login.';
      //Handle multiple firebase error codes
      if (err.code) {
        switch (err.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            errorMessage = 'Invalid credentials.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled.';
            break;
          default:
            console.error("Firebase error code: ", err.code);
            errorMessage = 'An unknown error occurred.';
        }
      } else if (err.message === 'User profile not found.') {
        errorMessage = 'Invalid credentials.';
      }

      setError(errorMessage);
      Alert.alert('Login Failed', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.homeScreenTitle}>Login</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TextInput
        style={[styles.input, loading && { opacity: 0.5 }]}
        placeholder="Email"
        placeholderTextColor={theme.colors.darkGray}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
        autoFocus={true}
      />

      <View style={{ position: 'relative', width: '100%' }}>
        <TextInput
          style={[styles.input, loading && { opacity: 0.5 }]}
          placeholder="Password"
          placeholderTextColor={theme.colors.darkGray}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          editable={!loading}
        />
        <TouchableOpacity
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: [{ translateY: -12 }],
          }}
          onPress={() => setShowPassword(!showPassword)}
          disabled={loading}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={24}
            color={theme.colors.darkGray}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.loginLinkText}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.loginLinkText}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;
