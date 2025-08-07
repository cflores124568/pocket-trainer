import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, SafeAreaView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../types/types';

//Navigation prop type for welcome screen
type WelcomeScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Welcome'>;
type WelcomeScreenProps = {
  navigation: WelcomeScreenNavigationProp;
};

const WelcomeScreen = ({ navigation }: WelcomeScreenProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    //Run fade-in and slide-up animations at the same time
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true, //Improve performance
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={[theme.colors.textSecondary, theme.colors.text]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Animated.View
            style={[
              styles.topSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Image
              source={require('/Users/chrisflores/Documents/NewPocketTrainer/assets/PocketTrainerIcon.png')}
              style={styles.logo}
            />
            <Text style={styles.appTitle}>PocketTrainer</Text>
            <Text style={styles.tagline}>Your personal fitness journey starts here</Text>
          </Animated.View>

          <View style={styles.buttonSection}>
            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginButtonText}>Log In</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.signupButton} 
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={styles.signupButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
            <View style={styles.termsContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
                <Text style={styles.legalText}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={styles.separator}>•</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Privacy')}>
                <Text style={styles.legalText}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 60,
    width: '100%',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  loginButton: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginVertical: 10,
    width: '80%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: theme.colors.primary,
  },
  signupButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginVertical: 10,
    width: '80%',
    borderWidth: 2,
    borderColor: 'white',
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'white',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 10,
  },
  termsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginHorizontal: 5,
  },
  separator: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  }
});

export default WelcomeScreen;
