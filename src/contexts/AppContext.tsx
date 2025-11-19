import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AppState, Exercise, Week, LoggedSession, CustomTechnique, Program, DailyMacrosWeek, DayMacros, User, UserData } from '@/types';
import { DEFAULT_EXERCISES, MUSCLE_COLORS } from '@/lib/constants';
import { DEFAULT_MUSCLE_GROUPS } from '@/types';
import { generateDemoPrograms, generateDemoLoggedSessions } from '@/lib/demoData';
import { loadAppState, saveAppState, subscribeToAppState, migrateFromLocalStorage } from '@/lib/supabaseService';

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
  hasDemoData: () => boolean;

  // Daily Macros
  initializeDailyMacros: () => void;
  updateDailyMacros: (dayIndex: number, macros: DayMacros) => void;
  checkDay: (dayIndex: number) => void;
  getCurrentDayIndex: () => number;
  getLastCheckedDayIndex: () => number | null;
  updateSupplements: (supplements: import('@/types').Supplement[]) => void;

  // Helper getters
  getCurrentProgram: () => Program | undefined;
  getCurrentWeeks: () => Record<number, Week>;
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
  dailyMacros: null,
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

  // Load from Supabase (with localStorage fallback) on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to load from Supabase first
        const supabaseData = await loadAppState();

        if (supabaseData) {
          console.log('Loaded data from Supabase');
          const migratedData = migrateData(supabaseData);
          setState(migratedData);

          // Check if we need to save back (e.g. after migration)
          // Simple check: if structure changed significantly or if we just migrated
          if (!supabaseData.users && migratedData.users) {
            console.log('Saving migrated data to Supabase...');
            await saveAppState(migratedData);
          }

          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error loading from Supabase:', error);
      }

      // Fallback to localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          const migratedData = migrateData(data);
          setState(migratedData);

          // Migrate to Supabase in background
          migrateFromLocalStorage(migratedData).then((success) => {
            if (success) {
              console.log('Migrated data to Supabase');
            }
          });
        } catch (error) {
          console.error('Error loading data from localStorage:', error);
        }
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  // Helper function to migrate data format
  const migrateData = (data: any): AppState => {
    // Check if it's already the new format
    if (data.users && Array.isArray(data.users) && data.userData) {
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
    };

    return {
      users: [defaultUser],
      currentUserId: defaultUser.id,
      userData: {
        [defaultUser.id]: migratedUserData,
      },
    };
  };

  // Real-time subscription
  useEffect(() => {
    if (!isLoading) {
      const unsubscribe = subscribeToAppState((newState) => {
        console.log('Received update from Supabase');
        isSavingRef.current = true;
        setState(newState);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        setTimeout(() => {
          isSavingRef.current = false;
        }, 100);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [isLoading]);

  // Save to localStorage and Supabase on state change (debounced)
  useEffect(() => {
    if (isLoading || isSavingRef.current) return;

    const timeoutId = setTimeout(async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      try {
        const success = await saveAppState(state);
        if (success) console.log('Saved to Supabase');
      } catch (error) {
        console.error('Error saving to Supabase:', error);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [state, isLoading]);

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
        hasDemoData,
        initializeDailyMacros,
        updateDailyMacros,
        checkDay,
        getCurrentDayIndex,
        getLastCheckedDayIndex,
        updateSupplements,
        getCurrentProgram,
        getCurrentWeeks,
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
