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
  'Ramping',
  'Rest-Pause',
  'Myo-Reps',
  'Drop-Set',
  'Cluster Sets',
  'Reps Scalare',
  'Reps Crescente',
  '1.5 Reps',
  'Progressione a %',
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

// Progressione Percentuale (basata su 1RM)
export interface ProgressionBlockConfig {
  sets: number;
  reps: number;
  percentage: number; // % del 1RM (es. 70, 75, 80)
}

export interface ProgressionWeekConfig {
  weekNumber: number;
  blocks: ProgressionBlockConfig[];
  // Parametri di intensità per la settimana
  coefficient?: number; // Coefficiente (default 1.0)
  targetRPE?: number; // RPE target (5-10)
  rest?: number; // Rest tra i set in secondi
}

export interface PercentageProgression {
  oneRepMax: number; // 1RM in kg
  weeks: ProgressionWeekConfig[];
}

// Blocco di metodologia all'interno di un esercizio
export interface ExerciseBlock {
  // Per resistance
  rest?: number; // Rest intra-set (secondi)
  sets?: number;
  repsBase?: string;
  repRange?: RepRangeKey;
  targetReps?: string[]; // Array di ripetizioni, una per ogni set (se vuoi reps diverse per set, altrimenti usa repsBase)
  targetLoads?: string[]; // Array di carichi, uno per ogni set (per tecniche normali o come fallback)
  targetLoadsByCluster?: string[][]; // Array di array: per ogni set, array di carichi per ogni cluster/mini-set (per tecniche speciali)
  targetRPE?: number; // RPE pianificato a priori (5-10)
  technique?: Technique;
  techniqueSchema?: string;
  techniqueParams?: Record<string, any>; // Parametri tecnica (per sistema parametrizzato)
  coefficient?: number;

  // Per Ramping
  startLoad?: string; // Carico iniziale per ramping
  increment?: string; // Incremento carico per ramping (opzionale - può essere libero)

  // Per cardio
  duration?: number; // Minuti

  blockRest?: number; // Rest dopo questo blocco (secondi) - null se è l'ultimo blocco
  notes?: string; // Note personalizzate per il blocco

  // Per Progressione a %
  percentageProgression?: PercentageProgression; // Configurazione progressione multi-settimana
}

// Program (Scheda)
export interface ProgramExercise {
  exerciseName: string;
  exerciseType: ExerciseType; // 'resistance' o 'cardio'
  muscleGroup?: string; // Gruppo muscolare manuale per vista tabellare
  
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
  notes?: string; // Note del log
}

// Daily Macros
export interface Supplement {
  name: string;
  grams: string;
}

export interface DayMacros {
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
}

export interface DailyMacrosWeek {
  days: DayMacros[]; // Array di 7 giorni (0=Lunedì, 6=Domenica)
  checked: boolean[]; // Array di 7 boolean per tracking spunte
  supplements: Supplement[]; // Integratori comuni per tutta la settimana
}

// Macros Multi-Settimana e Carb Cycling

// Macro pianificati per un giorno (numeri per calcoli più precisi)
export interface PlannedDayMacros {
  protein: number;  // grammi
  carbs: number;    // grammi
  fat: number;      // grammi
  kcal: number;     // calcolato automaticamente
}

// Piano macro per una settimana (unificato: manuale + cycling)
export interface WeekMacrosPlan {
  weekNumber: number;
  days: PlannedDayMacros[];  // 7 giorni (0=Lun, 6=Dom)
  checked: boolean[];        // 7 boolean per tracking completamento
  fromCycling?: boolean;     // true se generato da Carb Cycling
}

// Modalità Carb Cycling
export type CarbCyclingMode = 'per_day' | 'training_based' | 'custom';

// Template Carb Cycling
export interface CarbCyclingTemplate {
  id: string;
  name: string;
  baseMacros: { protein: number; carbs: number; fat: number };
  mode: CarbCyclingMode;
  // Per mode 'per_day': moltiplicatori per ogni giorno (0-6, Lun-Dom)
  dayMultipliers?: number[];  // es. [1.2, 0.8, 1.0, 1.2, 0.8, 1.0, 0.8]
  // Per mode 'training_based'
  trainingMultiplier?: number;  // es. 1.2 = +20%
  restMultiplier?: number;      // es. 0.8 = -20%
}

// User Management
export interface User {
  id: string;
  name: string;
  createdAt: string;
}

export interface UserData {
  currentTab: 'home' | 'library' | 'programs' | 'program' | 'logbook' | 'macros';
  currentProgramId: number | null;
  currentWeek: number;
  exercises: Exercise[];
  programs: Record<number, Program>;
  loggedSessions: LoggedSession[];
  muscleGroups: string[]; // Gruppi muscolari personalizzati
  muscleGroupColors: Record<string, string>; // Colori per gruppi muscolari personalizzati
  customTechniques: CustomTechnique[]; // Tecniche personalizzate
  dailyMacros: DailyMacrosWeek | null; // Legacy (per migrazione)
  // Sistema macros multi-settimana unificato
  macrosPlans: WeekMacrosPlan[];      // Piano macro per ogni settimana del programma
  supplements: Supplement[];           // Integratori globali
  carbCyclingTemplates: CarbCyclingTemplate[];  // Template carb cycling salvati
  activeCarbCyclingId: string | null;  // ID del template carb cycling attivo
}

// Global State
export interface AppState {
  users: User[];
  currentUserId: string;
  userData: Record<string, UserData>;
}

export type ProfileRole = 'athlete' | 'coach' | 'hybrid';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: ProfileRole;
  created_at: string;
  updated_at: string;
}

export type CoachingRelationshipStatus = 'pending' | 'active' | 'revoked';
export type CoachingPermission = 'viewer' | 'editor' | 'admin';

export interface CoachingRelationship {
  id: string;
  coach_id: string;
  athlete_id: string;
  status: CoachingRelationshipStatus;
  permissions: CoachingPermission;
  created_at: string;
  updated_at: string;
  coach?: Profile | null;
  athlete?: Profile | null;
}

// Video delle esecuzioni
export interface ExerciseVideo {
  id: string;
  user_id: string;
  exercise_name: string;
  technique: string;
  sets?: number;
  reps?: string;
  load_kg?: number;
  rpe?: number;
  storage_path: string;
  thumbnail_path?: string;
  file_size_bytes?: number;
  duration_seconds?: number;
  logged_session_id?: number;
  program_name?: string;
  week_num?: number;
  notes?: string;
  recorded_at: string;
  created_at: string;
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
