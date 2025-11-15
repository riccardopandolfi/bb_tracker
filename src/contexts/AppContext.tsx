import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AppState, Exercise, Week, LoggedSession, WeekMacros, CustomTechnique, Program } from '@/types';
import { DEFAULT_EXERCISES, MUSCLE_COLORS } from '@/lib/constants';
import { DEFAULT_MUSCLE_GROUPS } from '@/types';
import { generateDemoPrograms, generateDemoLoggedSessions } from '@/lib/demoData';
import { loadAppState, saveAppState, subscribeToAppState, migrateFromLocalStorage } from '@/lib/supabaseService';

interface AppContextType extends AppState {
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
  setMacros: (weekNum: number, macros: WeekMacros, programId?: number) => void;
  addMuscleGroup: (muscleGroup: string, color?: string) => void;
  getMuscleColor: (muscleName: string) => string;
  addCustomTechnique: (technique: CustomTechnique) => void;
  deleteCustomTechnique: (techniqueName: string) => void;
  resetAllData: () => void;
  loadDemoData: () => void;
  clearDemoData: () => void;
  hasDemoData: () => boolean;

  // Helper getters
  getCurrentProgram: () => Program | undefined;
  getCurrentWeeks: () => Record<number, Week>;
  getCurrentMacros: () => Record<number, WeekMacros>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'bodybuilding-data';

const defaultState: AppState = {
  currentTab: 'home',
  currentProgramId: null,
  currentWeek: 1,
  exercises: DEFAULT_EXERCISES,
  programs: {},
  loggedSessions: [],
  muscleGroups: [...DEFAULT_MUSCLE_GROUPS],
  muscleGroupColors: {},
  customTechniques: [],
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

          // If exercises were populated from defaults, save immediately to Supabase
          if ((!supabaseData.exercises || supabaseData.exercises.length === 0) && migratedData.exercises.length > 0) {
            console.log('Populating Supabase with default exercises...');
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
          // Old format: convert weeks/macros to Program 1
          console.log('Migrating old data format to new program structure...');

          const oldWeeks = data.weeks || { 1: { days: [] } };
          const oldMacros = data.macros || { 1: { kcal: '', protein: '', carbs: '', fat: '', notes: '' } };

          migratedPrograms = {
            1: {
              id: 1,
              name: 'Programma Default',
              description: 'Programma migrato dalla versione precedente',
              createdAt: new Date().toISOString(),
              weeks: oldWeeks,
              macros: oldMacros,
            },
          };

          migratedCurrentProgramId = 1;
        }

        // Migrate weeks within each program: add techniqueParams and targetRPE to exercises if missing
        Object.keys(migratedPrograms).forEach((programKey) => {
          const program = migratedPrograms[Number(programKey)];
          const migratedWeeks = program.weeks || { 1: { days: [] } };
          Object.keys(migratedWeeks).forEach((weekKey) => {
            const week = migratedWeeks[Number(weekKey)];
            if (week && week.days) {
              week.days.forEach((day: any) => {
                if (day && day.exercises) {
                  day.exercises.forEach((ex: any) => {
                    if (!ex.hasOwnProperty('techniqueParams')) {
                      ex.techniqueParams = {};
                    }
                    if (!ex.hasOwnProperty('targetRPE')) {
                      // Set default targetRPE based on coefficient
                      if (ex.coefficient <= 0.7) ex.targetRPE = 5.5;
                      else if (ex.coefficient <= 0.9) ex.targetRPE = 7.5;
                      else if (ex.coefficient <= 1.0) ex.targetRPE = 8.5;
                      else ex.targetRPE = 10.0;
                    }
                    // Migrate targetLoad (string) to targetLoads (array)
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

          // Update the program with migrated weeks
          program.weeks = migratedWeeks;
        });

        // Migrate old logged sessions: add programId and other missing fields
        const migratedSessions = (data.loggedSessions || []).map((session: any) => {
          const migrated = { ...session };

          // Add programId if missing (old sessions belong to Program 1)
          if (!migrated.hasOwnProperty('programId')) {
            migrated.programId = 1;
          }

          // Add targetRPE if missing
          if (!migrated.hasOwnProperty('targetRPE')) {
            // Set default targetRPE based on coefficient
            if (migrated.coefficient <= 0.7) migrated.targetRPE = 5.5;
            else if (migrated.coefficient <= 0.9) migrated.targetRPE = 7.5;
            else if (migrated.coefficient <= 1.0) migrated.targetRPE = 8.5;
            else migrated.targetRPE = 10.0;
          }

          // Migrate targetLoad (string) to targetLoads (array)
          if (migrated.hasOwnProperty('targetLoad') && typeof migrated.targetLoad === 'string') {
            const numSets = migrated.sets?.length || 1;
            migrated.targetLoads = Array(numSets).fill(migrated.targetLoad);
            delete migrated.targetLoad;
          } else if (!migrated.hasOwnProperty('targetLoads') || !Array.isArray(migrated.targetLoads)) {
            migrated.targetLoads = [];
          }

          // Remove totalTonnage field (no longer used)
          if (migrated.hasOwnProperty('totalTonnage')) {
            delete migrated.totalTonnage;
          }

          // Add dayIndex and dayName if missing - try to find from program structure
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

        // Migrate exercises: add type field if missing
        // Use DEFAULT_EXERCISES if no exercises exist or array is empty
        const migratedExercises = (data.exercises && data.exercises.length > 0 ? data.exercises : DEFAULT_EXERCISES).map((ex: any) => {
          if (!ex.type) {
            // If no type, assume resistance if it has muscles, cardio otherwise
            return {
              ...ex,
              type: ex.muscles ? 'resistance' : 'cardio',
            };
          }
          return ex;
        });

    return {
      currentTab: data.currentTab || 'library',
      currentProgramId: migratedCurrentProgramId,
      currentWeek: data.currentWeek || 1,
      exercises: migratedExercises,
      programs: migratedPrograms,
      loggedSessions: migratedSessions,
      muscleGroups: data.muscleGroups || [...DEFAULT_MUSCLE_GROUPS],
      muscleGroupColors: data.muscleGroupColors || {},
      customTechniques: data.customTechniques || [],
    };
  };

  // Real-time subscription
  useEffect(() => {
    if (!isLoading) {
      const unsubscribe = subscribeToAppState((newState) => {
        console.log('Received update from Supabase');
        isSavingRef.current = true;
        setState(newState);
        // Also update localStorage
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
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

      // Save to Supabase
      try {
        const success = await saveAppState(state);
        if (success) {
          console.log('Saved to Supabase');
        }
      } catch (error) {
        console.error('Error saving to Supabase:', error);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [state, isLoading]);

  // Helper getters
  const getCurrentProgram = () => {
    if (state.currentProgramId == null) return undefined;
    return state.programs[state.currentProgramId];
  };

  const getCurrentWeeks = () => {
    const program = getCurrentProgram();
    return program?.weeks || {};
  };

  const getCurrentMacros = () => {
    const program = getCurrentProgram();
    return program?.macros || {};
  };

  const setCurrentTab = (tab: 'home' | 'library' | 'programs' | 'program' | 'logbook' | 'macros') => {
    setState((prev) => ({ ...prev, currentTab: tab }));
  };

  const setCurrentProgram = (programId: number | null) => {
    setState((prev) => ({ ...prev, currentProgramId: programId, currentWeek: 1 }));
  };

  const setCurrentWeek = (week: number) => {
    setState((prev) => ({ ...prev, currentWeek: week }));
  };

  const setExercises = (exercises: Exercise[]) => {
    setState((prev) => ({ ...prev, exercises }));
  };

  const addExercise = (exercise: Exercise) => {
    setState((prev) => ({
      ...prev,
      exercises: [...prev.exercises, exercise],
    }));
  };

  const updateExercise = (index: number, exercise: Exercise) => {
    setState((prev) => {
      const newExercises = [...prev.exercises];
      newExercises[index] = exercise;
      return { ...prev, exercises: newExercises };
    });
  };

  const deleteExercise = (index: number) => {
    setState((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index),
    }));
  };

  // Program management
  const addProgram = (name: string, description?: string) => {
    setState((prev) => {
      const existingIds = Object.keys(prev.programs).map(Number);
      const newId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
      const newProgram: Program = {
        id: newId,
        name,
        description: description || '',
        createdAt: new Date().toISOString(),
        weeks: { 1: { days: [] } },
        macros: { 1: { kcal: '', protein: '', carbs: '', fat: '', notes: '' } },
      };

      return {
        ...prev,
        programs: {
          ...prev.programs,
          [newId]: newProgram,
        },
        currentProgramId: newId,
        currentWeek: 1,
      };
    });
  };

  const updateProgram = (programId: number, program: Program) => {
    setState((prev) => ({
      ...prev,
      programs: {
        ...prev.programs,
        [programId]: program,
      },
    }));
  };

  const deleteProgram = (programId: number) => {
    if (!state.programs[programId]) return;

    if (confirm(`Eliminare il programma "${state.programs[programId]?.name}"?`)) {
      setState((prev) => {
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
          ...prev,
          programs: newPrograms,
          currentProgramId: newCurrentId,
          currentWeek: 1,
          loggedSessions: filteredSessions,
        };
      });
    }
  };

  const duplicateProgram = (programId: number) => {
    const sourceProgram = state.programs[programId];
    if (!sourceProgram) return;

    setState((prev) => {
      const existingIds = Object.keys(prev.programs).map(Number);
      const newId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
      const newProgram: Program = {
        ...JSON.parse(JSON.stringify(sourceProgram)),
        id: newId,
        name: `${sourceProgram.name} (Copia)`,
        createdAt: new Date().toISOString(),
      };

      return {
        ...prev,
        programs: {
          ...prev.programs,
          [newId]: newProgram,
        },
        currentProgramId: newId,
        currentWeek: 1,
      };
    });
  };

  const setWeeks = (weeks: Record<number, Week>) => {
    const program = getCurrentProgram();
    if (!program) return;

    updateProgram(program.id, {
      ...program,
      weeks,
    });
  };

  const addWeek = (weekNum: number) => {
    const program = getCurrentProgram();
    if (!program) return;

    updateProgram(program.id, {
      ...program,
      weeks: {
        ...program.weeks,
        [weekNum]: { days: [] },
      },
      macros: {
        ...program.macros,
        [weekNum]: { kcal: '', protein: '', carbs: '', fat: '', notes: '' },
      },
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
      weeks: {
        ...program.weeks,
        [newWeekNum]: JSON.parse(JSON.stringify(sourceWeek)),
      },
      macros: {
        ...program.macros,
        [newWeekNum]: JSON.parse(JSON.stringify(program.macros[weekNum] || {})),
      },
    });

    setState((prev) => ({ ...prev, currentWeek: newWeekNum }));
  };

  const updateWeek = (weekNum: number, week: Week) => {
    const program = getCurrentProgram();
    if (!program) return;

    updateProgram(program.id, {
      ...program,
      weeks: {
        ...program.weeks,
        [weekNum]: week,
      },
    });
  };

  const addLoggedSession = (session: LoggedSession) => {
    setState((prev) => {
      // Rimuovi sessioni duplicate per lo stesso esercizio, stesso blocco, stessa data e settimana
      // Mantieni solo quella più recente (ID più alto = Date.now() più recente)
      const filtered = prev.loggedSessions.filter((s) => {
        // Se è la stessa sessione (stesso ID), non rimuoverla
        if (s.id === session.id) return false;
        
        // Rimuovi se stesso esercizio, stesso blocco, stessa data e settimana
        return !(
          s.exercise === session.exercise &&
          s.blockIndex === session.blockIndex &&
          s.date === session.date &&
          s.weekNum === session.weekNum
        );
      });
      
      // Aggiungi la nuova sessione (che avrà un ID più alto = più recente)
      return {
        ...prev,
        loggedSessions: [...filtered, session],
      };
    });
  };

  const updateLoggedSession = (session: LoggedSession) => {
    setState((prev) => ({
      ...prev,
      loggedSessions: prev.loggedSessions.map((s) => (s.id === session.id ? session : s)),
    }));
  };

  const deleteLoggedSession = (sessionId: number) => {
    if (confirm('Eliminare questa sessione loggata?')) {
      setState((prev) => ({
        ...prev,
        loggedSessions: prev.loggedSessions.filter((s) => s.id !== sessionId),
      }));
    }
  };

  const setMacros = (weekNum: number, macros: WeekMacros, programId?: number) => {
    const targetProgramId = programId ?? state.currentProgramId;
    if (targetProgramId == null) return;
    const program = state.programs[targetProgramId];
    if (!program) return;

    updateProgram(targetProgramId, {
      ...program,
      macros: {
        ...program.macros,
        [weekNum]: macros,
      },
    });
  };

  const addMuscleGroup = (muscleGroup: string, color?: string) => {
    setState((prev) => ({
      ...prev,
      muscleGroups: [...prev.muscleGroups, muscleGroup],
      muscleGroupColors: color
        ? { ...prev.muscleGroupColors, [muscleGroup]: color }
        : prev.muscleGroupColors,
    }));
  };

  const getMuscleColor = (muscleName: string): string => {
    // Prima controlla se c'è un colore personalizzato
    if (state.muscleGroupColors[muscleName]) {
      return state.muscleGroupColors[muscleName];
    }
    // Altrimenti usa i colori di default
    return MUSCLE_COLORS[muscleName] || '#6b7280'; // gray-500 come fallback
  };

  const addCustomTechnique = (technique: CustomTechnique) => {
    setState((prev) => ({
      ...prev,
      customTechniques: [...prev.customTechniques, technique],
    }));
  };

  const deleteCustomTechnique = (techniqueName: string) => {
    if (confirm(`Eliminare la tecnica "${techniqueName}"?`)) {
      setState((prev) => ({
        ...prev,
        customTechniques: prev.customTechniques.filter((t) => t.name !== techniqueName),
      }));
    }
  };

  const resetAllData = () => {
    if (confirm('Cancellare tutti i dati? Questa azione è irreversibile!')) {
      localStorage.removeItem(STORAGE_KEY);
      setState(defaultState);
    }
  };

  const hasDemoData = () => {
    return state.programs[999] !== undefined || state.programs[998] !== undefined;
  };

  const loadDemoData = () => {
    if (hasDemoData()) {
      alert('I dati demo sono già caricati!');
      return;
    }

    const demoPrograms = generateDemoPrograms();
    const demoSessions = generateDemoLoggedSessions();

    setState((prev) => ({
      ...prev,
      programs: {
        ...prev.programs,
        [999]: demoPrograms[0], // Program 1: PPL
        [998]: demoPrograms[1], // Program 2: Upper/Lower
      },
      loggedSessions: [...prev.loggedSessions, ...demoSessions],
      currentProgramId: 999,
      currentWeek: 1,
    }));

    alert('Dati demo caricati con successo! 🎉\n\n2 Programmi:\n- PPL (8 settimane)\n- Upper/Lower (8 settimane)\n\nSessioni logged: ' + demoSessions.length);
  };

  const clearDemoData = () => {
    if (!hasDemoData()) {
      alert('Nessun dato demo da cancellare.');
      return;
    }

    if (confirm('Eliminare i programmi demo e tutte le sessioni associate?')) {
      setState((prev) => {
        const newPrograms = { ...prev.programs };
        delete newPrograms[999];
        delete newPrograms[998];

        // Rimuovi tutte le sessioni dei programmi demo
        const filteredSessions = prev.loggedSessions.filter(s => s.programId !== 999 && s.programId !== 998);

        // Se il programma corrente era uno dei demo, passa al primo disponibile
        const remainingIds = Object.keys(newPrograms);
        const newCurrentId = (prev.currentProgramId === 999 || prev.currentProgramId === 998)
          ? remainingIds.length > 0
            ? Number(remainingIds[0])
            : null
          : prev.currentProgramId;

        return {
          ...prev,
          programs: newPrograms,
          loggedSessions: filteredSessions,
          currentProgramId: newCurrentId,
          currentWeek: 1,
        };
      });

      alert('Dati demo eliminati con successo!');
    }
  };

  // Show loading indicator while data is being loaded
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

  return (
    <AppContext.Provider
      value={{
        ...state,
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
        setMacros,
        addMuscleGroup,
        getMuscleColor,
        addCustomTechnique,
        deleteCustomTechnique,
        resetAllData,
        loadDemoData,
        clearDemoData,
        hasDemoData,
        getCurrentProgram,
        getCurrentWeeks,
        getCurrentMacros,
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
