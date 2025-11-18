import { ProgramExercise, Week, VolumeData, Exercise, ExerciseBlock } from '@/types';
import { getExerciseBlocks } from './exerciseUtils';

/**
 * Parse schema tecnica (es. "10+10+10" -> [10, 10, 10])
 */
export function parseSchema(schema: string): number[] {
  if (!schema) return [];
  const pattern = /^\d+(\+\d+)*$/;
  if (!pattern.test(schema)) return [];
  return schema.split('+').map((n) => parseInt(n, 10));
}

/**
 * Valida schema tecnica
 */
export function validateSchema(schema: string): boolean {
  if (!schema) return false;
  const clusters = parseSchema(schema);
  return clusters.length >= 2;
}

/**
 * Calcola target reps per un blocco
 */
export function calculateBlockTargetReps(block: ExerciseBlock): number {
  if (!block.sets) return 0;

  if (block.technique !== 'Normale' && block.techniqueSchema) {
    const clusters = parseSchema(block.techniqueSchema);
    if (clusters.length > 0) {
      const sumPerSet = clusters.reduce((a, b) => a + b, 0);
      return sumPerSet * block.sets;
    }
  }

  // Tecnica normale - richiede repsBase
  if (!block.repsBase) return 0;
  const repsBase = parseInt(block.repsBase, 10);
  if (isNaN(repsBase)) return 0;
  return repsBase * block.sets;
}

/**
 * Calcola target reps per un esercizio (legacy - usa il primo blocco)
 */
export function calculateTargetReps(exercise: ProgramExercise): number {
  if (exercise.exerciseType === 'cardio') return 0;
  const blocks = exercise.blocks || [];
  if (blocks.length > 0) {
    return calculateBlockTargetReps(blocks[0]);
  }
  // Fallback legacy
  if (!exercise.sets || !exercise.repsBase) return 0;

  if (exercise.technique !== 'Normale' && exercise.techniqueSchema) {
    const clusters = parseSchema(exercise.techniqueSchema);
    if (clusters.length > 0) {
      const sumPerSet = clusters.reduce((a, b) => a + b, 0);
      return sumPerSet * exercise.sets;
    }
  }

  // Tecnica normale
  const repsBase = parseInt(exercise.repsBase, 10);
  if (isNaN(repsBase)) return 0;
  return repsBase * exercise.sets;
}

/**
 * Calcola RPE stimato da coefficient
 */
export function getEstimatedRPE(coefficient: number): number {
  if (coefficient <= 0.7) return 5.5;
  if (coefficient <= 0.9) return 7.5;
  if (coefficient <= 1.0) return 8.5;
  return 10.0;
}

/**
 * Calcola volume per una settimana
 */
export function calculateVolume(
  week: Week | undefined,
  exercises: Exercise[]
): VolumeData {
  if (!week) {
    return {
      total: 0,
      byMuscle: {},
      estimatedRPE: 0,
      muscleCount: 0,
    };
  }

  let totalVolume = 0;
  const byMuscleTemp: Record<string, { volume: number; rpeSum: number }> = {};
  let totalEstimatedRPE = 0;
  let exerciseCount = 0;

  week.days.forEach((day) => {
    day.exercises.forEach((ex) => {
      // Skip cardio exercises
      if (ex.exerciseType === 'cardio') return;
      
      // Ottieni i blocchi dell'esercizio (con migrazione automatica)
      const blocks = getExerciseBlocks(ex);
      
      // Itera attraverso tutti i blocchi
      blocks.forEach((block) => {
        // Skip se il blocco non ha sets o coefficient
        if (!block.sets || block.coefficient === undefined) return;

        const volume = block.sets * block.coefficient;
        const estimatedRPE = getEstimatedRPE(block.coefficient);
        totalVolume += volume;
        totalEstimatedRPE += estimatedRPE;
        exerciseCount++;

        // Trova l'esercizio nella libreria
        const libraryExercise = exercises.find((e) => e.name === ex.exerciseName);
        const coefficient = block.coefficient; // Already checked above
        if (libraryExercise && libraryExercise.muscles && coefficient !== undefined) {
          libraryExercise.muscles.forEach((m) => {
            const muscleVolume = (volume * m.percent) / 100;
            if (!byMuscleTemp[m.muscle]) {
              byMuscleTemp[m.muscle] = { volume: 0, rpeSum: 0 };
            }
            byMuscleTemp[m.muscle].volume += muscleVolume;
            // Accumula l'RPE pesato per calcolare la media pesata alla fine
            byMuscleTemp[m.muscle].rpeSum += estimatedRPE * muscleVolume;
          });
        }
      });
    });
  });

  // Calcola la media pesata dell'RPE per ogni muscolo e costruisci l'oggetto finale
  const byMuscle: Record<string, { volume: number; estimatedRPE: number }> = {};
  Object.keys(byMuscleTemp).forEach((muscle) => {
    byMuscle[muscle] = {
      volume: byMuscleTemp[muscle].volume,
      estimatedRPE: byMuscleTemp[muscle].volume > 0 
        ? byMuscleTemp[muscle].rpeSum / byMuscleTemp[muscle].volume 
        : 0,
    };
  });

  return {
    total: Math.round(totalVolume * 10) / 10,
    byMuscle,
    estimatedRPE: exerciseCount > 0 ? totalEstimatedRPE / exerciseCount : 0,
    muscleCount: Object.keys(byMuscle).length,
  };
}

/**
 * Calcola metriche da LoggedSet array
 */
export function calculateSessionMetrics(
  sets: Array<{ reps: string; load: string; rpe: string }>
): {
  totalReps: number;
  avgRPE: number;
} {
  let totalReps = 0;
  let rpeSum = 0;
  let rpeCount = 0;

  sets.forEach((set) => {
    const reps = parseInt(set.reps, 10) || 0;
    const rpe = parseFloat(set.rpe) || 0;

    totalReps += reps;

    if (rpe > 0) {
      rpeSum += rpe;
      rpeCount++;
    }
  });

  return {
    totalReps,
    avgRPE: rpeCount > 0 ? Math.round((rpeSum / rpeCount) * 10) / 10 : 0,
  };
}

/**
 * Get completion status (per colori badge)
 */
export function getCompletionStatus(completion: number): {
  color: string;
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
} {
  if (completion >= 95) {
    return { color: 'green', label: 'Completato', variant: 'default' };
  }
  if (completion >= 85) {
    return { color: 'yellow', label: 'Quasi completato', variant: 'secondary' };
  }
  if (completion >= 70) {
    return { color: 'orange', label: 'Parziale', variant: 'outline' };
  }
  return { color: 'red', label: 'Incompleto', variant: 'destructive' };
}

/**
 * Get RPE color
 */
export function getRPEColor(rpe: number): string {
  if (rpe < 7) return 'text-green-600';
  if (rpe < 8) return 'text-yellow-600';
  if (rpe < 9) return 'text-orange-600';
  return 'text-red-600';
}
