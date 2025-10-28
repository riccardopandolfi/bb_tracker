// Gruppi muscolari disponibili
export const MUSCLE_GROUPS = [
  'Petto',
  'Dorso - Lats',
  'Dorso - Upper Back',
  'Dorso - Trapezi',
  'Deltoidi - Anteriore',
  'Deltoidi - Laterale',
  'Deltoidi - Posteriore',
  'Bicipiti',
  'Tricipiti',
  'Avambracci',
  'Quadricipiti',
  'Femorali',
  'Glutei',
  'Polpacci',
  'Adduttori',
  'Abduttori',
  'Addome',
  'Obliqui',
  'Core',
] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];

// Rep Ranges
export const REP_RANGES = {
  '1-5': { label: '1-5', focus: 'Forza' },
  '6-8': { label: '6-8', focus: 'Forza-Ipertrofia' },
  '8-12': { label: '8-12', focus: 'Ipertrofia' },
  '12-20': { label: '12-20', focus: 'Pump' },
  '20+': { label: '20+', focus: 'Endurance' },
} as const;

export type RepRangeKey = keyof typeof REP_RANGES;

// Tecniche di allenamento
export const TECHNIQUES = [
  'Normale',
  'Rest-Pause',
  'Myo-Reps',
  'Drop-Set',
  'Cluster Sets',
  'Reps Scalare',
  'Reps Crescente',
  '1.5 Reps',
] as const;

export type Technique = typeof TECHNIQUES[number];

// Exercise Library
export interface MuscleDistribution {
  muscle: MuscleGroup;
  percent: number;
}

export interface Exercise {
  name: string;
  muscles: MuscleDistribution[]; // Max 3 muscoli
}

// Program (Scheda)
export interface ProgramExercise {
  exerciseName: string;
  rest: number;
  sets: number;
  repsBase: string;
  repRange: RepRangeKey;
  targetLoad: string;
  technique: Technique;
  techniqueSchema: string;
  coefficient: number;
  notes: string;
}

export interface Day {
  name: string;
  exercises: ProgramExercise[];
}

export interface Week {
  days: Day[];
}

// Logged Sessions
export interface LoggedSet {
  reps: string;
  load: string;
  rpe: string;
  setNum: number;
  clusterNum: number;
}

export interface LoggedSession {
  id: number;
  date: string;
  weekNum: number;
  exercise: string;
  technique: Technique;
  techniqueSchema: string;
  repRange: RepRangeKey;
  coefficient: number;
  sets: LoggedSet[];
  totalReps: number;
  targetReps: number;
  totalTonnage: number;
  avgRPE: number;
  completion: number;
}

// Macros
export interface WeekMacros {
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  notes: string;
}

// Global State
export interface AppState {
  currentTab: 'library' | 'program' | 'logbook';
  currentWeek: number;
  exercises: Exercise[];
  weeks: Record<number, Week>;
  loggedSessions: LoggedSession[];
  macros: Record<number, WeekMacros>;
}

// Volume calculations
export interface VolumeByMuscle {
  [muscle: string]: {
    volume: number;
    estimatedRPE: number;
  };
}

export interface VolumeData {
  total: number;
  byMuscle: VolumeByMuscle;
  totalTonnage: number;
  estimatedRPE: number;
  muscleCount: number;
}
