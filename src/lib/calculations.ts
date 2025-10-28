import { ProgramExercise, Week, LoggedSession, VolumeData, Exercise } from '@/types';

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
 * Calcola target reps per un esercizio
 */
export function calculateTargetReps(exercise: ProgramExercise): number {
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
      totalTonnage: 0,
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
      const volume = ex.sets * ex.coefficient;
      totalVolume += volume;
      totalEstimatedRPE += getEstimatedRPE(ex.coefficient);
      exerciseCount++;

      // Trova l'esercizio nella libreria
      const libraryExercise = exercises.find((e) => e.name === ex.exerciseName);
      if (libraryExercise) {
        libraryExercise.muscles.forEach((m) => {
          const muscleVolume = (volume * m.percent) / 100;
          if (!byMuscle[m.muscle]) {
            byMuscle[m.muscle] = { volume: 0, estimatedRPE: 0 };
          }
          byMuscle[m.muscle].volume += muscleVolume;
          byMuscle[m.muscle].estimatedRPE = getEstimatedRPE(ex.coefficient);
        });
      }
    });
  });

  return {
    total: Math.round(totalVolume * 10) / 10,
    byMuscle,
    totalTonnage: 0, // Calcolato da sessioni loggate
    estimatedRPE: exerciseCount > 0 ? totalEstimatedRPE / exerciseCount : 0,
    muscleCount: Object.keys(byMuscle).length,
  };
}

/**
 * Calcola tonnellaggio reale da sessioni loggate
 */
export function calculateRealTonnage(
  sessions: LoggedSession[],
  weekNum: number
): number {
  return sessions
    .filter((s) => s.weekNum === weekNum)
    .reduce((sum, s) => sum + s.totalTonnage, 0);
}

/**
 * Calcola metriche da LoggedSet array
 */
export function calculateSessionMetrics(
  sets: Array<{ reps: string; load: string; rpe: string }>
): {
  totalReps: number;
  totalTonnage: number;
  avgRPE: number;
} {
  let totalReps = 0;
  let totalTonnage = 0;
  let rpeSum = 0;
  let rpeCount = 0;

  sets.forEach((set) => {
    const reps = parseInt(set.reps, 10) || 0;
    const load = parseFloat(set.load) || 0;
    const rpe = parseFloat(set.rpe) || 0;

    totalReps += reps;
    totalTonnage += reps * load;

    if (rpe > 0) {
      rpeSum += rpe;
      rpeCount++;
    }
  });

  return {
    totalReps,
    totalTonnage: Math.round(totalTonnage * 10) / 10,
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
  csv += 'Nome,Muscolo 1,%,Muscolo 2,%,Muscolo 3,%\n';
  data.exercises.forEach((ex) => {
    csv += `"${ex.name}"`;
    for (let i = 0; i < 3; i++) {
      if (ex.muscles[i]) {
        csv += `,"${ex.muscles[i].muscle}",${ex.muscles[i].percent}`;
      } else {
        csv += ',,';
      }
    }
    csv += '\n';
  });

  csv += '\n\nSCHEDA\n';
  csv += 'Week,Giorno,Esercizio,Sets,Reps,Carico,Tecnica,Schema,Coeff,Rest,Note\n';
  Object.keys(data.weeks)
    .sort((a, b) => Number(a) - Number(b))
    .forEach((weekNum) => {
      data.weeks[Number(weekNum)].days.forEach((day) => {
        day.exercises.forEach((ex) => {
          csv += `${weekNum},"${day.name}","${ex.exerciseName}",${ex.sets},"${ex.repsBase}","${ex.targetLoad}","${ex.technique}","${ex.techniqueSchema}",${ex.coefficient},${ex.rest},"${ex.notes}"\n`;
        });
      });
    });

  csv += '\n\nSESSIONI LOGGATE\n';
  csv += 'Data,Week,Esercizio,Tecnica,Rep Range,Reps,Target,Completamento,Tonnage,RPE\n';
  data.loggedSessions.forEach((s) => {
    csv += `${s.date},${s.weekNum},"${s.exercise}","${s.technique}","${s.repRange}",${s.totalReps},${s.targetReps},${s.completion}%,${s.totalTonnage},${s.avgRPE}\n`;
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
