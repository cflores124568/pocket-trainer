import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Alert, TouchableOpacity, SafeAreaView, Image, Dimensions, StyleSheet, Animated } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { RootStackParamList, MainTabParamList, HomeStackParamList, NutritionStackParamList, MuscleGroup, Gender, CarouselItem, MenuItem } from '../types/types';
import { useAuth } from '../firebase/AuthContext';
import { styles } from '../styles/styles';
import { theme } from '../styles/theme';
import { FlashList } from '@shopify/flash-list';
import Carousel from 'react-native-reanimated-carousel';
import { Ionicons, Fontisto, MaterialIcons, AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';

//Composite navigation prop to access home screen with bottom tab navigation 
type HomeScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamList, 'HomeScreen'>,
  BottomTabNavigationProp<MainTabParamList, 'Home'>
>;

type HomeScreenProps = {
  navigation: HomeScreenNavigationProp;
};

const { width } = Dimensions.get('window');

const HomeScreen = ({navigation}: HomeScreenProps) => {
  const { userData, loading, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  //Animation values with useRef to avoid resets during rerendering
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-20)).current;

  //Carousel content
  const featuredContent: CarouselItem[] = [
    {
      id: '1',
      title: 'Create Your Workout Plan',
      description: 'Design a custom workout plan tailored to your goals',
      image: require('../assets/CreateWorkoutPlan.png'), 
      action: () => navigation.navigate('Workouts', {
        screen: 'CreateWorkoutPlan',
        params: { selectedMuscles: []},
      })
    },
    {
      id: '2',
      title: 'Nutrition Planning',
      description: 'Create a nutrition plan based on your goals',
      image: require('../assets/CreateNutritionPlan.png'),
      action: () => navigation.navigate('Nutrition', {
        screen: 'CreateNutritionPlan',
        params: { gender: userData?.gender as Gender || 'male', weight: userData?.weight || 0}
      })
    },
    {
      id: '3',
      title: 'Track Your Progress',
      description: 'Monitor your fitness and nutrition goals',
      image: require('../assets/TrackGoals.png'),
      action: () => navigation.navigate('DailyPlanDashboard', {dashboardType: 'combined'})
    },
  ];

  //Main menu options
  const menuOptions: MenuItem[] = [
    {
      id: '1',
      title: 'Explore Muscle Diagram',
      icon: 'barbell',
      library: 'Ionicons',
      action: () => navigation.navigate('Workouts', { screen: 'MuscleDiagram', params: {mode: 'explore'} })
    },
    {
      id: '2',
      title: 'Create Workout Plan',
      icon: 'create', 
      library: 'Ionicons',
      action: () => navigation.navigate('Workouts', {
        screen: 'CreateWorkoutPlan',
        params: {selectedMuscles: []},
      })
    },
    {
      id: '3',
      title: 'View Workout Plan',
      icon: 'preview', 
      library: 'Fontisto',
      action: () => navigation.navigate('Workouts', {screen: 'ViewWorkoutPlans'})
    },
    {
      id: '4',
      title: 'Create Nutrition Plan',
      icon: 'create', 
      library: 'Ionicons',
      action: () => navigation.navigate('Nutrition', {
        screen: 'CreateNutritionPlan',
        params: { gender: userData?.gender as Gender || 'male', weight: userData?.weight || 0}
      })
    },
    {
      id: '5',
      title: 'View Nutrition Plan',
      icon: 'preview',
      library: 'Fontisto',
      action: () => navigation.navigate('Nutrition', {screen: 'ViewNutritionPlan'})
    },
    {
      id: '6',
      title: 'Nutrition Dashboard',
      icon: 'piechart', 
      library: 'AntDesign',
      action: () => navigation.navigate('DailyPlanDashboard', {dashboardType: 'nutrition'})
    },
    {
      id: '7',
      title: 'Fitness Dashboard',
      icon: 'stats-chart', 
      library: 'Ionicons',
      action: () => navigation.navigate('DailyPlanDashboard', {dashboardType: 'fitness'})
    },
    {
      id: '8',
      title: 'Combined Dashboard',
      icon: 'vector-combine',
      library: 'MaterialCommunityIcons',
      action: () => navigation.navigate('DailyPlanDashboard', {dashboardType: 'combined'})
    },
  ];

  //Create animation refs for menu items
  const menuItemAnimations = useRef(
    menuOptions.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(15)
    }))
  ).current;

  //Start animations when component mounts
  useEffect(() => {
    //Header animation
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true //Improve performance
      }),
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();
    
    //Create a staggered animation for menu items
    menuItemAnimations.forEach((anim, index) => {
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 300,
          delay: index * 100,
          useNativeDriver: true //Improve perfromance 
        }),
        Animated.timing(anim.translateY, {
          toValue: 0,
          duration: 300,
          delay: index * 100,
          useNativeDriver: true
        })
      ]).start();
    });
  }, []);

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Sign Out Error", "Failed to sign out. Please try again.");
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderCarouselItem = ({ item }: {item: CarouselItem}) => (
    <TouchableOpacity onPress={item.action} style={localStyles.carouselItem}>
      <Image source={item.image} style={localStyles.carouselImage} />
      <View style={localStyles.carouselContent}>
        <Text style={localStyles.carouselTitle}>{item.title}</Text>
        <Text style={localStyles.carouselDescription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  //Dynamic icons for menu items
  const renderMenuItem = ({ item, index }: {item: MenuItem, index: number}) => {
    const IconComponent = {
      Ionicons, MaterialIcons, AntDesign, Fontisto, MaterialCommunityIcons
    }[item.library];

    return (
      <Animated.View 
        style={{
          opacity: menuItemAnimations[index].opacity,
          transform: [{ translateY: menuItemAnimations[index].translateY }]
        }}
      >
        <TouchableOpacity style={localStyles.menuItem} onPress={item.action}>
          {IconComponent ? (
            <IconComponent name={item.icon as any} size={24} color={theme.colors.text} style={localStyles.menuIcon}/>
          ) : ( 
            <Text style={localStyles.menuIcon}>?</Text>
          )}
          <Text style={localStyles.menuTitle}>{item.title}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  //Display a loading indicator
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          localStyles.header,
          {
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }]
          }
        ]}
      >
        <Text style={styles.homeScreenTitle}>Welcome, {userData?.firstName}!</Text>
      </Animated.View>

      <View style={localStyles.carouselContainer}>
        <Carousel
          width={width - 40}
          height={180}
          data={featuredContent}
          renderItem={renderCarouselItem}
          loop
          autoPlay
          autoPlayInterval={5000}
        />
      </View>

      <Text style={localStyles.sectionTitle}>Quick Actions</Text>
      
      <FlashList
        data={menuOptions}
        renderItem={({item, index}) => renderMenuItem({item, index})}
        keyExtractor={item => item.id}
        numColumns={2}
        estimatedItemSize={100}
        contentContainerStyle={localStyles.flashListContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListFooterComponent={
          <TouchableOpacity style={localStyles.signOutButton} onPress={handleSignOut}>
            <Text style={localStyles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  header: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  carouselContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  carouselItem: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    margin: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  carouselImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  carouselContent: {
    padding: 12,
  },
  carouselTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  carouselDescription: {
    fontSize: 14,
    color: '#555',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginBottom: 10,
    color: theme.colors.text,
  },
  flashListContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00ffff',
    borderRadius: 12,
    padding: 16,
    margin: 6,
    flex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 7,
  },
  menuTitle: {
    fontSize: 12,
    color: theme.colors.text,
    //flex: 1,
  },
  signOutButton: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 50,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  signOutText: {
    color: '#e74c3c',
    fontWeight: '600',
  },
});

export default HomeScreen;
