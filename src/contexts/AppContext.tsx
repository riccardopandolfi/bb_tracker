import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, Exercise, Week, LoggedSession, WeekMacros, CustomTechnique } from '@/types';
import { DEFAULT_EXERCISES } from '@/lib/constants';
import { DEFAULT_MUSCLE_GROUPS } from '@/types';

interface AppContextType extends AppState {
  setCurrentTab: (tab: 'library' | 'program' | 'logbook') => void;
  setCurrentWeek: (week: number) => void;
  setExercises: (exercises: Exercise[]) => void;
  addExercise: (exercise: Exercise) => void;
  updateExercise: (index: number, exercise: Exercise) => void;
  deleteExercise: (index: number) => void;
  setWeeks: (weeks: Record<number, Week>) => void;
  addWeek: (weekNum: number) => void;
  duplicateWeek: (weekNum: number) => void;
  updateWeek: (weekNum: number, week: Week) => void;
  addLoggedSession: (session: LoggedSession) => void;
  updateLoggedSession: (session: LoggedSession) => void;
  deleteLoggedSession: (sessionId: number) => void;
  setMacros: (weekNum: number, macros: WeekMacros) => void;
  addMuscleGroup: (muscleGroup: string) => void;
  addCustomTechnique: (technique: CustomTechnique) => void;
  deleteCustomTechnique: (techniqueName: string) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'bodybuilding-data';

const defaultState: AppState = {
  currentTab: 'library',
  currentWeek: 1,
  exercises: DEFAULT_EXERCISES,
  weeks: {
    1: { days: [] },
  },
  loggedSessions: [],
  macros: {
    1: { kcal: '', protein: '', carbs: '', fat: '', notes: '' },
  },
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

        // Migrate old data: add techniqueParams and targetRPE to exercises if missing
        const migratedWeeks = data.weeks || { 1: { days: [] } };
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

        // Migrate old logged sessions: add targetRPE if missing, convert targetLoad to targetLoads array
        const migratedSessions = (data.loggedSessions || []).map((session: any) => {
          const migrated = { ...session };

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

        setState({
          currentTab: data.currentTab || 'library',
          currentWeek: data.currentWeek || 1,
          exercises: data.exercises || DEFAULT_EXERCISES,
          weeks: migratedWeeks,
          loggedSessions: migratedSessions,
          macros: data.macros || { 1: { kcal: '', protein: '', carbs: '', fat: '', notes: '' } },
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

  const setCurrentTab = (tab: 'library' | 'program' | 'logbook') => {
    setState((prev) => ({ ...prev, currentTab: tab }));
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

  const setWeeks = (weeks: Record<number, Week>) => {
    setState((prev) => ({ ...prev, weeks }));
  };

  const addWeek = (weekNum: number) => {
    setState((prev) => ({
      ...prev,
      weeks: {
        ...prev.weeks,
        [weekNum]: { days: [] },
      },
      macros: {
        ...prev.macros,
        [weekNum]: { kcal: '', protein: '', carbs: '', fat: '', notes: '' },
      },
    }));
  };

  const duplicateWeek = (weekNum: number) => {
    const sourceWeek = state.weeks[weekNum];
    if (!sourceWeek) return;

    const newWeekNum = Math.max(...Object.keys(state.weeks).map(Number)) + 1;
    setState((prev) => ({
      ...prev,
      weeks: {
        ...prev.weeks,
        [newWeekNum]: JSON.parse(JSON.stringify(sourceWeek)),
      },
      macros: {
        ...prev.macros,
        [newWeekNum]: JSON.parse(JSON.stringify(prev.macros[weekNum] || {})),
      },
      currentWeek: newWeekNum,
    }));
  };

  const updateWeek = (weekNum: number, week: Week) => {
    setState((prev) => ({
      ...prev,
      weeks: {
        ...prev.weeks,
        [weekNum]: week,
      },
    }));
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

  const setMacros = (weekNum: number, macros: WeekMacros) => {
    setState((prev) => ({
      ...prev,
      macros: {
        ...prev.macros,
        [weekNum]: macros,
      },
    }));
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
        setCurrentWeek,
        setExercises,
        addExercise,
        updateExercise,
        deleteExercise,
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
