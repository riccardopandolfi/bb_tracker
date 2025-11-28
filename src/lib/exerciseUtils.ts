import { ProgramExercise, ExerciseBlock, PercentageProgression, Week } from '@/types';

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

// ============================================
// PROGRESSIONE PERCENTUALE - Helper Functions
// ============================================

/**
 * Calcola il carico da una percentuale del 1RM
 * Arrotonda a 0.5kg per praticità
 */
export function calculateLoadFromPercentage(oneRepMax: number, percentage: number): number {
  const load = oneRepMax * (percentage / 100);
  return Math.round(load * 2) / 2; // Arrotonda a 0.5kg
}

/**
 * Genera i targetLoads per un blocco di progressione
 */
export function generateTargetLoadsForProgressionBlock(
  oneRepMax: number,
  sets: number,
  percentage: number
): string[] {
  const load = calculateLoadFromPercentage(oneRepMax, percentage);
  return Array(sets).fill(load.toString());
}

/**
 * Genera lo schema delle reps per un blocco di progressione
 */
export function generateProgressionBlockSchema(sets: number, reps: number): string {
  return Array(sets).fill(reps).join('+');
}

/**
 * Crea un blocco esercizio dalla configurazione di progressione per una settimana specifica
 */
export function createBlockFromProgressionWeek(
  progression: PercentageProgression,
  weekNumber: number,
  blockIndex: number = 0
): ExerciseBlock | null {
  const weekConfig = progression.weeks.find(w => w.weekNumber === weekNumber);
  if (!weekConfig || !weekConfig.blocks[blockIndex]) return null;

  const blockConfig = weekConfig.blocks[blockIndex];
  const load = calculateLoadFromPercentage(progression.oneRepMax, blockConfig.percentage);

  return {
    sets: blockConfig.sets,
    repsBase: blockConfig.reps.toString(),
    repRange: blockConfig.reps <= 5 ? '1-5' : blockConfig.reps <= 8 ? '6-8' : '8-12',
    targetLoads: Array(blockConfig.sets).fill(load.toString()),
    targetRPE: 8,
    technique: 'Progressione a %',
    techniqueSchema: `${blockConfig.sets}x${blockConfig.reps}@${blockConfig.percentage}%`,
    techniqueParams: {
      oneRepMax: progression.oneRepMax,
      percentage: blockConfig.percentage,
      percentageProgression: progression,
    },
    coefficient: 1.0,
    rest: 180, // Default 3 minuti per lavoro pesante
    percentageProgression: progression,
  };
}

/**
 * Applica una progressione a tutte le settimane del programma
 * Crea nuove settimane se necessario
 */
export function applyProgressionToWeeks(
  progression: PercentageProgression,
  currentWeeks: Record<number, Week>,
  dayIndex: number,
  exerciseIndex: number,
  exerciseName: string
): Record<number, Week> {
  const newWeeks = { ...currentWeeks };
  
  progression.weeks.forEach(weekConfig => {
    const weekNum = weekConfig.weekNumber;
    
    // Se la settimana non esiste, creala clonando la settimana 1
    if (!newWeeks[weekNum]) {
      const baseWeek = newWeeks[1];
      if (baseWeek) {
        newWeeks[weekNum] = {
          days: baseWeek.days.map(day => ({
            name: day.name,
            exercises: day.exercises.map(ex => ({
              ...ex,
              blocks: ex.blocks.map(block => ({ ...block })),
            })),
          })),
        };
      } else {
        // Crea una settimana vuota con un giorno vuoto
        newWeeks[weekNum] = {
          days: [{
            name: 'Day 1',
            exercises: [],
          }],
        };
      }
    }
    
    const week = newWeeks[weekNum];
    const day = week.days[dayIndex];
    
    if (!day) return;
    
    // Trova l'esercizio o crealo se non esiste
    let exercise = day.exercises[exerciseIndex];
    
    if (!exercise) {
      // L'esercizio non esiste in questa settimana, lo creiamo
      exercise = {
        exerciseName,
        exerciseType: 'resistance',
        blocks: [],
        notes: '',
      };
      day.exercises[exerciseIndex] = exercise;
    }
    
    // Genera i blocchi per questa settimana dalla configurazione
    const newBlocks: ExerciseBlock[] = weekConfig.blocks.map((blockConfig, blockIdx) => {
      const load = calculateLoadFromPercentage(progression.oneRepMax, blockConfig.percentage);
      
      return {
        sets: blockConfig.sets,
        repsBase: blockConfig.reps.toString(),
        repRange: blockConfig.reps <= 5 ? '1-5' : blockConfig.reps <= 8 ? '6-8' : '8-12',
        targetLoads: Array(blockConfig.sets).fill(load.toString()),
        targetRPE: weekConfig.targetRPE ?? 8,
        technique: 'Progressione a %',
        techniqueSchema: `${blockConfig.sets}x${blockConfig.reps}@${blockConfig.percentage}%`,
        techniqueParams: {
          oneRepMax: progression.oneRepMax,
          percentage: blockConfig.percentage,
          percentageProgression: progression,
        },
        coefficient: weekConfig.coefficient ?? 1.0,
        rest: weekConfig.rest ?? 180,
        blockRest: blockIdx < weekConfig.blocks.length - 1 ? (weekConfig.rest ?? 180) : undefined,
        percentageProgression: progression,
      };
    });
    
    exercise.blocks = newBlocks;
  });
  
  return newWeeks;
}

/**
 * Crea una progressione di default
 */
export function createDefaultProgression(): PercentageProgression {
  return {
    oneRepMax: 100,
    weeks: [
      {
        weekNumber: 1,
        blocks: [
          { sets: 4, reps: 6, percentage: 70 },
        ],
        coefficient: 1.0,
        targetRPE: 8,
        rest: 180,
      },
    ],
  };
}

/**
 * Valida una configurazione di progressione
 */
export function validateProgression(progression: PercentageProgression): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!progression.oneRepMax || progression.oneRepMax <= 0) {
    errors.push('Il 1RM deve essere maggiore di 0');
  }
  
  if (!progression.weeks || progression.weeks.length === 0) {
    errors.push('Devi configurare almeno una settimana');
  }
  
  progression.weeks?.forEach((week) => {
    if (!week.blocks || week.blocks.length === 0) {
      errors.push(`La settimana ${week.weekNumber} non ha blocchi configurati`);
    }
    
    week.blocks?.forEach((block, blockIdx) => {
      if (block.sets < 1) {
        errors.push(`Settimana ${week.weekNumber}, Blocco ${blockIdx + 1}: sets deve essere almeno 1`);
      }
      if (block.reps < 1) {
        errors.push(`Settimana ${week.weekNumber}, Blocco ${blockIdx + 1}: reps deve essere almeno 1`);
      }
      if (block.percentage < 1 || block.percentage > 100) {
        errors.push(`Settimana ${week.weekNumber}, Blocco ${blockIdx + 1}: la percentuale deve essere tra 1 e 100`);
      }
    });
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

