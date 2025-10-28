import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, Exercise, Week, LoggedSession, WeekMacros } from '@/types';
import { DEFAULT_EXERCISES } from '@/lib/constants';

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
  setMacros: (weekNum: number, macros: WeekMacros) => void;
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
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setState({
          currentTab: data.currentTab || 'library',
          currentWeek: data.currentWeek || 1,
          exercises: data.exercises || DEFAULT_EXERCISES,
          weeks: data.weeks || { 1: { days: [] } },
          loggedSessions: data.loggedSessions || [],
          macros: data.macros || { 1: { kcal: '', protein: '', carbs: '', fat: '', notes: '' } },
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

  const setMacros = (weekNum: number, macros: WeekMacros) => {
    setState((prev) => ({
      ...prev,
      macros: {
        ...prev.macros,
        [weekNum]: macros,
      },
    }));
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
        setMacros,
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
