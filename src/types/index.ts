// Gruppi muscolari default (ora dinamici nello state)
export const DEFAULT_MUSCLE_GROUPS = [
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
];

export type MuscleGroup = string; // Ora dinamico

// Rep Ranges
export const REP_RANGES = {
  '1-5': { label: '1-5', focus: 'Forza' },
  '6-8': { label: '6-8', focus: 'Forza-Ipertrofia' },
  '8-12': { label: '8-12', focus: 'Ipertrofia' },
  '12-20': { label: '12-20', focus: 'Pump' },
  '20+': { label: '20+', focus: 'Endurance' },
} as const;

export type RepRangeKey = keyof typeof REP_RANGES;

// Tecniche di allenamento default
export const DEFAULT_TECHNIQUES = [
  'Normale',
  'Rest-Pause',
  'Myo-Reps',
  'Drop-Set',
  'Cluster Sets',
  'Reps Scalare',
  'Reps Crescente',
  '1.5 Reps',
];

export type Technique = string; // Ora dinamico

// Attrezzature cardio
export const CARDIO_EQUIPMENT = [
  'Cyclette',
  'Tapis Roulant',
  'Stair Master',
] as const;

export type CardioEquipment = typeof CARDIO_EQUIPMENT[number];

// Tecnica personalizzata
export interface TechniqueParameter {
  name: string;
  type: 'number' | 'text' | 'select';
  label: string;
  options?: string[]; // Per type="select"
  defaultValue?: any;
}

export interface CustomTechnique {
  name: string;
  description: string;
  parameters: TechniqueParameter[];
}

// Exercise Library
export interface MuscleDistribution {
  muscle: MuscleGroup;
  percent: number;
}

export type ExerciseType = 'resistance' | 'cardio';

export interface Exercise {
  name: string;
  type: ExerciseType;
  muscles?: MuscleDistribution[]; // Solo per resistance
  cardioEquipment?: CardioEquipment; // Solo per cardio
}

// Program (Scheda)
export interface ProgramExercise {
  exerciseName: string;
  exerciseType: ExerciseType; // 'resistance' o 'cardio'

  // Per resistance
  rest?: number;
  sets?: number;
  repsBase?: string;
  repRange?: RepRangeKey;
  targetLoads?: string[]; // Array di carichi, uno per ogni set
  targetRPE?: number; // RPE pianificato a priori (5-10)
  technique?: Technique;
  techniqueSchema?: string;
  techniqueParams?: Record<string, any>; // Parametri tecnica (per sistema parametrizzato)
  coefficient?: number;

  // Per cardio
  duration?: number; // Minuti

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
  targetLoads: string[]; // Array di carichi pianificati dalla scheda
  targetRPE: number; // RPE pianificato dalla scheda
  sets: LoggedSet[];
  totalReps: number;
  targetReps: number;
  avgRPE: number; // RPE effettivo (media dei set)
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
  muscleGroups: string[]; // Gruppi muscolari personalizzati
  customTechniques: CustomTechnique[]; // Tecniche personalizzate
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
  estimatedRPE: number;
  muscleCount: number;
}
