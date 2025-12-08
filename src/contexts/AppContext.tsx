import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AppState, Exercise, Week, LoggedSession, CustomTechnique, Program, DailyMacrosWeek, DayMacros, User, UserData, PercentageProgression, WeekMacrosPlan, PlannedDayMacros, CarbCyclingTemplate, Supplement, MacroMode, OnOffMacrosPlan, DayType, WeightEntry } from '@/types';
import { DEFAULT_EXERCISES, MUSCLE_COLORS } from '@/lib/constants';
import { DEFAULT_MUSCLE_GROUPS } from '@/types';
import { generateDemoPrograms, generateDemoLoggedSessions } from '@/lib/demoData';
import { loadUserAppState, saveUserAppState, subscribeToUserAppState } from '@/lib/supabaseService';
import { applyProgressionToWeeks } from '@/lib/exerciseUtils';
import { useAuth } from './AuthContext';

interface AppContextType extends UserData {
  // User Management
  users: User[];
  currentUserId: string;
  addUser: (name: string) => void;
  switchUser: (userId: string) => void;
  deleteUser: (userId: string) => void;

  setCurrentTab: (tab: 'home' | 'library' | 'programs' | 'program' | 'logbook' | 'macros') => void;
  setCurrentProgram: (programId: number | null) => void;
  setCurrentWeek: (week: number) => void;
  setExercises: (exercises: Exercise[]) => void;
  addExercise: (exercise: Exercise) => void;
  updateExercise: (index: number, exercise: Exercise) => void;
  deleteExercise: (index: number) => void;
  addProgram: (name: string, description?: string) => void;
  updateProgram: (programId: number, program: Program) => void;
  deleteProgram: (programId: number) => void;
  duplicateProgram: (programId: number) => void;
  setWeeks: (weeks: Record<number, Week>) => void;
  addWeek: (weekNum: number) => void;
  duplicateWeek: (weekNum: number) => void;
  deleteWeek: (weekNum: number) => void;
  updateWeek: (weekNum: number, week: Week) => void;
  addLoggedSession: (session: LoggedSession) => void;
  updateLoggedSession: (session: LoggedSession) => void;
  deleteLoggedSession: (sessionId: number) => void;
  addMuscleGroup: (muscleGroup: string, color?: string) => void;
  updateMuscleGroupColor: (muscleGroup: string, color: string) => void;
  deleteMuscleGroup: (muscleGroup: string) => boolean;
  getMuscleColor: (muscleName: string) => string;
  addCustomTechnique: (technique: CustomTechnique) => void;
  deleteCustomTechnique: (techniqueName: string) => void;
  resetAllData: () => void;
  loadDemoData: () => void;
  clearDemoData: () => void;
  clearDemoDataSilent: () => void;
  hasDemoData: () => boolean;

  // Daily Macros (legacy)
  initializeDailyMacros: () => void;
  updateDailyMacros: (dayIndex: number, macros: DayMacros) => void;
  checkDay: (dayIndex: number) => void;
  getCurrentDayIndex: () => number;
  getLastCheckedDayIndex: () => number | null;
  updateSupplements: (supplements: import('@/types').Supplement[]) => void;

  // Macros Multi-Settimana (sistema unificato)
  getOrCreateWeekPlan: (weekNum: number) => WeekMacrosPlan;
  updateWeekMacros: (weekNum: number, dayIndex: number, macros: PlannedDayMacros) => void;
  checkWeekDay: (weekNum: number, dayIndex: number) => void;
  getMacrosPlanForWeek: (weekNum: number) => WeekMacrosPlan | undefined;
  copyWeekPlan: (fromWeek: number, toWeek: number) => void;
  resetWeekPlan: (weekNum: number) => void;
  
  // Carb Cycling
  saveCarbCyclingTemplate: (template: CarbCyclingTemplate) => void;
  deleteCarbCyclingTemplate: (templateId: string) => void;
  setActiveCarbCycling: (templateId: string | null) => void;
  applyCarbCyclingToWeeks: (templateId: string, weekNumbers: number[], trainingDays?: number[][], templateData?: CarbCyclingTemplate) => void;
  
  // Utility
  calculateMacrosFromBase: (baseMacros: { protein: number; carbs: number; fat: number }, multiplier: number) => PlannedDayMacros;
  
  // Supplements (globali)
  updateGlobalSupplements: (supplements: Supplement[]) => void;

  // Helper getters
  getCurrentProgram: () => Program | undefined;
  getCurrentWeeks: () => Record<number, Week>;
  
  // Progressione percentuale
  applyProgressionToAllWeeks: (
    progression: PercentageProgression,
    dayIndex: number,
    exerciseIndex: number,
    exerciseName: string
  ) => void;
  
  // Sistema On/Off
  setMacroMode: (mode: MacroMode) => void;
  updateOnOffPlan: (plan: OnOffMacrosPlan) => void;
  setDayType: (weekNum: number, dayIndex: number, dayType: DayType) => void;
  
  // Weight Tracking
  addWeight: (weight: number, date?: string) => void;
  getWeightHistory: (days?: number) => WeightEntry[];
  getTodayWeight: () => number | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'bodybuilding-data';

const createDefaultUserData = (): UserData => ({
  currentTab: 'home',
  currentProgramId: null,
  currentWeek: 1,
  exercises: DEFAULT_EXERCISES,
  programs: {},
  loggedSessions: [],
  muscleGroups: [...DEFAULT_MUSCLE_GROUPS],
  muscleGroupColors: {},
  customTechniques: [],
  dailyMacros: null, // Legacy
  // Sistema macros multi-settimana unificato
  macrosPlans: [],
  supplements: [],
  carbCyclingTemplates: [],
  activeCarbCyclingId: null,
  // Sistema On/Off
  macroMode: 'fixed',
  onOffPlan: null,
  // Weight Tracking
  weightHistory: [],
});

const defaultUser: User = {
  id: 'default',
  name: 'Riccardo',
  createdAt: new Date().toISOString(),
};

const defaultState: AppState = {
  users: [defaultUser],
  currentUserId: defaultUser.id,
  userData: {
    [defaultUser.id]: createDefaultUserData(),
  },
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);
  const isSavingRef = useRef(false);
  const { user: authUser, activeAccountId } = useAuth();
  const remoteOwnerId = authUser ? (activeAccountId ?? authUser.id) : null;
  const storageKey = remoteOwnerId ? `${STORAGE_KEY}-${remoteOwnerId}` : STORAGE_KEY;
  const isRemoteMode = Boolean(remoteOwnerId);

  // Gestione caricamento dati (Supabase o localStorage)
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      try {
        if (isRemoteMode && remoteOwnerId) {
          const remoteState = await loadUserAppState(remoteOwnerId);
          const nextState = remoteState ? migrateData(remoteState) : defaultState;

          if (!remoteState) {
            await saveUserAppState(remoteOwnerId, nextState);
          }

          if (!cancelled) {
            setState(nextState);
            localStorage.setItem(storageKey, JSON.stringify(nextState));
          }

          unsubscribe = subscribeToUserAppState(remoteOwnerId, (newState) => {
            isSavingRef.current = true;
            const migrated = migrateData(newState);
            setState(migrated);
            localStorage.setItem(storageKey, JSON.stringify(migrated));
            setTimeout(() => {
              isSavingRef.current = false;
            }, 100);
          });
        } else {
          const saved = localStorage.getItem(storageKey);
      if (saved) {
          const data = JSON.parse(saved);
          const migratedData = migrateData(data);
          setState(migratedData);
          } else {
            setState(defaultState);
            }
        }
        } catch (error) {
        console.error('Errore nel caricamento dei dati', error);
        if (!isRemoteMode) {
          setState(defaultState);
        }
      } finally {
        if (!cancelled) {
      setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [isRemoteMode, remoteOwnerId, storageKey]);

  // Helper function to migrate data format
  const migrateData = (data: any): AppState => {
    // Check if it's already the new format
    if (data.users && Array.isArray(data.users) && data.userData) {
      // MIGRATION FIX: Rename "Utente Principale" to "Riccardo" if found
      const updatedUsers = data.users.map((u: User) => {
        if (u.id === 'default' && u.name === 'Utente Principale') {
          return { ...u, name: 'Riccardo' };
        }
        return u;
      });

      if (JSON.stringify(updatedUsers) !== JSON.stringify(data.users)) {
        console.log('Migrating user name: Utente Principale -> Riccardo');
        return { ...data, users: updatedUsers };
      }

      return data as AppState;
    }

    console.log('Migrating old data format to multi-user structure...');

    // It's the old format (UserData directly at root)
    // We need to migrate the inner structure first (programs, etc.) just in case
    // This logic is copied from the previous migrateData but adapted

    // MIGRATION: Convert old format (weeks/macros at root) to new format (programs)
    let migratedPrograms: Record<number, Program>;
    let migratedCurrentProgramId: number | null;

    if (data.programs) {
      // New format already exists
      migratedPrograms = data.programs;
      if (typeof data.currentProgramId === 'number') {
        migratedCurrentProgramId = data.currentProgramId;
      } else {
        const firstProgramId = Object.keys(migratedPrograms)[0];
        migratedCurrentProgramId = firstProgramId ? Number(firstProgramId) : null;
      }
    } else {
      // Old format: convert weeks to Program 1
      const oldWeeks = data.weeks || { 1: { days: [] } };
      migratedPrograms = {
        1: {
          id: 1,
          name: 'Programma Default',
          description: 'Programma migrato dalla versione precedente',
          createdAt: new Date().toISOString(),
          weeks: oldWeeks,
        },
      };
      migratedCurrentProgramId = 1;
    }

    // Migrate weeks within each program
    Object.keys(migratedPrograms).forEach((programKey) => {
      const program = migratedPrograms[Number(programKey)];
      const migratedWeeks = program.weeks || { 1: { days: [] } };
      Object.keys(migratedWeeks).forEach((weekKey) => {
        const week = migratedWeeks[Number(weekKey)];
        if (week && week.days) {
          week.days.forEach((day: any) => {
            if (day && day.exercises) {
              day.exercises.forEach((ex: any) => {
                if (!ex.hasOwnProperty('techniqueParams')) ex.techniqueParams = {};
                if (!ex.hasOwnProperty('targetRPE')) {
                  if (ex.coefficient <= 0.7) ex.targetRPE = 5.5;
                  else if (ex.coefficient <= 0.9) ex.targetRPE = 7.5;
                  else if (ex.coefficient <= 1.0) ex.targetRPE = 8.5;
                  else ex.targetRPE = 10.0;
                }
                if (ex.hasOwnProperty('targetLoad') && typeof ex.targetLoad === 'string') {
                  const sets = ex.sets || 3;
                  ex.targetLoads = Array(sets).fill(ex.targetLoad);
                  delete ex.targetLoad;
                } else if (!ex.hasOwnProperty('targetLoads') || !Array.isArray(ex.targetLoads)) {
                  const sets = ex.sets || 3;
                  ex.targetLoads = Array(sets).fill('80');
                }
              });
            }
          });
        }
      });
      program.weeks = migratedWeeks;
    });

    // Migrate old logged sessions
    const migratedSessions = (data.loggedSessions || []).map((session: any) => {
      const migrated = { ...session };
      if (!migrated.hasOwnProperty('programId')) migrated.programId = 1;
      if (!migrated.hasOwnProperty('targetRPE')) {
        if (migrated.coefficient <= 0.7) migrated.targetRPE = 5.5;
        else if (migrated.coefficient <= 0.9) migrated.targetRPE = 7.5;
        else if (migrated.coefficient <= 1.0) migrated.targetRPE = 8.5;
        else migrated.targetRPE = 10.0;
      }
      if (migrated.hasOwnProperty('targetLoad') && typeof migrated.targetLoad === 'string') {
        const numSets = migrated.sets?.length || 1;
        migrated.targetLoads = Array(numSets).fill(migrated.targetLoad);
        delete migrated.targetLoad;
      } else if (!migrated.hasOwnProperty('targetLoads') || !Array.isArray(migrated.targetLoads)) {
        migrated.targetLoads = [];
      }
      if (migrated.hasOwnProperty('totalTonnage')) delete migrated.totalTonnage;

      // Add dayIndex/dayName if missing
      if (!migrated.hasOwnProperty('dayIndex') || !migrated.hasOwnProperty('dayName')) {
        const sessionProgramId = migrated.programId || 1;
        const sessionWeekNum = migrated.weekNum || 1;
        const program = migratedPrograms[sessionProgramId];
        if (program && program.weeks && program.weeks[sessionWeekNum]) {
          const week = program.weeks[sessionWeekNum];
          const day = week.days?.find((d: any) =>
            d.exercises?.some((ex: any) => ex.exerciseName === migrated.exercise)
          );
          if (day) {
            migrated.dayIndex = week.days.indexOf(day);
            migrated.dayName = day.name;
          }
        }
      }
      return migrated;
    });

    const migratedExercises = (data.exercises && data.exercises.length > 0 ? data.exercises : DEFAULT_EXERCISES).map((ex: any) => {
      if (!ex.type) {
        return { ...ex, type: ex.muscles ? 'resistance' : 'cardio' };
      }
      return ex;
    });

    const migratedUserData: UserData = {
      currentTab: data.currentTab || 'library',
      currentProgramId: migratedCurrentProgramId,
      currentWeek: data.currentWeek || 1,
      exercises: migratedExercises,
      programs: migratedPrograms,
      loggedSessions: migratedSessions,
      muscleGroups: data.muscleGroups || [...DEFAULT_MUSCLE_GROUPS],
      muscleGroupColors: data.muscleGroupColors || {},
      customTechniques: data.customTechniques || [],
      dailyMacros: data.dailyMacros || null,
      // Sistema macros multi-settimana unificato
      macrosPlans: data.macrosPlans || [],
      supplements: data.supplements || data.dailyMacros?.supplements || [],
      carbCyclingTemplates: data.carbCyclingTemplates || [],
      activeCarbCyclingId: data.activeCarbCyclingId || null,
      // Sistema On/Off
      macroMode: data.macroMode || 'fixed',
      onOffPlan: data.onOffPlan || null,
      // Weight Tracking
      weightHistory: data.weightHistory || [],
    };

    return {
      users: [defaultUser],
      currentUserId: defaultUser.id,
      userData: {
        [defaultUser.id]: migratedUserData,
      },
    };
  };

  // Persistenza dati (localStorage + Supabase)
  useEffect(() => {
    if (isLoading || isSavingRef.current) return;

    const timeoutId = setTimeout(async () => {
      localStorage.setItem(storageKey, JSON.stringify(state));
      if (isRemoteMode && remoteOwnerId) {
      try {
          await saveUserAppState(remoteOwnerId, state);
      } catch (error) {
          console.error('Errore nel salvataggio su Supabase', error);
        }
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [state, isLoading, isRemoteMode, remoteOwnerId, storageKey]);

  // Helper to update current user data
  const updateCurrentUser = (updateFn: (prev: UserData) => Partial<UserData>) => {
    setState((prev) => {
      const currentUserData = prev.userData[prev.currentUserId];
      if (!currentUserData) return prev;

      const updates = updateFn(currentUserData);
      const newUserData = { ...currentUserData, ...updates };

      return {
        ...prev,
        userData: {
          ...prev.userData,
          [prev.currentUserId]: newUserData,
        },
      };
    });
  };

  // User Management Functions
  const addUser = (name: string) => {
    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
      userData: {
        ...prev.userData,
        [newUser.id]: createDefaultUserData(),
      },
      currentUserId: newUser.id, // Switch to new user immediately
    }));
  };

  const switchUser = (userId: string) => {
    if (state.users.some(u => u.id === userId)) {
      setState((prev) => ({ ...prev, currentUserId: userId }));
    }
  };

  const deleteUser = (userId: string) => {
    if (state.users.length <= 1) {
      alert('Impossibile eliminare l\'ultimo utente.');
      return;
    }

    if (confirm('Sei sicuro di voler eliminare questo utente? Tutti i dati associati verranno persi.')) {
      setState((prev) => {
        const newUsers = prev.users.filter(u => u.id !== userId);
        const { [userId]: deleted, ...newUserDataMap } = prev.userData;

        let newCurrentUserId = prev.currentUserId;
        if (prev.currentUserId === userId) {
          newCurrentUserId = newUsers[0].id;
        }

        return {
          ...prev,
          users: newUsers,
          userData: newUserDataMap,
          currentUserId: newCurrentUserId,
        };
      });
    }
  };

  // --- Existing Methods (Wrapped to use updateCurrentUser) ---

  const getCurrentProgram = () => {
    const userData = state.userData[state.currentUserId];
    if (!userData || userData.currentProgramId == null) return undefined;
    return userData.programs[userData.currentProgramId];
  };

  const getCurrentWeeks = () => {
    const program = getCurrentProgram();
    return program?.weeks || {};
  };

  const setCurrentTab = (tab: 'home' | 'library' | 'programs' | 'program' | 'logbook' | 'macros') => {
    updateCurrentUser(() => ({ currentTab: tab }));
  };

  const setCurrentProgram = (programId: number | null) => {
    updateCurrentUser(() => ({ currentProgramId: programId, currentWeek: 1 }));
  };

  const setCurrentWeek = (week: number) => {
    updateCurrentUser(() => ({ currentWeek: week }));
  };

  const setExercises = (exercises: Exercise[]) => {
    updateCurrentUser(() => ({ exercises }));
  };

  const addExercise = (exercise: Exercise) => {
    updateCurrentUser((prev) => ({
      exercises: [...prev.exercises, exercise],
    }));
  };

  const updateExercise = (index: number, exercise: Exercise) => {
    updateCurrentUser((prev) => {
      const newExercises = [...prev.exercises];
      newExercises[index] = exercise;
      return { exercises: newExercises };
    });
  };

  const deleteExercise = (index: number) => {
    updateCurrentUser((prev) => ({
      exercises: prev.exercises.filter((_, i) => i !== index),
    }));
  };

  const addProgram = (name: string, description?: string) => {
    updateCurrentUser((prev) => {
      const existingIds = Object.keys(prev.programs).map(Number);
      const newId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
      const newProgram: Program = {
        id: newId,
        name,
        description: description || '',
        createdAt: new Date().toISOString(),
        weeks: { 1: { days: [] } },
      };

      return {
        programs: { ...prev.programs, [newId]: newProgram },
        currentProgramId: newId,
        currentWeek: 1,
      };
    });
  };

  const updateProgram = (programId: number, program: Program) => {
    updateCurrentUser((prev) => ({
      programs: { ...prev.programs, [programId]: program },
    }));
  };

  const deleteProgram = (programId: number) => {
    const userData = state.userData[state.currentUserId];
    if (!userData.programs[programId]) return;

    if (confirm(`Eliminare il programma "${userData.programs[programId]?.name}"?`)) {
      updateCurrentUser((prev) => {
        const newPrograms = { ...prev.programs };
        delete newPrograms[programId];

        const remainingIds = Object.keys(newPrograms);
        const newCurrentId =
          prev.currentProgramId === programId
            ? remainingIds.length > 0
              ? Number(remainingIds[0])
              : null
            : prev.currentProgramId;

        const filteredSessions = prev.loggedSessions.filter((s) => s.programId !== programId);

        return {
          programs: newPrograms,
          currentProgramId: newCurrentId,
          currentWeek: 1,
          loggedSessions: filteredSessions,
        };
      });
    }
  };

  const duplicateProgram = (programId: number) => {
    const userData = state.userData[state.currentUserId];
    const sourceProgram = userData.programs[programId];
    if (!sourceProgram) return;

    updateCurrentUser((prev) => {
      const existingIds = Object.keys(prev.programs).map(Number);
      const newId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
      const newProgram: Program = {
        ...JSON.parse(JSON.stringify(sourceProgram)),
        id: newId,
        name: `${sourceProgram.name} (Copia)`,
        createdAt: new Date().toISOString(),
      };

      return {
        programs: { ...prev.programs, [newId]: newProgram },
        currentProgramId: newId,
        currentWeek: 1,
      };
    });
  };

  const setWeeks = (weeks: Record<number, Week>) => {
    const program = getCurrentProgram();
    if (!program) return;
    updateProgram(program.id, { ...program, weeks });
  };

  const addWeek = (weekNum: number) => {
    const program = getCurrentProgram();
    if (!program) return;
    updateProgram(program.id, {
      ...program,
      weeks: { ...program.weeks, [weekNum]: { days: [] } },
    });
  };

  const duplicateWeek = (weekNum: number) => {
    const program = getCurrentProgram();
    if (!program) return;
    const sourceWeek = program.weeks[weekNum];
    if (!sourceWeek) return;

    const newWeekNum = Math.max(...Object.keys(program.weeks).map(Number)) + 1;
    updateProgram(program.id, {
      ...program,
      weeks: { ...program.weeks, [newWeekNum]: JSON.parse(JSON.stringify(sourceWeek)) },
    });
    setCurrentWeek(newWeekNum);
  };

  const deleteWeek = (weekNum: number) => {
    const program = getCurrentProgram();
    if (!program) return;
    
    const weekNumbers = Object.keys(program.weeks).map(Number);
    if (weekNumbers.length <= 1) {
      alert('Impossibile eliminare l\'unica settimana del programma.');
      return;
    }
    
    if (!confirm(`Eliminare la Week ${weekNum}?\n\nLe sessioni loggate relative a questa settimana verranno eliminate.`)) return;
    
    const newWeeks = { ...program.weeks };
    delete newWeeks[weekNum];
    
    updateProgram(program.id, { ...program, weeks: newWeeks });
    
    // Aggiorna currentWeek se era quella eliminata
    const userData = state.userData[state.currentUserId];
    if (userData?.currentWeek === weekNum) {
      const remainingWeeks = Object.keys(newWeeks).map(Number).sort((a, b) => a - b);
      setCurrentWeek(remainingWeeks[0] || 1);
    }
    
    // Elimina le sessioni loggate per quella settimana
    updateCurrentUser((prev) => ({
      loggedSessions: prev.loggedSessions.filter(
        s => !(s.programId === program.id && s.weekNum === weekNum)
      ),
    }));
  };

  const updateWeek = (weekNum: number, week: Week) => {
    const program = getCurrentProgram();
    if (!program) return;
    updateProgram(program.id, {
      ...program,
      weeks: { ...program.weeks, [weekNum]: week },
    });
  };

  const addLoggedSession = (session: LoggedSession) => {
    updateCurrentUser((prev) => {
      const filtered = prev.loggedSessions.filter((s) => {
        if (s.id === session.id) return false;
        return !(
          s.programId === session.programId &&
          s.weekNum === session.weekNum &&
          s.exercise === session.exercise &&
          s.blockIndex === session.blockIndex
        );
      });
      return { loggedSessions: [...filtered, session] };
    });
  };

  const updateLoggedSession = (session: LoggedSession) => {
    updateCurrentUser((prev) => ({
      loggedSessions: prev.loggedSessions.map((s) => (s.id === session.id ? session : s)),
    }));
  };

  const deleteLoggedSession = (sessionId: number) => {
    if (confirm('Eliminare questa sessione loggata?')) {
      updateCurrentUser((prev) => ({
        loggedSessions: prev.loggedSessions.filter((s) => s.id !== sessionId),
      }));
    }
  };

  const addMuscleGroup = (muscleGroup: string, color?: string) => {
    updateCurrentUser((prev) => ({
      muscleGroups: [...prev.muscleGroups, muscleGroup],
      muscleGroupColors: color
        ? { ...prev.muscleGroupColors, [muscleGroup]: color }
        : prev.muscleGroupColors,
    }));
  };

  const updateMuscleGroupColor = (muscleGroup: string, color: string) => {
    updateCurrentUser((prev) => ({
      muscleGroupColors: { ...prev.muscleGroupColors, [muscleGroup]: color },
    }));
  };

  const deleteMuscleGroup = (muscleGroup: string) => {
    const userData = state.userData[state.currentUserId];
    const isUsed = userData.exercises.some(
      (ex) => ex.muscles?.some((m) => m.muscle === muscleGroup)
    );

    if (isUsed) {
      alert(`Impossibile eliminare "${muscleGroup}": è utilizzato in uno o più esercizi.`);
      return false;
    }

    if (confirm(`Eliminare il gruppo muscolare "${muscleGroup}"?`)) {
      updateCurrentUser((prev) => {
        const { [muscleGroup]: _, ...remainingColors } = prev.muscleGroupColors;
        return {
          muscleGroups: prev.muscleGroups.filter((m) => m !== muscleGroup),
          muscleGroupColors: remainingColors,
        };
      });
      return true;
    }
    return false;
  };

  const getMuscleColor = (muscleName: string): string => {
    const userData = state.userData[state.currentUserId];
    if (userData?.muscleGroupColors[muscleName]) {
      return userData.muscleGroupColors[muscleName];
    }
    return MUSCLE_COLORS[muscleName] || '#6b7280';
  };

  const addCustomTechnique = (technique: CustomTechnique) => {
    updateCurrentUser((prev) => ({
      customTechniques: [...prev.customTechniques, technique],
    }));
  };

  const deleteCustomTechnique = (techniqueName: string) => {
    if (confirm(`Eliminare la tecnica "${techniqueName}"?`)) {
      updateCurrentUser((prev) => ({
        customTechniques: prev.customTechniques.filter((t) => t.name !== techniqueName),
      }));
    }
  };

  const initializeDailyMacros = () => {
    const emptyDay: DayMacros = { kcal: '', protein: '', carbs: '', fat: '' };
    const dailyMacros: DailyMacrosWeek = {
      days: Array(7).fill(null).map(() => ({ ...emptyDay })),
      checked: Array(7).fill(false),
      supplements: [],
    };
    updateCurrentUser(() => ({ dailyMacros }));
  };

  const updateDailyMacros = (dayIndex: number, macros: DayMacros) => {
    if (dayIndex < 0 || dayIndex > 6) return;
    updateCurrentUser((prev) => {
      if (!prev.dailyMacros) return {};
      const updatedDays = [...prev.dailyMacros.days];
      updatedDays[dayIndex] = macros;
      return {
        dailyMacros: { ...prev.dailyMacros, days: updatedDays },
      };
    });
  };

  const checkDay = (dayIndex: number) => {
    if (dayIndex < 0 || dayIndex > 6) return;
    updateCurrentUser((prev) => {
      if (!prev.dailyMacros) return {};
      const updatedChecked = [...prev.dailyMacros.checked];
      updatedChecked[dayIndex] = true;
      const allChecked = updatedChecked.every(c => c === true);
      if (allChecked) {
        return {
          dailyMacros: { ...prev.dailyMacros, checked: Array(7).fill(false) },
        };
      }
      return {
        dailyMacros: { ...prev.dailyMacros, checked: updatedChecked },
      };
    });
  };

  const getCurrentDayIndex = (): number => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  };

  const getLastCheckedDayIndex = (): number | null => {
    const userData = state.userData[state.currentUserId];
    if (!userData?.dailyMacros) return null;
    for (let i = 6; i >= 0; i--) {
      if (userData.dailyMacros.checked[i]) return i;
    }
    return null;
  };

  const updateSupplements = (supplements: import('@/types').Supplement[]) => {
    updateCurrentUser((prev) => {
      if (!prev.dailyMacros) return {};
      return {
        dailyMacros: { ...prev.dailyMacros, supplements },
      };
    });
  };

  // === MACROS MULTI-SETTIMANA (SISTEMA UNIFICATO) ===
  
  // Utility per calcolare calorie da macro
  const calculateMacrosFromBase = (
    baseMacros: { protein: number; carbs: number; fat: number },
    multiplier: number
  ): PlannedDayMacros => {
    const protein = Math.round(baseMacros.protein * multiplier);
    const carbs = Math.round(baseMacros.carbs * multiplier);
    const fat = Math.round(baseMacros.fat * multiplier);
    const kcal = Math.round(protein * 4 + carbs * 4 + fat * 9);
    return { protein, carbs, fat, kcal };
  };

  // Crea un piano vuoto per una settimana
  const createEmptyWeekPlan = (weekNum: number): WeekMacrosPlan => ({
    weekNumber: weekNum,
    days: Array(7).fill(null).map(() => ({ protein: 0, carbs: 0, fat: 0, kcal: 0 })),
    checked: Array(7).fill(false),
    fromCycling: false,
  });

  // Ottiene o crea il piano per una settimana
  const getOrCreateWeekPlan = (weekNum: number): WeekMacrosPlan => {
    const userData = state.userData[state.currentUserId];
    const existing = userData?.macrosPlans?.find(p => p.weekNumber === weekNum);
    if (existing) return existing;
    
    // Crea nuovo piano vuoto
    const newPlan = createEmptyWeekPlan(weekNum);
    updateCurrentUser((prev) => ({
      macrosPlans: [...(prev.macrosPlans || []), newPlan].sort((a, b) => a.weekNumber - b.weekNumber),
    }));
    return newPlan;
  };

  // Aggiorna i macro di un singolo giorno
  const updateWeekMacros = (weekNum: number, dayIndex: number, macros: PlannedDayMacros) => {
    updateCurrentUser((prev) => {
      const plans = prev.macrosPlans || [];
      const existingIndex = plans.findIndex(p => p.weekNumber === weekNum);
      
      let updatedPlan: WeekMacrosPlan;
      if (existingIndex >= 0) {
        updatedPlan = { ...plans[existingIndex] };
        updatedPlan.days = [...updatedPlan.days];
        updatedPlan.days[dayIndex] = macros;
        updatedPlan.fromCycling = false; // Modifica manuale rimuove il flag cycling
      } else {
        updatedPlan = createEmptyWeekPlan(weekNum);
        updatedPlan.days[dayIndex] = macros;
      }
      
      const newPlans = existingIndex >= 0
        ? plans.map((p, i) => i === existingIndex ? updatedPlan : p)
        : [...plans, updatedPlan].sort((a, b) => a.weekNumber - b.weekNumber);
      
      return { macrosPlans: newPlans };
    });
  };

  // Segna un giorno come completato
  const checkWeekDay = (weekNum: number, dayIndex: number) => {
    updateCurrentUser((prev) => {
      const plans = prev.macrosPlans || [];
      const existingIndex = plans.findIndex(p => p.weekNumber === weekNum);
      
      if (existingIndex < 0) return {};
      
      const updatedPlan = { ...plans[existingIndex] };
      updatedPlan.checked = [...updatedPlan.checked];
      updatedPlan.checked[dayIndex] = !updatedPlan.checked[dayIndex];
      
      const newPlans = plans.map((p, i) => i === existingIndex ? updatedPlan : p);
      return { macrosPlans: newPlans };
    });
  };

  // Ottiene il piano macro per una settimana
  const getMacrosPlanForWeek = (weekNum: number): WeekMacrosPlan | undefined => {
    const userData = state.userData[state.currentUserId];
    return userData?.macrosPlans?.find(p => p.weekNumber === weekNum);
  };

  // Copia i macro da una settimana all'altra
  const copyWeekPlan = (fromWeek: number, toWeek: number) => {
    const sourcePlan = getMacrosPlanForWeek(fromWeek);
    if (!sourcePlan) return;
    
    updateCurrentUser((prev) => {
      const plans = prev.macrosPlans || [];
      const existingIndex = plans.findIndex(p => p.weekNumber === toWeek);
      
      const newPlan: WeekMacrosPlan = {
        weekNumber: toWeek,
        days: [...sourcePlan.days],
        checked: Array(7).fill(false),
        fromCycling: false,
      };
      
      const newPlans = existingIndex >= 0
        ? plans.map((p, i) => i === existingIndex ? newPlan : p)
        : [...plans, newPlan].sort((a, b) => a.weekNumber - b.weekNumber);
      
      return { macrosPlans: newPlans };
    });
  };

  // Reset completo di una settimana
  const resetWeekPlan = (weekNum: number) => {
    updateCurrentUser((prev) => {
      const plans = prev.macrosPlans || [];
      const existingIndex = plans.findIndex(p => p.weekNumber === weekNum);
      
      if (existingIndex < 0) return {};
      
      const emptyPlan = createEmptyWeekPlan(weekNum);
      const newPlans = plans.map((p, i) => i === existingIndex ? emptyPlan : p);
      
      return { macrosPlans: newPlans };
    });
  };

  // === SUPPLEMENTS (GLOBALI) ===
  
  const updateGlobalSupplements = (supplements: Supplement[]) => {
    updateCurrentUser(() => ({ supplements }));
  };

  // === CARB CYCLING ===

  // Salva un template carb cycling
  const saveCarbCyclingTemplate = (template: CarbCyclingTemplate) => {
    updateCurrentUser((prev) => {
      const templates = prev.carbCyclingTemplates || [];
      const existingIndex = templates.findIndex(t => t.id === template.id);
      if (existingIndex >= 0) {
        const newTemplates = [...templates];
        newTemplates[existingIndex] = template;
        return { carbCyclingTemplates: newTemplates };
      } else {
        return { carbCyclingTemplates: [...templates, template] };
      }
    });
  };

  // Elimina un template carb cycling
  const deleteCarbCyclingTemplate = (templateId: string) => {
    updateCurrentUser((prev) => ({
      carbCyclingTemplates: (prev.carbCyclingTemplates || []).filter(t => t.id !== templateId),
      activeCarbCyclingId: prev.activeCarbCyclingId === templateId ? null : prev.activeCarbCyclingId,
    }));
  };

  // Imposta il carb cycling attivo
  const setActiveCarbCycling = (templateId: string | null) => {
    updateCurrentUser(() => ({ activeCarbCyclingId: templateId }));
  };

  // Applica un template carb cycling alle settimane specificate (con flag fromCycling)
  const applyCarbCyclingToWeeks = (
    templateId: string,
    weekNumbers: number[],
    trainingDays?: number[][],
    templateData?: CarbCyclingTemplate
  ) => {
    // Usa templateData se fornito, altrimenti cerca nello state
    const userData = state.userData[state.currentUserId];
    const template = templateData || userData?.carbCyclingTemplates?.find(t => t.id === templateId);
    if (!template) return;

    updateCurrentUser((prev) => {
      const plans = [...(prev.macrosPlans || [])];
      
      weekNumbers.forEach((weekNum, weekIdx) => {
        const existingIndex = plans.findIndex(p => p.weekNumber === weekNum);
        const existingPlan = existingIndex >= 0 ? plans[existingIndex] : null;
        const existingChecked = existingPlan?.checked || Array(7).fill(false);
        const existingDays = existingPlan?.days || [];
        
        const days: PlannedDayMacros[] = [];
        
        for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
          // Se il giorno è già checked, mantieni i macro esistenti
          if (existingChecked[dayIdx] && existingDays[dayIdx]) {
            days.push(existingDays[dayIdx]);
            continue;
          }
          
          let multiplier = 1.0;
          
          if (template.mode === 'per_day' && template.dayMultipliers) {
            multiplier = template.dayMultipliers[dayIdx] ?? 1.0;
          } else if (template.mode === 'training_based') {
            const isTrainingDay = trainingDays?.[weekIdx]?.includes(dayIdx) ?? false;
            multiplier = isTrainingDay 
              ? (template.trainingMultiplier ?? 1.0) 
              : (template.restMultiplier ?? 1.0);
          }
          
          days.push(calculateMacrosFromBase(template.baseMacros, multiplier));
        }
        
        const newPlan: WeekMacrosPlan = {
          weekNumber: weekNum,
          days,
          checked: existingChecked,
          fromCycling: true,
        };
        
        if (existingIndex >= 0) {
          plans[existingIndex] = newPlan;
        } else {
          plans.push(newPlan);
        }
      });
      
      plans.sort((a, b) => a.weekNumber - b.weekNumber);
      
      return { 
        macrosPlans: plans,
        activeCarbCyclingId: templateId,
        macroMode: 'cycling' as MacroMode,
      };
    });
  };

  // === SISTEMA ON/OFF ===
  
  const setMacroMode = (mode: MacroMode) => {
    updateCurrentUser(() => ({ macroMode: mode }));
  };

  const updateOnOffPlan = (plan: OnOffMacrosPlan) => {
    updateCurrentUser(() => ({ onOffPlan: plan }));
  };

  const setDayType = (weekNum: number, dayIndex: number, dayType: DayType) => {
    updateCurrentUser((prev) => {
      const plans = [...(prev.macrosPlans || [])];
      const onOffPlan = prev.onOffPlan;
      
      // Trova o crea il piano per questa settimana
      let existingIndex = plans.findIndex(p => p.weekNumber === weekNum);
      
      // Se il giorno è già checked, non permettere la modifica
      if (existingIndex >= 0 && plans[existingIndex].checked?.[dayIndex]) {
        return {}; // Non modificare nulla
      }
      
      if (existingIndex < 0) {
        // Crea nuovo piano
        plans.push({
          weekNumber: weekNum,
          days: Array(7).fill(null).map(() => ({ protein: 0, carbs: 0, fat: 0, kcal: 0 })),
          checked: Array(7).fill(false),
          fromOnOff: true,
          dayTypes: Array(7).fill(null),
        });
        existingIndex = plans.length - 1;
      }
      
      const plan = { ...plans[existingIndex] };
      const dayTypes = [...(plan.dayTypes || Array(7).fill(null))];
      const days = [...plan.days];
      
      // Imposta il tipo del giorno
      dayTypes[dayIndex] = dayType;
      
      // Se c'è un piano On/Off configurato, aggiorna i macro
      if (onOffPlan && dayType) {
        const macros = dayType === 'on' ? onOffPlan.onDayMacros : onOffPlan.offDayMacros;
        days[dayIndex] = { ...macros };
      } else if (dayType === null) {
        // Reset macro se il tipo è null
        days[dayIndex] = { protein: 0, carbs: 0, fat: 0, kcal: 0 };
      }
      
      plan.dayTypes = dayTypes;
      plan.days = days;
      plan.fromOnOff = true;
      plans[existingIndex] = plan;
      
      plans.sort((a, b) => a.weekNumber - b.weekNumber);
      
      return { macrosPlans: plans, macroMode: 'on_off' as MacroMode };
    });
  };

  // === WEIGHT TRACKING ===
  
  const addWeight = (weight: number, date?: string) => {
    const dateStr = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    updateCurrentUser((prev) => {
      const history = [...(prev.weightHistory || [])];
      
      // Verifica se esiste già una entry per questa data
      const existingIndex = history.findIndex(e => e.date === dateStr);
      
      if (existingIndex >= 0) {
        // Aggiorna il peso esistente
        history[existingIndex] = { date: dateStr, weight };
      } else {
        // Aggiungi nuova entry
        history.push({ date: dateStr, weight });
      }
      
      // Ordina per data (più recente prima)
      history.sort((a, b) => b.date.localeCompare(a.date));
      
      return { weightHistory: history };
    });
  };

  const getWeightHistory = (days?: number): WeightEntry[] => {
    const userData = state.userData[state.currentUserId];
    const history = userData?.weightHistory || [];
    
    if (!days) return history;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    
    return history.filter(e => e.date >= cutoffStr);
  };

  const getTodayWeight = (): number | null => {
    const today = new Date().toISOString().split('T')[0];
    const userData = state.userData[state.currentUserId];
    const entry = userData?.weightHistory?.find(e => e.date === today);
    return entry?.weight ?? null;
  };

  const resetAllData = () => {
    if (confirm('Cancellare tutti i dati dell\'utente corrente? Questa azione è irreversibile!')) {
      updateCurrentUser(() => createDefaultUserData());
    }
  };

  const hasDemoData = () => {
    const userData = state.userData[state.currentUserId];
    if (!userData) return false;
    return userData.programs[999] !== undefined || userData.programs[998] !== undefined;
  };

  const loadDemoData = () => {
    if (hasDemoData()) {
      alert('I dati demo sono già caricati!');
      return;
    }
    const demoPrograms = generateDemoPrograms();
    const demoSessions = generateDemoLoggedSessions();
    updateCurrentUser((prev) => ({
      programs: {
        ...prev.programs,
        [999]: demoPrograms[0],
        [998]: demoPrograms[1],
      },
      loggedSessions: [...prev.loggedSessions, ...demoSessions],
      currentProgramId: 999,
      currentWeek: 1,
    }));
    alert('Dati demo caricati con successo! 🎉');
  };

  const clearDemoData = () => {
    if (!hasDemoData()) {
      alert('Nessun dato demo da cancellare.');
      return;
    }
    if (confirm('Eliminare i programmi demo e tutte le sessioni associate?')) {
      updateCurrentUser((prev) => {
        const newPrograms = { ...prev.programs };
        delete newPrograms[999];
        delete newPrograms[998];
        const filteredSessions = prev.loggedSessions.filter(s => s.programId !== 999 && s.programId !== 998);
        const remainingIds = Object.keys(newPrograms);
        const newCurrentId = (prev.currentProgramId === 999 || prev.currentProgramId === 998)
          ? remainingIds.length > 0 ? Number(remainingIds[0]) : null
          : prev.currentProgramId;
        return {
          programs: newPrograms,
          loggedSessions: filteredSessions,
          currentProgramId: newCurrentId,
          currentWeek: 1,
        };
      });
      alert('Dati demo eliminati con successo!');
    }
  };

  // Versione silenziosa per uso interno (es. ritorno alla landing)
  const clearDemoDataSilent = () => {
    if (!hasDemoData()) return;
    updateCurrentUser((prev) => {
      const newPrograms = { ...prev.programs };
      delete newPrograms[999];
      delete newPrograms[998];
      const filteredSessions = prev.loggedSessions.filter(s => s.programId !== 999 && s.programId !== 998);
      return {
        programs: newPrograms,
        loggedSessions: filteredSessions,
        currentProgramId: null,
        currentWeek: 1,
      };
    });
  };

  // Applica una progressione percentuale a tutte le settimane del programma
  const applyProgressionToAllWeeks = (
    progression: PercentageProgression,
    dayIndex: number,
    exerciseIndex: number,
    exerciseName: string
  ) => {
    const program = getCurrentProgram();
    if (!program) return;
    
    const newWeeks = applyProgressionToWeeks(
      progression,
      program.weeks,
      dayIndex,
      exerciseIndex,
      exerciseName
    );
    
    updateProgram(program.id, {
      ...program,
      weeks: newWeeks,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 font-medium">Caricamento dati...</p>
        </div>
      </div>
    );
  }

  const currentUserData = state.userData[state.currentUserId] || createDefaultUserData();

  return (
    <AppContext.Provider
      value={{
        ...currentUserData,
        users: state.users,
        currentUserId: state.currentUserId,
        addUser,
        switchUser,
        deleteUser,
        setCurrentTab,
        setCurrentProgram,
        setCurrentWeek,
        setExercises,
        addExercise,
        updateExercise,
        deleteExercise,
        addProgram,
        updateProgram,
        deleteProgram,
        duplicateProgram,
        setWeeks,
        addWeek,
        duplicateWeek,
        deleteWeek,
        updateWeek,
        addLoggedSession,
        updateLoggedSession,
        deleteLoggedSession,
        addMuscleGroup,
        updateMuscleGroupColor,
        deleteMuscleGroup,
        getMuscleColor,
        addCustomTechnique,
        deleteCustomTechnique,
        resetAllData,
        loadDemoData,
        clearDemoData,
        clearDemoDataSilent,
        hasDemoData,
        initializeDailyMacros,
        updateDailyMacros,
        checkDay,
        getCurrentDayIndex,
        getLastCheckedDayIndex,
        updateSupplements,
        // Macros Multi-Settimana (sistema unificato)
        getOrCreateWeekPlan,
        updateWeekMacros,
        checkWeekDay,
        getMacrosPlanForWeek,
        copyWeekPlan,
        resetWeekPlan,
        // Carb Cycling
        saveCarbCyclingTemplate,
        deleteCarbCyclingTemplate,
        setActiveCarbCycling,
        applyCarbCyclingToWeeks,
        calculateMacrosFromBase,
        // Supplements
        updateGlobalSupplements,
        // Helper getters
        getCurrentProgram,
        getCurrentWeeks,
        applyProgressionToAllWeeks,
        // Sistema On/Off
        setMacroMode,
        updateOnOffPlan,
        setDayType,
        // Weight tracking
        addWeight,
        getWeightHistory,
        getTodayWeight,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
