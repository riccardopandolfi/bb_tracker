import { ProgramExercise, ExerciseBlock } from '@/types';

/**
 * Migra un esercizio dal vecchio formato (campi legacy) al nuovo formato (blocks)
 */
export function migrateExercise(exercise: ProgramExercise): ProgramExercise {
  // Se l'esercizio ha già blocks, ritorna com'è
  if (exercise.blocks && exercise.blocks.length > 0) {
    return exercise;
  }

  // Migra dal formato legacy
  const block: ExerciseBlock = {
    rest: exercise.rest ?? 90,
    sets: exercise.sets ?? 3,
    repsBase: exercise.repsBase ?? '10',
    repRange: exercise.repRange ?? '8-12',
    targetLoads: exercise.targetLoads ?? ['80', '80', '80'],
    targetRPE: exercise.targetRPE ?? 8,
    technique: exercise.technique ?? 'Normale',
    techniqueSchema: exercise.techniqueSchema ?? '',
    techniqueParams: exercise.techniqueParams ?? {},
    coefficient: exercise.coefficient ?? 1.0,
    duration: exercise.duration,
  };

  return {
    ...exercise,
    blocks: [block],
  };
}

/**
 * Ottiene un blocco da un esercizio (con migrazione automatica)
 */
export function getExerciseBlock(exercise: ProgramExercise, blockIndex: number = 0): ExerciseBlock | null {
  const migrated = migrateExercise(exercise);
  return migrated.blocks[blockIndex] || null;
}

/**
 * Ottiene tutti i blocchi di un esercizio (con migrazione automatica)
 */
export function getExerciseBlocks(exercise: ProgramExercise): ExerciseBlock[] {
  const migrated = migrateExercise(exercise);
  return migrated.blocks;
}

/**
 * Crea un nuovo blocco vuoto con valori di default
 */
export function createDefaultBlock(exerciseType: 'resistance' | 'cardio'): ExerciseBlock {
  if (exerciseType === 'cardio') {
    return {
      duration: 30,
    };
  }

  return {
    rest: 90,
    sets: 3,
    repsBase: '10',
    repRange: '8-12',
    targetLoads: ['80', '80', '80'],
    targetRPE: 8,
    technique: 'Normale',
    techniqueSchema: '',
    techniqueParams: {},
    coefficient: 1.0,
  };
}

/**
 * Calcola target reps per un blocco
 */
export function calculateBlockTargetReps(block: ExerciseBlock): number {
  if (!block.sets || !block.repsBase) return 0;

  if (block.technique !== 'Normale' && block.techniqueSchema) {
    const clusters = block.techniqueSchema.split('+').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    if (clusters.length > 0) {
      const sumPerSet = clusters.reduce((a, b) => a + b, 0);
      return sumPerSet * block.sets;
    }
  }

  // Tecnica normale
  const repsBase = parseInt(block.repsBase, 10);
  if (isNaN(repsBase)) return 0;
  return repsBase * block.sets;
}

