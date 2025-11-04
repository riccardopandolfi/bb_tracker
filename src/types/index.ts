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

export interface MuscleGroupWithColor {
  name: string;
  color: string;
}

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

// Blocco di metodologia all'interno di un esercizio
export interface ExerciseBlock {
  // Per resistance
  rest?: number; // Rest intra-set (secondi)
  sets?: number;
  repsBase?: string;
  repRange?: RepRangeKey;
  targetLoads?: string[]; // Array di carichi, uno per ogni set (per tecniche normali o come fallback)
  targetLoadsByCluster?: string[][]; // Array di array: per ogni set, array di carichi per ogni cluster/mini-set (per tecniche speciali)
  targetRPE?: number; // RPE pianificato a priori (5-10)
  technique?: Technique;
  techniqueSchema?: string;
  techniqueParams?: Record<string, any>; // Parametri tecnica (per sistema parametrizzato)
  coefficient?: number;

  // Per cardio
  duration?: number; // Minuti

  blockRest?: number; // Rest dopo questo blocco (secondi) - null se è l'ultimo blocco
  notes?: string; // Note personalizzate per il blocco
}

// Program (Scheda)
export interface ProgramExercise {
  exerciseName: string;
  exerciseType: ExerciseType; // 'resistance' o 'cardio'
  
  blocks: ExerciseBlock[]; // Array di blocchi di metodologie
  
  notes: string;
  
  // Campi legacy per retrocompatibilità (deprecati)
  /** @deprecated Usa blocks[0].rest */
  rest?: number;
  /** @deprecated Usa blocks[0].sets */
  sets?: number;
  /** @deprecated Usa blocks[0].repsBase */
  repsBase?: string;
  /** @deprecated Usa blocks[0].repRange */
  repRange?: RepRangeKey;
  /** @deprecated Usa blocks[0].targetLoads */
  targetLoads?: string[];
  /** @deprecated Usa blocks[0].targetRPE */
  targetRPE?: number;
  /** @deprecated Usa blocks[0].technique */
  technique?: Technique;
  /** @deprecated Usa blocks[0].techniqueSchema */
  techniqueSchema?: string;
  /** @deprecated Usa blocks[0].techniqueParams */
  techniqueParams?: Record<string, any>;
  /** @deprecated Usa blocks[0].coefficient */
  coefficient?: number;
  /** @deprecated Usa blocks[0].duration */
  duration?: number;
}

export interface Day {
  name: string;
  exercises: ProgramExercise[];
}

export interface Week {
  days: Day[];
}

// Program (Macro Programma)
export interface Program {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  weeks: Record<number, Week>;
  macros: Record<number, WeekMacros>;
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
  programId: number; // ID del programma a cui appartiene
  date: string;
  weekNum: number;
  exercise: string;
  
  // Informazioni sul giorno
  dayIndex?: number; // Indice del giorno nella settimana (0-based)
  dayName?: string; // Nome del giorno (es. "Push", "Pull", "Legs")
  
  // Dati del blocco loggato
  blockIndex: number; // Indice del blocco nell'esercizio (0, 1, 2...)
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
  
  blockRest?: number; // Rest dopo questo blocco (null se è l'ultimo blocco)
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
  currentTab: 'home' | 'library' | 'programs' | 'program' | 'logbook' | 'macros';
  currentProgramId: number;
  currentWeek: number;
  exercises: Exercise[];
  programs: Record<number, Program>;
  loggedSessions: LoggedSession[];
  muscleGroups: string[]; // Gruppi muscolari personalizzati
  muscleGroupColors: Record<string, string>; // Colori per gruppi muscolari personalizzati
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
