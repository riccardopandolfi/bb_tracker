import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, Exercise, Week, LoggedSession, WeekMacros, CustomTechnique, Program } from '@/types';
import { DEFAULT_EXERCISES } from '@/lib/constants';
import { DEFAULT_MUSCLE_GROUPS } from '@/types';

interface AppContextType extends AppState {
  setCurrentTab: (tab: 'library' | 'program' | 'logbook') => void;
  setCurrentProgram: (programId: number) => void;
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
  addMuscleGroup: (muscleGroup: string) => void;
  addCustomTechnique: (technique: CustomTechnique) => void;
  deleteCustomTechnique: (techniqueName: string) => void;
  resetAllData: () => void;

  // Helper getters
  getCurrentProgram: () => Program | undefined;
  getCurrentWeeks: () => Record<number, Week>;
  getCurrentMacros: () => Record<number, WeekMacros>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'bodybuilding-data';

const defaultState: AppState = {
  currentTab: 'library',
  currentProgramId: 1,
  currentWeek: 1,
  exercises: DEFAULT_EXERCISES,
  programs: {
    1: {
      id: 1,
      name: 'Programma Default',
      description: 'Il tuo primo programma di allenamento',
      createdAt: new Date().toISOString(),
      weeks: {
        1: { days: [] },
      },
      macros: {
        1: { kcal: '', protein: '', carbs: '', fat: '', notes: '' },
      },
    },
  },
  loggedSessions: [],
  muscleGroups: [...DEFAULT_MUSCLE_GROUPS],
  customTechniques: [],
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);

        // MIGRATION: Convert old format (weeks/macros at root) to new format (programs)
        let migratedPrograms: Record<number, Program>;
        let migratedCurrentProgramId: number;

        if (data.programs) {
          // New format already exists
          migratedPrograms = data.programs;
          migratedCurrentProgramId = data.currentProgramId || 1;
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

          return migrated;
        });

        // Migrate exercises: add type field if missing
        const migratedExercises = (data.exercises || DEFAULT_EXERCISES).map((ex: any) => {
          if (!ex.type) {
            // If no type, assume resistance if it has muscles, cardio otherwise
            return {
              ...ex,
              type: ex.muscles ? 'resistance' : 'cardio',
            };
          }
          return ex;
        });

        setState({
          currentTab: data.currentTab || 'library',
          currentProgramId: migratedCurrentProgramId,
          currentWeek: data.currentWeek || 1,
          exercises: migratedExercises,
          programs: migratedPrograms,
          loggedSessions: migratedSessions,
          muscleGroups: data.muscleGroups || [...DEFAULT_MUSCLE_GROUPS],
          customTechniques: data.customTechniques || [],
        });
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
      }
    }
  }, []);

  // Save to localStorage on state change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [state]);

  // Helper getters
  const getCurrentProgram = () => state.programs[state.currentProgramId];

  const getCurrentWeeks = () => {
    const program = getCurrentProgram();
    return program?.weeks || {};
  };

  const getCurrentMacros = () => {
    const program = getCurrentProgram();
    return program?.macros || {};
  };

  const setCurrentTab = (tab: 'library' | 'program' | 'logbook') => {
    setState((prev) => ({ ...prev, currentTab: tab }));
  };

  const setCurrentProgram = (programId: number) => {
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
    const newId = Math.max(...Object.keys(state.programs).map(Number), 0) + 1;
    const newProgram: Program = {
      id: newId,
      name,
      description: description || '',
      createdAt: new Date().toISOString(),
      weeks: { 1: { days: [] } },
      macros: { 1: { kcal: '', protein: '', carbs: '', fat: '', notes: '' } },
    };

    setState((prev) => ({
      ...prev,
      programs: {
        ...prev.programs,
        [newId]: newProgram,
      },
      currentProgramId: newId,
      currentWeek: 1,
    }));
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
    if (Object.keys(state.programs).length === 1) {
      alert('Non puoi eliminare l\'ultimo programma!');
      return;
    }

    if (confirm(`Eliminare il programma "${state.programs[programId]?.name}"?`)) {
      setState((prev) => {
        const newPrograms = { ...prev.programs };
        delete newPrograms[programId];

        // If deleting current program, switch to first available
        const newCurrentId = prev.currentProgramId === programId
          ? Number(Object.keys(newPrograms)[0])
          : prev.currentProgramId;

        // Remove logged sessions for this program
        const filteredSessions = prev.loggedSessions.filter(s => s.programId !== programId);

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

    const newId = Math.max(...Object.keys(state.programs).map(Number)) + 1;
    const newProgram: Program = {
      ...JSON.parse(JSON.stringify(sourceProgram)),
      id: newId,
      name: `${sourceProgram.name} (Copia)`,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      programs: {
        ...prev.programs,
        [newId]: newProgram,
      },
      currentProgramId: newId,
      currentWeek: 1,
    }));
  };

  const setWeeks = (weeks: Record<number, Week>) => {
    const program = getCurrentProgram();
    if (!program) return;

    updateProgram(state.currentProgramId, {
      ...program,
      weeks,
    });
  };

  const addWeek = (weekNum: number) => {
    const program = getCurrentProgram();
    if (!program) return;

    updateProgram(state.currentProgramId, {
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

    updateProgram(state.currentProgramId, {
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

    updateProgram(state.currentProgramId, {
      ...program,
      weeks: {
        ...program.weeks,
        [weekNum]: week,
      },
    });
  };

  const addLoggedSession = (session: LoggedSession) => {
    setState((prev) => ({
      ...prev,
      loggedSessions: [...prev.loggedSessions, session],
    }));
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

  const addMuscleGroup = (muscleGroup: string) => {
    setState((prev) => ({
      ...prev,
      muscleGroups: [...prev.muscleGroups, muscleGroup],
    }));
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
        addCustomTechnique,
        deleteCustomTechnique,
        resetAllData,
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
