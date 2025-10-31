import { ProgramExercise, Week, LoggedSession, VolumeData, Exercise, ExerciseBlock } from '@/types';

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
  if (!block.sets || !block.repsBase) return 0;

  if (block.technique !== 'Normale' && block.techniqueSchema) {
    const clusters = parseSchema(block.techniqueSchema);
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
  const byMuscle: Record<string, { volume: number; estimatedRPE: number }> = {};
  let totalEstimatedRPE = 0;
  let exerciseCount = 0;

  week.days.forEach((day) => {
    day.exercises.forEach((ex) => {
      // Skip cardio exercises
      if (ex.exerciseType === 'cardio') return;
      if (!ex.sets || ex.coefficient === undefined) return;

      const volume = ex.sets * ex.coefficient;
      totalVolume += volume;
      totalEstimatedRPE += getEstimatedRPE(ex.coefficient);
      exerciseCount++;

      // Trova l'esercizio nella libreria
      const libraryExercise = exercises.find((e) => e.name === ex.exerciseName);
      const coefficient = ex.coefficient; // Already checked above
      if (libraryExercise && libraryExercise.muscles && coefficient !== undefined) {
        libraryExercise.muscles.forEach((m) => {
          const muscleVolume = (volume * m.percent) / 100;
          if (!byMuscle[m.muscle]) {
            byMuscle[m.muscle] = { volume: 0, estimatedRPE: 0 };
          }
          byMuscle[m.muscle].volume += muscleVolume;
          byMuscle[m.muscle].estimatedRPE = getEstimatedRPE(coefficient);
        });
      }
    });
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

/**
 * Export data to CSV
 */
export function exportToCSV(data: {
  exercises: Exercise[];
  weeks: Record<number, Week>;
  loggedSessions: LoggedSession[];
  macros: Record<number, { kcal: string; protein: string; carbs: string; fat: string; notes: string }>;
}): void {
  let csv = 'BODYBUILDING TRACKER EXPORT\n\n';

  // Esercizi
  csv += 'LIBRERIA ESERCIZI\n';
  csv += 'Nome,Tipo,Muscolo 1,%,Muscolo 2,%,Muscolo 3,%,Attrezzatura Cardio\n';
  data.exercises.forEach((ex) => {
    csv += `"${ex.name}","${ex.type}"`;
    if (ex.type === 'cardio') {
      csv += ',,,,,,' + (ex.cardioEquipment || '');
    } else {
      for (let i = 0; i < 3; i++) {
        if (ex.muscles && ex.muscles[i]) {
          csv += `,"${ex.muscles[i].muscle}",${ex.muscles[i].percent}`;
        } else {
          csv += ',,';
        }
      }
      csv += ',';
    }
    csv += '\n';
  });

  csv += '\n\nSCHEDA\n';
  csv += 'Week,Giorno,Esercizio,Tipo,Sets,Reps,Carichi,Tecnica,Schema,Coeff,Rest,Durata,Note\n';
  Object.keys(data.weeks)
    .sort((a, b) => Number(a) - Number(b))
    .forEach((weekNum) => {
      data.weeks[Number(weekNum)].days.forEach((day) => {
        day.exercises.forEach((ex) => {
          if (ex.exerciseType === 'cardio') {
            csv += `${weekNum},"${day.name}","${ex.exerciseName}","cardio",,,,,,,,"${ex.duration || ''}","${ex.notes}"\n`;
          } else {
            const loads = (ex.targetLoads || []).join('-');
            csv += `${weekNum},"${day.name}","${ex.exerciseName}","resistance",${ex.sets || ''},"${ex.repsBase || ''}","${loads}","${ex.technique || ''}","${ex.techniqueSchema || ''}",${ex.coefficient || ''},${ex.rest || ''},,"${ex.notes}"\n`;
          }
        });
      });
    });

  csv += '\n\nSESSIONI LOGGATE\n';
  csv += 'Data,Week,Esercizio,Tecnica,Rep Range,Reps,Target,Completamento,RPE\n';
  data.loggedSessions.forEach((s) => {
    // Rep Range solo per tecniche normali, altrimenti N/A
    const repRange = s.technique === 'Normale' ? s.repRange : 'N/A';
    csv += `${s.date},${s.weekNum},"${s.exercise}","${s.technique}","${repRange}",${s.totalReps},${s.targetReps},${s.completion}%,${s.avgRPE}\n`;
  });

  csv += '\n\nMACROS\n';
  csv += 'Week,Kcal,Protein,Carbs,Fat,Note\n';
  Object.keys(data.macros)
    .sort((a, b) => Number(a) - Number(b))
    .forEach((weekNum) => {
      const m = data.macros[Number(weekNum)];
      if (m) {
        csv += `${weekNum},${m.kcal || ''},${m.protein || ''},${m.carbs || ''},${m.fat || ''},"${m.notes || ''}"\n`;
      }
    });

  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `bodybuilding-tracker-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}
