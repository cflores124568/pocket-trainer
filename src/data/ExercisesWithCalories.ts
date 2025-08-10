import exercises from './Exercises'; 
import { MuscleGroup, Exercise } from '../types/types';
//Adds MET values to exercises for calorie calculations
const exercisesWithCalories: Exercise[] = exercises.map(exercise => {
  let metValue: number;
  //Assign MET based on muscle group or specific exercise
  switch(true) {
    // Strength exercises by muscle group
    case exercise.primaryMuscles.includes(MuscleGroup.Chest):
      metValue = 5.0;
      break;
    case exercise.primaryMuscles.includes(MuscleGroup.Lats) ||
          exercise.primaryMuscles.includes(MuscleGroup.UpperTraps) ||
          exercise.primaryMuscles.includes(MuscleGroup.LowerTraps):
      metValue = 6.0;
      break;
    case exercise.primaryMuscles.includes(MuscleGroup.Biceps) ||
          exercise.primaryMuscles.includes(MuscleGroup.Triceps):
      metValue = 4.0;
      break;
    case exercise.primaryMuscles.includes(MuscleGroup.Deltoids):
      metValue = 4.5;
      break;
    case exercise.primaryMuscles.includes(MuscleGroup.Quadriceps) ||
          exercise.primaryMuscles.includes(MuscleGroup.Hamstrings) ||
          exercise.primaryMuscles.includes(MuscleGroup.Glutes):
      metValue = 6.5;
      break;
    case exercise.primaryMuscles.includes(MuscleGroup.Abs):
      metValue = 3.8;
      break;
    case exercise.primaryMuscles.includes(MuscleGroup.Calves):
      metValue = 4.0;
      break;
    //Higher MET for specific compound or intense exercises
    case exercise.id === 'deadlifts':
      metValue = 8.0;
      break;
    case exercise.id === 'push-ups':
      metValue = 3.8;
      break;
    case exercise.id === 'pull-ups':
      metValue = 8.0;
      break;
    case exercise.id === 'plank':
      metValue = 3.5;
      break;
    default:
      metValue = 4.0; //Default fallback for uncategroized exercises
  }

  return {
    ...exercise,
    metValue
  };
});

export default exercisesWithCalories;
