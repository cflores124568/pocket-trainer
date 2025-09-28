import 'react-native-reanimated';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { RootStackParamList, AuthStackParamList,MainTabParamList, HomeStackParamList,
  WorkoutStackParamList,NutritionStackParamList,ProfileStackParamList} from './src/types/types';
import WelcomeScreen from './src/screens/WelcomeScreen';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import MuscleDiagramScreen from './src/screens/MuscleDiagramScreen';
import ViewWorkoutPlansScreen from './src/screens/ViewWorkoutPlan';
import CreateWorkoutPlanScreen from './src/screens/CreateWorkoutPlan';
import MuscleSelectorScreen from './src/screens/MuscleSelector';
import ExerciseBrowserScreen from './src/screens/ExerciseBrowser';
import StartWorkoutScreen from './src/screens/StartWorkout';
import ExerciseDetailsScreen from './src/screens/ExerciseDetailsScreen';
import ViewNutritionPlansScreen from './src/screens/ViewNutritionPlan';
import CreateNutritionPlanScreen from './src/screens/CreateNutritionPlan';
import EditNutritionPlanScreen from './src/screens/EditNutritionPlan';
import DailyPlanDashboard from './src/screens/DailyPlanDashboard';
import ProfileScreen from './src/screens/ProfileScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import { AuthProvider, useAuth } from './src/firebase/AuthContext';
import { WorkoutPlanProvider } from './src/context/WorkoutPlanContext';
import { NutritionPlanProvider } from './src/context/NutritionContext';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet } from 'react-native';
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import WorkoutHistoryScreen from './src/screens/WorkoutHistoryScreen';
import TermsOfServiceScreen from './src/screens/TermsOfService';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicy';
import FoodDetailsScreen from './src/screens/FoodDetailsScreen';
import EditWorkoutPlanScreen from './src/screens/EditWorkoutPlan';
import { WorkoutHistoryProvider } from './src/context/WorkoutHistoryContext';
import CompleteNutritionPlanScreen from './src/screens/CompleteNutritionPlan';
import { NutritionHistoryProvider } from './src/context/NutritionHistoryContext';

enableScreens();

//Use proper types for each navigator
const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const WorkoutStack = createStackNavigator<WorkoutStackParamList>();
const NutritionStack = createStackNavigator<NutritionStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

//Workout Stack
const WorkoutStackNavigator = () => (
  <WorkoutStack.Navigator screenOptions={{ headerShown: false }}>
    <WorkoutStack.Screen name="ViewWorkoutPlans" component={ViewWorkoutPlansScreen} />
    <WorkoutStack.Screen name="CreateWorkoutPlan" component={CreateWorkoutPlanScreen} />
    <WorkoutStack.Screen name="MuscleSelector" component={MuscleSelectorScreen} />
    <WorkoutStack.Screen name="ExerciseBrowser" component={ExerciseBrowserScreen} />
    <WorkoutStack.Screen name="StartWorkout" component={StartWorkoutScreen} />
    <WorkoutStack.Screen name="ExerciseDetails" component={ExerciseDetailsScreen} />
    <WorkoutStack.Screen name="MuscleDiagram" component={MuscleDiagramScreen} />
    <WorkoutStack.Screen name="WorkoutHistory" component={WorkoutHistoryScreen}/>
    <WorkoutStack.Screen name="EditWorkoutPlan" component={EditWorkoutPlanScreen}/>
  </WorkoutStack.Navigator>
);

//Nutrition Stack
const NutritionStackNavigator = () => (
  <NutritionStack.Navigator screenOptions={{ headerShown: false }}>
    <NutritionStack.Screen name="ViewNutritionPlan" component={ViewNutritionPlansScreen} />
    <NutritionStack.Screen name="CreateNutritionPlan" component={CreateNutritionPlanScreen} />
    <NutritionStack.Screen name="EditNutritionPlan" component={EditNutritionPlanScreen} />
    <NutritionStack.Screen name="FoodDetailsScreen" component={FoodDetailsScreen}/>
    <NutritionStack.Screen name="CompleteNutritionPlan" component={CompleteNutritionPlanScreen}/>
  </NutritionStack.Navigator>
);

//Home Stack
const HomeStackNavigator = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
    <HomeStack.Screen name="DailyPlanDashboard" component={DailyPlanDashboard}/>
  </HomeStack.Navigator>
);

const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={{headerShown: false}}>
    <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen}/>
  </ProfileStack.Navigator>
);

//Authentication Stack
const AuthStackNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Signup" component={SignupScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen}/>
    <AuthStack.Screen name = "Terms" component={TermsOfServiceScreen}/>
    <AuthStack.Screen name = "Privacy" component={PrivacyPolicyScreen}/>
  </AuthStack.Navigator>
);

//Main Tab Navigator
const MainTabNavigator = () => (
  <MainTab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        if (route.name === 'Home') {
          return <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />;
        } else if (route.name === 'Workouts') {
          return <Ionicons name={focused ? 'fitness' : 'fitness-outline'} size={size} color={color} />;
        } else if (route.name === 'Nutrition') {
          return <FontAwesome6 name="apple-whole" size={size} color={color} />;
        } else if (route.name === 'Profile'){
          return <FontAwesome6 name={focused? 'user' : 'circle-user'} size={size} color={color}/>;
        }
        //Default return to satisfy TypeScript
        return null;
      },
      tabBarActiveTintColor: '#4CAF50',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <MainTab.Screen 
      name="Home" 
      component={HomeStackNavigator} 
      options={{ headerShown: false }} 
    />
    <MainTab.Screen 
      name="Workouts" 
      component={WorkoutStackNavigator} 
      options={{ headerShown: false }} 
    />
    <MainTab.Screen 
      name="Nutrition" 
      component={NutritionStackNavigator} 
      options={{ headerShown: false }} 
    />
    <MainTab.Screen
      name="Profile"
      component={ProfileStackNavigator}
      options={{headerShown: false}}
    />
  </MainTab.Navigator>
);

//App Content component with auth check
const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4CAF50"/>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <RootStack.Screen name="Main" component={MainTabNavigator} />
          ) : (
            <RootStack.Screen name="Auth" component={AuthStackNavigator} />
          )}
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
};

//Main App component with providers
const App = () => {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AuthProvider>
          <WorkoutPlanProvider>
            <NutritionPlanProvider>
              <WorkoutHistoryProvider>
                <NutritionHistoryProvider>
                  <AppContent />
                </NutritionHistoryProvider> 
              </WorkoutHistoryProvider>
            </NutritionPlanProvider>
          </WorkoutPlanProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default App;
