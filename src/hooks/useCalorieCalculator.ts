import { useState, useEffect, useRef } from 'react';
import { lbsToKg, calculateCaloriesBurned, estimateExerciseDuration } from '../utils/CalorieCalculatorUtil';
import exercisesWithCalories from '../data/ExercisesWithCalories';
import { WorkoutPlan, DayOfWeek, Exercise } from '../types/types';

interface CalorieCalculatorOptions {
  secondsPerRep?: number;
  restBetweenSets?: number;
}
//Calculates calories burned per day and total for a workout plan
export function useCalorieCalculator(
  plan: WorkoutPlan | null,
  options: CalorieCalculatorOptions = {}
) {
  const [caloriesByDay, setCaloriesByDay] = useState<{ [key: number]: number }>({});
  const [totalCalories, setTotalCalories] = useState<number>(0);

  const secondsPerRep = options.secondsPerRep || 4;
  const restBetweenSets = options.restBetweenSets || 60;

  //Use a ref to track previous values for comparison
  const prevCaloriesByDay = useRef<{ [key: number]: number }>({});
  const prevTotalCalories = useRef<number>(0);

  useEffect(() => {
    if(!plan || !plan.userWeight){
      setCaloriesByDay({});
      setTotalCalories(0);
      return;
    }

    const weightKg = lbsToKg(plan.userWeight);
    const calculatedCaloriesByDay: { [key: number]: number } = {};
    let calculatedTotalCalories = 0;
    //Calculate calories for each days schedule
    plan.dailySchedules.forEach((schedule) => {
      const dayCalories = calculateDayCalories(schedule, weightKg, secondsPerRep, restBetweenSets);
      calculatedCaloriesByDay[schedule.day] = dayCalories;
      calculatedTotalCalories += dayCalories;
    });

    //Only update state if values have changed to avoid unnecessary renders
    if(JSON.stringify(calculatedCaloriesByDay) !== JSON.stringify(prevCaloriesByDay.current)){
      setCaloriesByDay(calculatedCaloriesByDay);
      prevCaloriesByDay.current = calculatedCaloriesByDay;
    }

    if(calculatedTotalCalories !== prevTotalCalories.current){
      setTotalCalories(calculatedTotalCalories);
      prevTotalCalories.current = calculatedTotalCalories;
    }
  }, [plan, secondsPerRep, restBetweenSets]);

  const calculateDayCalories = (
    schedule: { day: DayOfWeek; exercises: Exercise[] },
    weightKg: number,
    secondsPerRep: number,
    restBetweenSets: number
  ): number => {
    return schedule.exercises.reduce((total, exercise) => {
      //Use metValue from exercise or fallback to default value
      const metValue = exercise.metValue ?? exercisesWithCalories.find(e => e.id === exercise.id)?.metValue ?? 4.0;

      if(!metValue || metValue <= 0){
        console.log(`Skipping exercise ${exercise.name}: Invalid metValue ${metValue}`);
        return total;
      }

      const duration = estimateExerciseDuration(
        exercise.sets,
        exercise.reps,
        secondsPerRep,
        restBetweenSets
      );
      if(duration <= 0 || isNaN(duration)){
        console.log(`Skipping exercise ${exercise.name}: Invalid duration ${duration}`);
        return total;
      }
      const calories = calculateCaloriesBurned(metValue, weightKg, duration);
      if(isNaN(calories) || calories <= 0){
        console.log(`Skipping exercise ${exercise.name}: Invalid calories ${calories}`);
        return total;
      }

      return total + calories;
    }, 0);
  };

  return {
    caloriesByDay,
    totalCalories: Math.round(totalCalories),
    calculateDayCalories: (day: number) => Math.round(caloriesByDay[day] || 0),
  };
}
