/**
 * Calculates calories burned during an exercise
 * @param metValue - Metabolic Equivalent of Task value for the exercise
 * @param weightKg - Person's weight in kilograms
 * @param durationMinutes - Exercise duration in minutes
 * @returns Number of calories burned
 */
export function calculateCaloriesBurned(metValue: number, weightKg: number, durationMinutes: number): number {
  // Validate inputs
  if (metValue <= 0 || weightKg <= 0 || durationMinutes <= 0 || isNaN(metValue) || isNaN(weightKg) || isNaN(durationMinutes)) {
    return 0;
  }
  // Formula: Calories = MET × weight (kg) × duration (hours)
  const durationHours = durationMinutes / 60;
  const calories = metValue * weightKg * durationHours;
  return isNaN(calories) ? 0 : Math.max(0, calories);
}

/**
 * Estimates exercise duration based on sets, reps and time per rep
 * @param sets - Number of sets performed
 * @param reps - Number of reps (can be a range like "8-12")
 * @param secondsPerRep - Average seconds spent per repetition
 * @param restBetweenSets - Seconds of rest between sets
 * @returns Estimated duration in minutes
 */
export function estimateExerciseDuration(
  sets: number,
  reps: string,
  secondsPerRep: number = 4,
  restBetweenSets: number = 60
): number {
  // Validate inputs
  if (sets <= 0 || isNaN(sets) || !reps || secondsPerRep <= 0 || restBetweenSets < 0) {
    return 0;
  }

  let avgReps: number;
  if (reps.includes('-')) {
    const [min, max] = reps.split('-').map(Number);
    if (isNaN(min) || isNaN(max) || min <= 0 || max <= 0) {
      return 0;
    }
    avgReps = (min + max) / 2;
  } else if (reps.includes(' ')) {
    // Handle cases like "30-60 Seconds"
    const timeStr = reps.split(' ')[0];
    if (timeStr.includes('-')) {
      const [min, max] = timeStr.split('-').map(Number);
      if (isNaN(min) || isNaN(max) || min <= 0 || max <= 0) {
        return 0;
      }
      return ((min + max) / 2 * sets + (sets - 1) * restBetweenSets) / 60;
    }
    const time = Number(timeStr);
    if (isNaN(time) || time <= 0) {
      return 0;
    }
    return (time * sets + (sets - 1) * restBetweenSets) / 60;
  } else {
    avgReps = Number(reps);
    if (isNaN(avgReps) || avgReps <= 0) {
      return 0;
    }
  }

  // Calculate total exercise time in minutes including rest periods
  const workTime = sets * avgReps * secondsPerRep;
  const restTime = (sets - 1) * restBetweenSets; // Rest between sets

  const totalSeconds = workTime + restTime;
  return isNaN(totalSeconds) ? 0 : totalSeconds / 60; // Convert to minutes
}

/**
 * Converts pounds to kilograms
 * @param weightLbs - Weight in pounds
 * @returns Weight in kilograms
 */
export function lbsToKg(weightLbs: number): number {
  if (isNaN(weightLbs) || weightLbs <= 0) {
    return 0;
  }
  return weightLbs * 0.45359237;
}