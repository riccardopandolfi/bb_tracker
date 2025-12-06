import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { ExerciseBlock, LoggedSession, ProgramExercise, DEFAULT_TECHNIQUES, Day } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { getContrastTextColor, adjustColor } from '@/lib/colorUtils';
import { getExerciseBlocks, createDefaultBlock } from '@/lib/exerciseUtils';
import { ConfigureExerciseModal } from './ConfigureExerciseModal';
import { LogSessionModal } from './LogSessionModal';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '../ui/context-menu';
import { ClipboardList, Plus, Trash2, ChevronUp, ChevronDown, X, Copy, Clipboard, CopyCheck } from 'lucide-react';

// Genera la stringa dello schema per un blocco (come nella vista card)
function formatBlockSchema(block: ExerciseBlock): string {
  const sets = block.sets || 0;
  const technique = block.technique || 'Normale';
  
  if (technique === 'Ramping') {
    const startLoad = block.startLoad || '?';
    const increment = block.increment ? `+${block.increment}` : '';
    return `Ramping ${block.repsBase || '?'}@${startLoad}${increment}`;
  }
  
  if (technique === 'Progressione a %' && block.percentageProgression) {
    const prog = block.percentageProgression;
    const week1 = prog.weeks?.[0];
    if (week1 && week1.blocks.length > 0) {
      const firstBlock = week1.blocks[0];
      return `${firstBlock.sets}x${firstBlock.reps} @${firstBlock.percentage}%`;
    }
  }
  
  if (technique === 'Normale') {
    if (block.targetReps && block.targetReps.length > 0) {
      return `${sets} x ${block.targetReps.join('-')}`;
    }
    return `${sets} x ${block.repsBase || '?'}`;
  }
  
  // Tecniche speciali (Rest-Pause, Myo-Reps, etc.)
  if (block.techniqueSchema) {
    return `${sets} x ${block.techniqueSchema}`;
  }
  
  return `${sets} x ${block.repsBase || '?'}`;
}

// Formatta i carichi per un blocco
function formatBlockLoads(block: ExerciseBlock): string {
  const technique = block.technique || 'Normale';
  
  if (technique === 'Ramping') {
    return block.startLoad ? `da ${block.startLoad} kg` : '';
  }
  
  if (technique === 'Progressione a %' && block.percentageProgression) {
    return `1RM: ${block.percentageProgression.oneRepMax}kg`;
  }
  
  if (technique !== 'Normale' && block.targetLoadsByCluster && block.targetLoadsByCluster.length > 0) {
    return block.targetLoadsByCluster.map(sl => sl.join('/')).join('-') + ' kg';
  }
  
  if (block.targetLoads && block.targetLoads.length > 0) {
    const uniqueLoads = [...new Set(block.targetLoads)];
    if (uniqueLoads.length === 1) {
      return `${uniqueLoads[0]} kg`;
    }
    return block.targetLoads.join('-') + ' kg';
  }
  
  return '';
}

// Formatta info intensità (RPE, Coeff)
function formatIntensityInfo(block: ExerciseBlock): string {
  const parts: string[] = [];
  
  const technique = block.technique || 'Normale';
  if (technique !== 'Normale') {
    parts.push(technique);
  }
  
  if (block.targetRPE) {
    parts.push(`RPE ${block.targetRPE}`);
  }
  
  if (block.coefficient && block.coefficient !== 1) {
    parts.push(`Coeff ${block.coefficient}`);
  }
  
  return parts.join(' • ');
}

// Formatta il resoconto di una sessione loggata
function formatLoggedSession(session: LoggedSession | undefined): { reps: string; loads: string; rpe: string; notes: string } {
  if (!session) return { reps: '', loads: '', rpe: '', notes: '' };
  
  const reps = session.sets.map(s => s.reps).join('-');
  const loads = session.sets.map(s => s.load).filter(l => l && l !== '0').join('-');
  const rpe = session.avgRPE ? `RPE ${session.avgRPE.toFixed(1)}` : '';
  const notes = session.notes || '';
  
  return { reps, loads: loads ? `${loads} kg` : '', rpe, notes };
}

// Dati per settimana di un blocco
interface WeekBlockData {
  exists: boolean;
  exerciseIndex: number;
  exercise?: ProgramExercise;
  block?: ExerciseBlock;
  rest: number;
  schema: string;
  loads: string;
  intensityInfo: string;
  exerciseNotes: string;
  blockNotes: string;
}

// Dati di log per settimana
interface WeekLogData {
  reps: string;
  loads: string;
  rpe: string;
  notes: string;
  session?: LoggedSession;
}

// Riga della tabella (un blocco di un'istanza esercizio)
interface BlockRow {
  blockIndex: number;
  weekData: Record<number, WeekBlockData>;
  logData: Record<number, WeekLogData>;
}

// Istanza di esercizio (posizione nell'array, non raggruppato per nome)
interface ExerciseInstance {
  exerciseIndex: number; // Posizione nell'array del giorno
  exerciseName: string;
  muscleGroup: string;
  color: string;
  blocks: BlockRow[];
}

export function ProgramTableView() {
  const { 
    getCurrentProgram, 
    getCurrentWeeks, 
    loggedSessions,
    getMuscleColor,
    exercises: exerciseLibrary,
    customTechniques,
    muscleGroups,
    updateWeek,
    updateProgram,
    setCurrentWeek,
    addWeek,
  } = useApp();
  
  const program = getCurrentProgram();
  const weeks = getCurrentWeeks();
  const weekNumbers = Object.keys(weeks).map(Number).sort((a, b) => a - b);
  const allTechniques = [...DEFAULT_TECHNIQUES, ...customTechniques.map(t => t.name)];
  
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  
  // Dialog states
  const [showAddDayDialog, setShowAddDayDialog] = useState(false);
  const [newDayName, setNewDayName] = useState('');
  const [showAddExerciseDialog, setShowAddExerciseDialog] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscleGroup, setNewExerciseMuscleGroup] = useState('auto');
  const [selectedWeeksForNewExercise, setSelectedWeeksForNewExercise] = useState<number[]>([]);
  
  // Modal states
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedWeekNum, setSelectedWeekNum] = useState<number | null>(null);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ProgramExercise | null>(null);
  
  // Blocchi pendenti: exerciseIndex -> numero di righe extra da mostrare
  const [pendingBlocks, setPendingBlocks] = useState<Record<number, number>>({});
  
  // Esercizio pendente: riga vuota per aggiungere un nuovo esercizio
  const [pendingExercise, setPendingExercise] = useState<{
    muscleGroup: string;
    exerciseName: string;
    createdInWeeks: number[]; // Settimane dove è stato già creato tramite questa riga
  } | null>(null);
  
  // Editing inline del REST
  const [editingRest, setEditingRest] = useState<{
    weekNum: number;
    exerciseIndex: number;
    blockIndex: number;
    value: string;
  } | null>(null);
  
  // Dialog cancellazione granulare
  const [deleteBlockDialog, setDeleteBlockDialog] = useState<{
    weekNum: number;
    exerciseIndex: number;
    blockIndex: number;
    exerciseName: string;
  } | null>(null);
  
  // Clipboard interna per copia/incolla blocchi
  const [clipboard, setClipboard] = useState<{
    block: ExerciseBlock;
    exerciseName: string;
  } | null>(null);
  
  // Funzione per ottenere il gruppo muscolare dalla libreria
  const getMuscleGroupFromLibrary = (exerciseName: string): string => {
    const libraryExercise = exerciseLibrary.find(ex => ex.name === exerciseName);
    if (libraryExercise?.muscles && libraryExercise.muscles.length > 0) {
      const primaryMuscle = libraryExercise.muscles.reduce((prev, curr) => 
        curr.percent > prev.percent ? curr : prev
      );
      return primaryMuscle.muscle;
    }
    return 'Non specificato';
  };
  
  // Ottieni i giorni disponibili
  const availableDays = useMemo(() => {
    const dayNames = new Map<number, string>();
    weekNumbers.forEach(weekNum => {
      const week = weeks[weekNum];
      if (week?.days) {
        week.days.forEach((day, index) => {
          if (!dayNames.has(index) || !dayNames.get(index)) {
            dayNames.set(index, day.name || `Giorno ${index + 1}`);
          }
        });
      }
    });
    return Array.from(dayNames.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([index, name]) => ({ index, name }));
  }, [weeks, weekNumbers]);
  
  // Costruisci la lista di esercizi raccogliendo da TUTTE le settimane
  const exerciseInstances = useMemo((): ExerciseInstance[] => {
    if (!program || weekNumbers.length === 0) return [];
    
    // Trova il numero massimo di esercizi tra tutte le settimane
    let maxExercises = 0;
    weekNumbers.forEach(weekNum => {
      const week = weeks[weekNum];
      const day = week?.days?.[selectedDayIndex];
      if (day?.exercises) {
        maxExercises = Math.max(maxExercises, day.exercises.length);
      }
    });
    
    if (maxExercises === 0) return [];
    
    const instances: ExerciseInstance[] = [];
    
    // Per ogni slot di esercizio (0, 1, 2, ...)
    for (let exerciseIndex = 0; exerciseIndex < maxExercises; exerciseIndex++) {
      // Trova il primo esercizio non-null in questo slot per prendere nome e muscolo
      let exerciseName = '';
      let muscleGroup = 'Non specificato';
      
      for (const weekNum of weekNumbers) {
        const week = weeks[weekNum];
        const day = week?.days?.[selectedDayIndex];
        const exercise = day?.exercises?.[exerciseIndex];
        if (exercise) {
          exerciseName = exercise.exerciseName;
          muscleGroup = exercise.muscleGroup && exercise.muscleGroup !== 'Non specificato'
            ? exercise.muscleGroup
            : getMuscleGroupFromLibrary(exercise.exerciseName);
          break;
        }
      }
      
      if (!exerciseName) continue; // Nessun esercizio in questo slot
      
      // Trova il numero massimo di blocchi per questo slot tra tutte le settimane
      let maxBlocks = 1;
      weekNumbers.forEach(weekNum => {
        const week = weeks[weekNum];
        const day = week?.days?.[selectedDayIndex];
        const exercise = day?.exercises?.[exerciseIndex];
        if (exercise) {
          const blocks = getExerciseBlocks(exercise);
          maxBlocks = Math.max(maxBlocks, blocks.length);
        }
      });
      
      // Aggiungi blocchi pendenti (righe extra non ancora create)
      const pending = pendingBlocks[exerciseIndex] || 0;
      maxBlocks += pending;
      
      // Crea le righe per ogni blocco
      const blockRows: BlockRow[] = [];
      for (let blockIndex = 0; blockIndex < maxBlocks; blockIndex++) {
        const blockRow: BlockRow = {
          blockIndex,
          weekData: {},
          logData: {},
        };
        
        // Popola i dati per ogni settimana
        weekNumbers.forEach(weekNum => {
          const week = weeks[weekNum];
          const day = week?.days?.[selectedDayIndex];
          const exercise = day?.exercises?.[exerciseIndex];
          
          if (exercise) {
            const blocks = getExerciseBlocks(exercise);
            const block = blocks[blockIndex];
            
            if (block) {
              blockRow.weekData[weekNum] = {
                exists: true,
                exerciseIndex,
                exercise,
                block,
                rest: block.rest || 0,
                schema: formatBlockSchema(block),
                loads: formatBlockLoads(block),
                intensityInfo: formatIntensityInfo(block),
                exerciseNotes: exercise.notes || '',
                blockNotes: block.notes || '',
              };
              
              // Log - usa exerciseIndex se disponibile per distinguere esercizi con stesso nome
              const session = loggedSessions.find(
                s => s.programId === program.id &&
                     s.weekNum === weekNum &&
                     s.exercise === exercise.exerciseName &&
                     s.blockIndex === blockIndex &&
                     s.dayIndex === selectedDayIndex &&
                     (s.exerciseIndex === undefined || s.exerciseIndex === exerciseIndex)
              );
              blockRow.logData[weekNum] = formatLoggedSession(session);
              if (session) blockRow.logData[weekNum].session = session;
            } else {
              blockRow.weekData[weekNum] = {
                exists: false,
                exerciseIndex,
                rest: 0,
                schema: '-',
                loads: '',
                intensityInfo: '',
                exerciseNotes: '',
                blockNotes: '',
              };
              blockRow.logData[weekNum] = { reps: '', loads: '', rpe: '', notes: '' };
            }
          } else {
            // Nessun esercizio in questo slot per questa settimana
            blockRow.weekData[weekNum] = {
              exists: false,
              exerciseIndex: -1,
              rest: 0,
              schema: '-',
              loads: '',
              intensityInfo: '',
              exerciseNotes: '',
              blockNotes: '',
            };
            blockRow.logData[weekNum] = { reps: '', loads: '', rpe: '', notes: '' };
          }
        });
        
        blockRows.push(blockRow);
      }
      
      instances.push({
        exerciseIndex,
        exerciseName,
        muscleGroup,
        color: getMuscleColor(muscleGroup),
        blocks: blockRows,
      });
    }
    
    return instances;
  }, [program, weeks, weekNumbers, selectedDayIndex, loggedSessions, getMuscleColor, exerciseLibrary, pendingBlocks]);
  
  // Handlers
  const handleAddWeek = () => {
    const newWeekNum = Math.max(...weekNumbers, 0) + 1;
    addWeek(newWeekNum);
  };
  
  const handleAddDay = () => {
    if (!newDayName.trim()) return;
    const newDay: Day = { name: newDayName.trim(), exercises: [] };
    weekNumbers.forEach(weekNum => {
      const week = weeks[weekNum];
      if (week) {
        updateWeek(weekNum, { ...week, days: [...week.days, newDay] });
      }
    });
    const firstWeek = weeks[weekNumbers[0]];
    if (firstWeek) setSelectedDayIndex(firstWeek.days.length);
    setNewDayName('');
    setShowAddDayDialog(false);
  };
  
  const handleAddExercise = () => {
    if (!newExerciseName || selectedWeeksForNewExercise.length === 0) {
      alert('Seleziona un esercizio e almeno una settimana');
      return;
    }
    
    const libraryEx = exerciseLibrary.find(ex => ex.name === newExerciseName);
    if (!libraryEx || !program) return;
    
    const muscleGroup = newExerciseMuscleGroup && newExerciseMuscleGroup !== 'auto'
      ? newExerciseMuscleGroup
      : getMuscleGroupFromLibrary(newExerciseName);
    
    // Costruisci TUTTE le settimane modificate in un'unica operazione
    const newWeeks = { ...program.weeks };
    
    selectedWeeksForNewExercise.forEach(weekNum => {
      const week = newWeeks[weekNum];
      if (!week) return;
      
      // Crea copia profonda dei days
      const newDays = week.days.map(d => ({ 
        ...d, 
        exercises: d.exercises.map(ex => ({ ...ex, blocks: [...ex.blocks] }))
      }));
      
      // Estendi se necessario
      while (newDays.length <= selectedDayIndex) {
        newDays.push({ name: `Giorno ${newDays.length + 1}`, exercises: [] });
      }
      
      // Crea nuovo esercizio
      const newExercise: ProgramExercise = {
        exerciseName: libraryEx.name,
        exerciseType: libraryEx.type,
        muscleGroup,
        blocks: [createDefaultBlock(libraryEx.type)],
        notes: '',
      };
      
      // Aggiungi al giorno
      newDays[selectedDayIndex] = {
        ...newDays[selectedDayIndex],
        name: newDays[selectedDayIndex].name || `Giorno ${selectedDayIndex + 1}`,
        exercises: [...newDays[selectedDayIndex].exercises, newExercise],
      };
      
      newWeeks[weekNum] = { ...week, days: newDays };
    });
    
    // Applica TUTTE le modifiche in un'unica chiamata
    updateProgram(program.id, { ...program, weeks: newWeeks });
    
    setNewExerciseName('');
    setNewExerciseMuscleGroup('auto');
    setSelectedWeeksForNewExercise([]);
    setShowAddExerciseDialog(false);
  };
  
  // Elimina esercizio da tutte le settimane (per exerciseIndex)
  const handleDeleteExercise = (exerciseIndex: number, exerciseName: string) => {
    if (!confirm(`Eliminare "${exerciseName}" da tutte le settimane?`)) return;
    if (!program) return;
    
    const newWeeks = { ...program.weeks };
    
    weekNumbers.forEach(weekNum => {
      const week = newWeeks[weekNum];
      const day = week?.days?.[selectedDayIndex];
      if (!week || !day) return;
      
      // Verifica che l'esercizio in quella posizione sia quello giusto
      const exercise = day.exercises[exerciseIndex];
      if (!exercise || exercise.exerciseName !== exerciseName) return;
      
      const filteredExercises = day.exercises.filter((_, i) => i !== exerciseIndex);
      
      const updatedDay = { ...day, exercises: filteredExercises };
      newWeeks[weekNum] = {
        ...week,
        days: week.days.map((d, i) => i === selectedDayIndex ? updatedDay : d),
      };
    });
    
    updateProgram(program.id, { ...program, weeks: newWeeks });
  };
  
  // Sposta esercizio su/giù
  const handleMoveExercise = (exerciseIndex: number, direction: 'up' | 'down') => {
    if (!program) return;
    const newIndex = direction === 'up' ? exerciseIndex - 1 : exerciseIndex + 1;
    
    const newWeeks = { ...program.weeks };
    
    weekNumbers.forEach(weekNum => {
      const week = newWeeks[weekNum];
      const day = week?.days?.[selectedDayIndex];
      if (!week || !day) return;
      
      if (newIndex < 0 || newIndex >= day.exercises.length) return;
      
      const exercises = [...day.exercises];
      const [moved] = exercises.splice(exerciseIndex, 1);
      exercises.splice(newIndex, 0, moved);
      
      const updatedDay = { ...day, exercises };
      newWeeks[weekNum] = {
        ...week,
        days: week.days.map((d, i) => i === selectedDayIndex ? updatedDay : d),
      };
    });
    
    updateProgram(program.id, { ...program, weeks: newWeeks });
  };
  
  // === EDITING INLINE REST ===
  const handleStartEditRest = (weekNum: number, exerciseIndex: number, blockIndex: number, currentRest: number) => {
    setEditingRest({
      weekNum,
      exerciseIndex,
      blockIndex,
      value: currentRest.toString(),
    });
  };
  
  const handleSaveRest = () => {
    if (!editingRest || !program) return;
    
    const { weekNum, exerciseIndex, blockIndex, value } = editingRest;
    const newRest = parseInt(value) || 0;
    
    const week = weeks[weekNum];
    if (!week) {
      setEditingRest(null);
      return;
    }
    
    const day = week.days?.[selectedDayIndex];
    if (!day) {
      setEditingRest(null);
      return;
    }
    
    const exercise = day.exercises[exerciseIndex];
    if (!exercise) {
      setEditingRest(null);
      return;
    }
    
    // Aggiorna il blocco con il nuovo rest
    const updatedBlocks = exercise.blocks.map((block, i) => 
      i === blockIndex ? { ...block, rest: newRest } : block
    );
    
    const updatedExercise = { ...exercise, blocks: updatedBlocks };
    const updatedExercises = day.exercises.map((ex, i) => 
      i === exerciseIndex ? updatedExercise : ex
    );
    
    const updatedDay = { ...day, exercises: updatedExercises };
    const updatedDays = week.days.map((d, i) => 
      i === selectedDayIndex ? updatedDay : d
    );
    
    updateWeek(weekNum, { ...week, days: updatedDays });
    setEditingRest(null);
  };
  
  const handleCancelEditRest = () => {
    setEditingRest(null);
  };
  
  const handleRestKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveRest();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEditRest();
    }
  };
  
  // === CANCELLAZIONE GRANULARE ===
  const handleOpenDeleteBlockDialog = (weekNum: number, exerciseIndex: number, blockIndex: number, exerciseName: string) => {
    setDeleteBlockDialog({ weekNum, exerciseIndex, blockIndex, exerciseName });
  };
  
  const handleDeleteBlockInWeek = (allWeeks: boolean) => {
    if (!deleteBlockDialog || !program) return;
    
    const { weekNum, exerciseIndex, blockIndex, exerciseName } = deleteBlockDialog;
    
    if (allWeeks) {
      // Cancella da tutte le settimane
      const newWeeks = { ...program.weeks };
      
      weekNumbers.forEach(wNum => {
        const week = newWeeks[wNum];
        const day = week?.days?.[selectedDayIndex];
        if (!week || !day) return;
        
        const exercise = day.exercises[exerciseIndex];
        if (!exercise || exercise.exerciseName !== exerciseName) return;
        
        if (exercise.blocks.length <= 1) {
          // Se è l'ultimo blocco, rimuovi l'esercizio
          const filteredExercises = day.exercises.filter((_, i) => i !== exerciseIndex);
          newWeeks[wNum] = {
            ...week,
            days: week.days.map((d, i) => i === selectedDayIndex ? { ...d, exercises: filteredExercises } : d),
          };
        } else {
          // Rimuovi solo il blocco
          const updatedBlocks = exercise.blocks.filter((_, i) => i !== blockIndex);
          const updatedExercise = { ...exercise, blocks: updatedBlocks };
          const updatedExercises = day.exercises.map((ex, i) => i === exerciseIndex ? updatedExercise : ex);
          newWeeks[wNum] = {
            ...week,
            days: week.days.map((d, i) => i === selectedDayIndex ? { ...d, exercises: updatedExercises } : d),
          };
        }
      });
      
      updateProgram(program.id, { ...program, weeks: newWeeks });
    } else {
      // Cancella solo da questa settimana
      const week = weeks[weekNum];
      const day = week?.days?.[selectedDayIndex];
      if (!week || !day) {
        setDeleteBlockDialog(null);
        return;
      }
      
      const exercise = day.exercises[exerciseIndex];
      if (!exercise) {
        setDeleteBlockDialog(null);
        return;
      }
      
      if (exercise.blocks.length <= 1) {
        // Se è l'ultimo blocco, rimuovi l'esercizio da questa settimana
        const filteredExercises = day.exercises.filter((_, i) => i !== exerciseIndex);
        const updatedDay = { ...day, exercises: filteredExercises };
        updateWeek(weekNum, { ...week, days: week.days.map((d, i) => i === selectedDayIndex ? updatedDay : d) });
      } else {
        // Rimuovi solo il blocco
        const updatedBlocks = exercise.blocks.filter((_, i) => i !== blockIndex);
        const updatedExercise = { ...exercise, blocks: updatedBlocks };
        const updatedExercises = day.exercises.map((ex, i) => i === exerciseIndex ? updatedExercise : ex);
        const updatedDay = { ...day, exercises: updatedExercises };
        updateWeek(weekNum, { ...week, days: week.days.map((d, i) => i === selectedDayIndex ? updatedDay : d) });
      }
    }
    
    setDeleteBlockDialog(null);
  };
  
  // === COPIA/INCOLLA BLOCCHI ===
  const handleCopyBlock = (weekNum: number, exerciseIndex: number, blockIndex: number, exerciseName: string) => {
    const week = weeks[weekNum];
    const day = week?.days?.[selectedDayIndex];
    const exercise = day?.exercises?.[exerciseIndex];
    const block = exercise?.blocks?.[blockIndex];
    
    if (block) {
      setClipboard({ block: { ...block }, exerciseName });
    }
  };
  
  const handlePasteBlock = (weekNum: number, exerciseIndex: number, blockIndex: number) => {
    if (!clipboard || !program) return;
    
    const week = weeks[weekNum];
    const day = week?.days?.[selectedDayIndex];
    const exercise = day?.exercises?.[exerciseIndex];
    
    if (!week || !day || !exercise) return;
    
    // Sostituisci il blocco con quello copiato (mantieni l'id se serve)
    const updatedBlocks = exercise.blocks.map((b, i) => 
      i === blockIndex ? { ...clipboard.block } : b
    );
    
    const updatedExercise = { ...exercise, blocks: updatedBlocks };
    const updatedExercises = day.exercises.map((ex, i) => i === exerciseIndex ? updatedExercise : ex);
    const updatedDay = { ...day, exercises: updatedExercises };
    
    updateWeek(weekNum, { ...week, days: week.days.map((d, i) => i === selectedDayIndex ? updatedDay : d) });
  };
  
  const handleApplyBlockToAllWeeks = (sourceWeekNum: number, exerciseIndex: number, blockIndex: number, exerciseName: string) => {
    if (!program) return;
    
    const sourceWeek = weeks[sourceWeekNum];
    const sourceDay = sourceWeek?.days?.[selectedDayIndex];
    const sourceExercise = sourceDay?.exercises?.[exerciseIndex];
    const sourceBlock = sourceExercise?.blocks?.[blockIndex];
    
    if (!sourceBlock) return;
    
    const newWeeks = { ...program.weeks };
    
    weekNumbers.forEach(weekNum => {
      if (weekNum === sourceWeekNum) return; // Salta la settimana sorgente
      
      const week = newWeeks[weekNum];
      const day = week?.days?.[selectedDayIndex];
      if (!week || !day) return;
      
      const exercise = day.exercises[exerciseIndex];
      if (!exercise || exercise.exerciseName !== exerciseName) return;
      
      // Aggiorna o aggiungi il blocco
      let updatedBlocks: ExerciseBlock[];
      if (blockIndex < exercise.blocks.length) {
        // Sostituisci blocco esistente
        updatedBlocks = exercise.blocks.map((b, i) => i === blockIndex ? { ...sourceBlock } : b);
      } else {
        // Aggiungi nuovo blocco
        updatedBlocks = [...exercise.blocks, { ...sourceBlock }];
      }
      
      const updatedExercise = { ...exercise, blocks: updatedBlocks };
      const updatedExercises = day.exercises.map((ex, i) => i === exerciseIndex ? updatedExercise : ex);
      
      newWeeks[weekNum] = {
        ...week,
        days: week.days.map((d, i) => i === selectedDayIndex ? { ...d, exercises: updatedExercises } : d),
      };
    });
    
    updateProgram(program.id, { ...program, weeks: newWeeks });
  };
  
  // Incolla blocco su cella vuota (crea prima l'esercizio/blocco se necessario)
  const handlePasteBlockToEmpty = (weekNum: number, exerciseIndex: number, blockIndex: number, exerciseName: string) => {
    if (!clipboard || !program) return;
    
    const week = weeks[weekNum];
    if (!week) return;
    
    const day = week.days?.[selectedDayIndex];
    if (!day) return;
    
    const exercise = day.exercises?.[exerciseIndex];
    
    if (exercise) {
      // L'esercizio esiste, aggiungi solo il blocco
      const newBlocks = [...exercise.blocks];
      while (newBlocks.length <= blockIndex) {
        newBlocks.push(createDefaultBlock(exercise.exerciseType || 'resistance'));
      }
      // Sovrascrivi con i dati della clipboard
      newBlocks[blockIndex] = { ...clipboard.block };
      
      const updatedExercise = { ...exercise, blocks: newBlocks };
      const updatedExercises = day.exercises.map((ex, i) => i === exerciseIndex ? updatedExercise : ex);
      const updatedDay = { ...day, exercises: updatedExercises };
      
      updateWeek(weekNum, { ...week, days: week.days.map((d, i) => i === selectedDayIndex ? updatedDay : d) });
    } else {
      // L'esercizio non esiste, cerca il template da un'altra settimana
      let sourceExercise: ProgramExercise | null = null;
      for (const wn of weekNumbers) {
        const w = weeks[wn];
        const d = w?.days?.[selectedDayIndex];
        const ex = d?.exercises?.[exerciseIndex];
        if (ex && ex.exerciseName === exerciseName) {
          sourceExercise = ex;
          break;
        }
      }
      
      if (!sourceExercise) return;
      
      // Crea nuovo esercizio con il blocco dalla clipboard
      const newExercise: ProgramExercise = {
        exerciseName: sourceExercise.exerciseName,
        exerciseType: sourceExercise.exerciseType,
        muscleGroup: sourceExercise.muscleGroup,
        blocks: [{ ...clipboard.block }],
        notes: sourceExercise.notes || '',
      };
      
      // Aggiungi blocchi vuoti se necessario
      while (newExercise.blocks.length <= blockIndex) {
        newExercise.blocks.push(createDefaultBlock(sourceExercise.exerciseType || 'resistance'));
      }
      newExercise.blocks[blockIndex] = { ...clipboard.block };
      
      const updatedExercises = [...day.exercises];
      // Inserisci nella posizione corretta
      while (updatedExercises.length <= exerciseIndex) {
        updatedExercises.push(newExercise);
      }
      if (updatedExercises.length > exerciseIndex && !updatedExercises[exerciseIndex]) {
        updatedExercises[exerciseIndex] = newExercise;
      } else {
        updatedExercises.splice(exerciseIndex, 0, newExercise);
      }
      
      const updatedDay = { ...day, exercises: updatedExercises };
      updateWeek(weekNum, { ...week, days: week.days.map((d, i) => i === selectedDayIndex ? updatedDay : d) });
    }
  };
  
  const toggleWeekSelection = (weekNum: number) => {
    setSelectedWeeksForNewExercise(prev => 
      prev.includes(weekNum) 
        ? prev.filter(w => w !== weekNum)
        : [...prev, weekNum]
    );
  };
  
  // Aggiunge una riga blocco pendente (vuota) per un esercizio
  const handleAddPendingBlock = (exerciseIndex: number) => {
    setPendingBlocks(prev => ({
      ...prev,
      [exerciseIndex]: (prev[exerciseIndex] || 0) + 1,
    }));
  };
  
  // Rimuove una riga blocco pendente per un esercizio
  const handleRemovePendingBlock = (exerciseIndex: number) => {
    setPendingBlocks(prev => {
      const current = prev[exerciseIndex] || 0;
      if (current <= 1) {
        const updated = { ...prev };
        delete updated[exerciseIndex];
        return updated;
      }
      return { ...prev, [exerciseIndex]: current - 1 };
    });
  };
  
  // Aggiunge una riga esercizio pendente
  const handleAddPendingExercise = () => {
    setPendingExercise({ muscleGroup: '', exerciseName: '', createdInWeeks: [] });
  };
  
  // Rimuove la riga esercizio pendente
  const handleRemovePendingExercise = () => {
    setPendingExercise(null);
  };
  
  // Crea un esercizio effettivo in una settimana specifica (dalla riga pendente)
  const handleCreateExerciseInWeek = (weekNum: number) => {
    if (!program || !pendingExercise || !pendingExercise.exerciseName) return;
    
    const libraryEx = exerciseLibrary.find(ex => ex.name === pendingExercise.exerciseName);
    if (!libraryEx) return;
    
    const muscleGroup = pendingExercise.muscleGroup || getMuscleGroupFromLibrary(pendingExercise.exerciseName);
    
    const week = weeks[weekNum];
    if (!week) return;
    
    const newDays = week.days.map(d => ({ 
      ...d, 
      exercises: d.exercises.map(ex => ({ ...ex, blocks: [...ex.blocks] }))
    }));
    
    while (newDays.length <= selectedDayIndex) {
      newDays.push({ name: `Giorno ${newDays.length + 1}`, exercises: [] });
    }
    
    const newExercise: ProgramExercise = {
      exerciseName: libraryEx.name,
      exerciseType: libraryEx.type,
      muscleGroup,
      blocks: [createDefaultBlock(libraryEx.type)],
      notes: '',
    };
    
    newDays[selectedDayIndex] = {
      ...newDays[selectedDayIndex],
      exercises: [...newDays[selectedDayIndex].exercises, newExercise],
    };
    
    updateWeek(weekNum, { ...week, days: newDays });
    
    // Rimuovi la riga pending - l'esercizio apparirà nella tabella normale
    // dove l'utente potrà aggiungere blocchi ad altre settimane
    setPendingExercise(null);
  };
  
  // Crea l'esercizio in una settimana dove non esiste, copiandolo da un'altra settimana
  const handleCreateExerciseFromExisting = (weekNum: number, instance: ExerciseInstance) => {
    if (!program) return;
    
    // Trova l'esercizio in un'altra settimana per copiare le info base
    let sourceExercise: ProgramExercise | null = null;
    for (const wn of weekNumbers) {
      if (wn === weekNum) continue;
      const week = weeks[wn];
      const day = week?.days?.[selectedDayIndex];
      const exercise = day?.exercises?.[instance.exerciseIndex];
      if (exercise && exercise.exerciseName === instance.exerciseName) {
        sourceExercise = exercise;
        break;
      }
    }
    
    if (!sourceExercise) return;
    
    const libraryEx = exerciseLibrary.find(ex => ex.name === instance.exerciseName);
    
    const week = weeks[weekNum];
    if (!week) return;
    
    const newDays = week.days.map(d => ({ 
      ...d, 
      exercises: d.exercises.map(ex => ({ ...ex, blocks: [...ex.blocks] }))
    }));
    
    while (newDays.length <= selectedDayIndex) {
      newDays.push({ name: `Giorno ${newDays.length + 1}`, exercises: [] });
    }
    
    // Crea il nuovo esercizio con un blocco di default
    const newExercise: ProgramExercise = {
      exerciseName: instance.exerciseName,
      exerciseType: libraryEx?.type || sourceExercise.exerciseType || 'resistance',
      muscleGroup: instance.muscleGroup,
      blocks: [createDefaultBlock(libraryEx?.type || sourceExercise.exerciseType || 'resistance')],
      notes: '',
    };
    
    // Inserisci l'esercizio nella stessa posizione (exerciseIndex)
    const exercises = [...newDays[selectedDayIndex].exercises];
    // Se la posizione è oltre la lunghezza, aggiungi alla fine
    if (instance.exerciseIndex >= exercises.length) {
      exercises.push(newExercise);
    } else {
      // Inserisci nella posizione corretta
      exercises.splice(instance.exerciseIndex, 0, newExercise);
    }
    
    newDays[selectedDayIndex] = {
      ...newDays[selectedDayIndex],
      exercises,
    };
    
    updateWeek(weekNum, { ...week, days: newDays });
    
    // Apri il modal per configurare
    setSelectedWeekNum(weekNum);
    setSelectedExerciseIndex(instance.exerciseIndex);
    setSelectedBlockIndex(0);
    setSelectedExercise(newExercise);
    setCurrentWeek(weekNum);
    setConfigModalOpen(true);
  };
  
  // Crea un blocco effettivo in una settimana specifica
  const handleCreateBlockInWeek = (weekNum: number, exerciseIndex: number, blockIndex: number) => {
    if (!program) return;
    
    const week = weeks[weekNum];
    const day = week?.days?.[selectedDayIndex];
    const exercise = day?.exercises?.[exerciseIndex];
    
    if (!week || !day || !exercise) return;
    
    // Copia i blocchi esistenti e aggiungi il nuovo alla posizione corretta
    const existingBlocks = getExerciseBlocks(exercise);
    const newBlocks = [...existingBlocks];
    
    // Se blockIndex è oltre la lunghezza attuale, aggiungi blocchi vuoti fino a raggiungerlo
    while (newBlocks.length <= blockIndex) {
      newBlocks.push(createDefaultBlock(exercise.exerciseType || 'resistance'));
    }
    
    // Aggiorna l'esercizio con i nuovi blocchi
    const updatedExercise = { ...exercise, blocks: newBlocks };
    
    const updatedDay = {
      ...day,
      exercises: day.exercises.map((ex, i) => i === exerciseIndex ? updatedExercise : ex),
    };
    
    const updatedWeek = {
      ...week,
      days: week.days.map((d, i) => i === selectedDayIndex ? updatedDay : d),
    };
    
    updateWeek(weekNum, updatedWeek);
    
    // Riduci il contatore dei blocchi pendenti se necessario
    const currentPending = pendingBlocks[exerciseIndex] || 0;
    if (currentPending > 0) {
      // Conta quanti blocchi reali esistono ora
      const realBlocksCount = newBlocks.length;
      // Ricalcola quanti pendenti servono ancora
      const totalNeeded = blockIndex + 1;
      const newPending = Math.max(0, totalNeeded - realBlocksCount);
      
      if (newPending !== currentPending) {
        setPendingBlocks(prev => {
          const updated = { ...prev };
          if (newPending === 0) {
            delete updated[exerciseIndex];
          } else {
            updated[exerciseIndex] = newPending;
          }
          return updated;
        });
      }
    }
    
    // Apri il modal per configurare il blocco appena creato
    setSelectedWeekNum(weekNum);
    setSelectedExerciseIndex(exerciseIndex);
    setSelectedBlockIndex(blockIndex);
    setSelectedExercise(updatedExercise);
    setCurrentWeek(weekNum);
    setConfigModalOpen(true);
  };
  
  const handleOpenConfigModal = (weekNum: number, instance: ExerciseInstance, blockRow: BlockRow) => {
    const weekData = blockRow.weekData[weekNum];
    if (weekData.exists && weekData.exercise) {
      setSelectedWeekNum(weekNum);
      setSelectedExerciseIndex(instance.exerciseIndex);
      setSelectedBlockIndex(blockRow.blockIndex);
      setSelectedExercise(weekData.exercise);
      setCurrentWeek(weekNum);
      setConfigModalOpen(true);
    }
  };
  
  const handleOpenLogModal = (weekNum: number, instance: ExerciseInstance, blockRow: BlockRow) => {
    const weekData = blockRow.weekData[weekNum];
    if (weekData.exists) {
      setSelectedWeekNum(weekNum);
      setSelectedExerciseIndex(instance.exerciseIndex);
      setSelectedBlockIndex(blockRow.blockIndex);
      setCurrentWeek(weekNum);
      setLogModalOpen(true);
    }
  };
  
  const handleUpdateExercise = (field: keyof ProgramExercise, value: any) => {
    if (selectedWeekNum === null || selectedExerciseIndex === null || !selectedExercise) return;
    const week = weeks[selectedWeekNum];
    const day = week?.days?.[selectedDayIndex];
    if (!day) return;
    
    const updatedExercise = { ...selectedExercise, [field]: value };
    setSelectedExercise(updatedExercise);
    
    const updatedDay = {
      ...day,
      exercises: day.exercises.map((ex, i) => i === selectedExerciseIndex ? updatedExercise : ex),
    };
    const updatedWeek = {
      ...week,
      days: week.days.map((d, i) => i === selectedDayIndex ? updatedDay : d),
    };
    updateWeek(selectedWeekNum, updatedWeek);
  };
  
  const handleUpdateBlock = (blockIndex: number, field: keyof ExerciseBlock, value: any) => {
    if (!selectedExercise) return;
    const blocks = [...(selectedExercise.blocks || [])];
    blocks[blockIndex] = { ...blocks[blockIndex], [field]: value };
    handleUpdateExercise('blocks', blocks);
  };
  
  const handleUpdateBlockBatch = (blockIndex: number, updates: Partial<ExerciseBlock>) => {
    if (!selectedExercise) return;
    const blocks = [...(selectedExercise.blocks || [])];
    blocks[blockIndex] = { ...blocks[blockIndex], ...updates };
    handleUpdateExercise('blocks', blocks);
  };
  
  const handleAddBlock = () => {
    if (!selectedExercise) return;
    const newBlock = createDefaultBlock(selectedExercise.exerciseType || 'resistance');
    handleUpdateExercise('blocks', [...(selectedExercise.blocks || []), newBlock]);
  };
  
  const handleDeleteBlock = (blockIndex: number) => {
    if (!selectedExercise) return;
    let blocks = (selectedExercise.blocks || []).filter((_, i) => i !== blockIndex);
    if (blocks.length === 0) blocks = [createDefaultBlock(selectedExercise.exerciseType || 'resistance')];
    handleUpdateExercise('blocks', blocks);
  };
  
  if (!program || weekNumbers.length === 0) {
    return (
      <Card className="card-monetra">
        <CardContent className="py-8 text-center text-muted-foreground">
          Nessun programma o settimana disponibile
        </CardContent>
      </Card>
    );
  }
  
  const resocontoFilledStyle = {
    backgroundColor: adjustColor('#d946ef', 0.85),
    color: '#831843',
  };
  
  const resocontoEmptyStyle = {
    backgroundColor: '#fef3c7',
  };
  
  const totalExercises = exerciseInstances.length;
  
  return (
    <>
      <Card className="card-monetra">
        <CardHeader className="pb-4 space-y-4">
          {/* Titolo e Selettore Giorno */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="font-heading text-lg">Vista Tabellare</CardTitle>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Giorno:</span>
              <Select
                value={selectedDayIndex.toString()}
                onValueChange={(v) => setSelectedDayIndex(parseInt(v, 10))}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Seleziona giorno" />
                </SelectTrigger>
                <SelectContent>
                  {availableDays.map(({ index, name }) => (
                    <SelectItem key={index} value={index.toString()}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setShowAddDayDialog(true)} title="Aggiungi giorno">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Azioni */}
          <div className="flex flex-wrap gap-2 items-center pt-2 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAddPendingExercise}
              disabled={pendingExercise !== null}
              className="border-green-500 text-green-600 hover:bg-green-50"
            >
              <Plus className="w-4 h-4 mr-1" />Aggiungi Riga Esercizio
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              setSelectedWeeksForNewExercise([...weekNumbers]);
              setShowAddExerciseDialog(true);
            }}>
              <Plus className="w-4 h-4 mr-1" />Aggiungi con Dialog
            </Button>
            <Button variant="outline" size="sm" onClick={handleAddWeek} className="bg-black text-white border-black hover:bg-black/90">
              <Plus className="w-4 h-4 mr-1" />Nuova Settimana
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="w-full overflow-auto max-h-[70vh] pb-24">
            <div className="inline-block min-w-max">
              <table className="table-auto border-collapse text-sm">
                <thead className="sticky top-0 z-20 bg-white">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold border-b border-r border-border bg-muted/50 whitespace-nowrap">
                      #
                    </th>
                    <th className="px-3 py-2 text-left font-semibold border-b border-r border-border bg-muted/50 whitespace-nowrap">
                      Gruppo
                    </th>
                    <th className="px-3 py-2 text-left font-semibold border-b border-r border-border bg-muted/50 whitespace-nowrap">
                      Esercizio
                    </th>
                    {weekNumbers.map((weekNum) => (
                      <th key={`header-${weekNum}`} colSpan={3} className="p-0 border-b border-border">
                        <div className="bg-primary/20 px-2 py-1.5 text-center font-bold border-b border-border text-xs">
                          WEEK {weekNum}
                        </div>
                        <div className="grid grid-cols-3">
                          <div className="p-1.5 text-center text-[10px] font-medium border-r border-border bg-muted/50 whitespace-nowrap">
                            REST / NOTE
                          </div>
                          <div className="p-1.5 text-center text-[10px] font-medium border-r border-border bg-white whitespace-nowrap">
                            SCHEMA
                          </div>
                          <div className="p-1.5 text-center text-[10px] font-medium bg-amber-50 whitespace-nowrap">
                            RESOCONTO
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {exerciseInstances.map((instance, instanceIdx) => (
                    instance.blocks.map((blockRow, blockIdx) => {
                      const isFirstBlock = blockIdx === 0;
                      const isFirstExercise = instanceIdx === 0;
                      const isLastExercise = instanceIdx === totalExercises - 1;
                      
                      // Determina se questo blocco è "pendente" (non esiste in nessuna settimana)
                      const isPendingBlock = weekNumbers.every(wn => !blockRow.weekData[wn]?.exists);
                      const hasPendingBlocks = (pendingBlocks[instance.exerciseIndex] || 0) > 0;
                      
                      return (
                        <tr 
                          key={`${instance.exerciseIndex}-${blockIdx}`} 
                          className={`hover:bg-muted/10 ${isPendingBlock ? 'bg-green-50/30 border-l-2 border-l-green-400' : ''}`}
                        >
                          {/* Numero ordine e frecce / Pulsante annulla per blocchi pendenti */}
                          {isFirstBlock && (
                            <td
                              rowSpan={instance.blocks.length}
                              className="px-1 py-1 border-b border-r border-border bg-muted/30 align-middle text-center"
                            >
                              <div className="flex flex-col items-center gap-0.5">
                                <button
                                  onClick={() => handleMoveExercise(instance.exerciseIndex, 'up')}
                                  disabled={isFirstExercise}
                                  className={`p-0.5 rounded ${isFirstExercise ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
                                  title="Sposta su"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-medium text-muted-foreground">{instance.exerciseIndex + 1}</span>
                                <button
                                  onClick={() => handleMoveExercise(instance.exerciseIndex, 'down')}
                                  disabled={isLastExercise}
                                  className={`p-0.5 rounded ${isLastExercise ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
                                  title="Sposta giù"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                                {/* Pulsante per rimuovere blocchi pendenti */}
                                {hasPendingBlocks && (
                                  <button
                                    onClick={() => handleRemovePendingBlock(instance.exerciseIndex)}
                                    className="p-0.5 rounded text-red-500 hover:text-red-700 hover:bg-red-50 mt-1"
                                    title="Rimuovi riga pendente"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                          
                          {/* Gruppo Muscolare */}
                          {isFirstBlock && (
                            <td
                              rowSpan={instance.blocks.length}
                              className="p-2 font-bold text-xs border-b border-r border-border align-middle text-center"
                              style={{
                                backgroundColor: instance.color,
                                color: getContrastTextColor(instance.color),
                              }}
                            >
                              <span className="uppercase tracking-wide whitespace-pre-wrap">
                                {instance.muscleGroup}
                              </span>
                            </td>
                          )}
                          
                          {/* Nome Esercizio */}
                          {isFirstBlock && (
                            <td
                              rowSpan={instance.blocks.length}
                              className="p-2 border-b border-r border-border bg-white align-middle group/exercise"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <div className="font-medium text-sm whitespace-pre-wrap">{instance.exerciseName}</div>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover/exercise:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddPendingBlock(instance.exerciseIndex);
                                    }}
                                    className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                                    title="Aggiungi blocco"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteExercise(instance.exerciseIndex, instance.exerciseName);
                                    }}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                    title="Elimina esercizio"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </td>
                          )}
                          
                          {/* Colonne per ogni settimana */}
                          {weekNumbers.map((weekNum) => {
                            const weekData = blockRow.weekData[weekNum];
                            const logData = blockRow.logData[weekNum];
                            const hasLog = Boolean(logData?.reps);
                            
                            // Verifica se l'esercizio esiste in questa settimana (anche se questo blocco specifico no)
                            const exerciseExistsInWeek = weekData.exerciseIndex >= 0;
                            // Blocco può essere creato se l'esercizio esiste ma il blocco no
                            const canCreateBlock = !weekData.exists && exerciseExistsInWeek;
                            // Esercizio può essere creato se non esiste in questa settimana (solo per il primo blocco)
                            const canCreateExercise = !exerciseExistsInWeek && blockRow.blockIndex === 0;
                            
                            // Combina note per REST/NOTE
                            const restNotesParts: string[] = [];
                            if (weekData.exerciseNotes) restNotesParts.push(weekData.exerciseNotes);
                            if (weekData.blockNotes) restNotesParts.push(weekData.blockNotes);
                            const notesText = restNotesParts.join('\n');
                            
                            // Verifica se questa cella è in editing
                            const isEditingThisRest = editingRest && 
                              editingRest.weekNum === weekNum && 
                              editingRest.exerciseIndex === instance.exerciseIndex && 
                              editingRest.blockIndex === blockRow.blockIndex;
                            
                            return (
                              <td key={`data-${weekNum}`} colSpan={3} className="p-0 border-b border-border">
                                <div className="grid grid-cols-3">
                                  {/* REST / NOTE */}
                                  <div 
                                    className={`p-2 border-r border-border bg-muted/20 text-xs ${
                                      weekData.exists && !isEditingThisRest ? 'cursor-pointer hover:bg-muted/40' : ''
                                    }`}
                                    onClick={() => {
                                      if (weekData.exists && !isEditingThisRest) {
                                        handleStartEditRest(weekNum, instance.exerciseIndex, blockRow.blockIndex, weekData.rest);
                                      }
                                    }}
                                  >
                                    {weekData.exists ? (
                                      isEditingThisRest ? (
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-1">
                                            <span className="text-muted-foreground">Rest:</span>
                                            <Input
                                              type="number"
                                              value={editingRest.value}
                                              onChange={(e) => setEditingRest({ ...editingRest, value: e.target.value })}
                                              onKeyDown={handleRestKeyDown}
                                              onBlur={handleSaveRest}
                                              autoFocus
                                              className="h-6 w-16 text-xs px-1"
                                              min={0}
                                            />
                                            <span className="text-muted-foreground">s</span>
                                          </div>
                                          {notesText && <div className="whitespace-pre-wrap text-muted-foreground">{notesText}</div>}
                                        </div>
                                      ) : (
                                        <div className="whitespace-pre-wrap">
                                          {weekData.rest ? <div>Rest: {weekData.rest}s</div> : null}
                                          {notesText && <div className="text-muted-foreground">{notesText}</div>}
                                          {!weekData.rest && !notesText && '-'}
                                        </div>
                                      )
                                    ) : '-'}
                                  </div>
                                  
                                  {/* SCHEMA con Context Menu */}
                                  <ContextMenu>
                                    <ContextMenuTrigger asChild>
                                      <div 
                                        className={`p-2 border-r relative group ${
                                          weekData.exists 
                                            ? 'bg-white cursor-pointer hover:bg-blue-50 border-border' 
                                            : (canCreateBlock || canCreateExercise)
                                              ? 'bg-transparent cursor-pointer hover:bg-gray-50 border-dashed border-gray-300'
                                              : 'bg-white border-border'
                                        }`}
                                        onClick={() => {
                                          if (weekData.exists) {
                                            handleOpenConfigModal(weekNum, instance, blockRow);
                                          } else if (canCreateBlock) {
                                            handleCreateBlockInWeek(weekNum, instance.exerciseIndex, blockRow.blockIndex);
                                          } else if (canCreateExercise) {
                                            handleCreateExerciseFromExisting(weekNum, instance);
                                          }
                                        }}
                                      >
                                        {/* Icona cestino al hover */}
                                        {weekData.exists && (
                                          <button
                                            className="absolute top-1 right-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 text-red-500 transition-opacity"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenDeleteBlockDialog(weekNum, weekData.exerciseIndex, blockRow.blockIndex, instance.exerciseName);
                                            }}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}
                                        {weekData.exists ? (
                                          <div className="space-y-0.5 pr-4">
                                            <div className="font-semibold text-xs text-gray-900 whitespace-pre-wrap">
                                              {weekData.schema}
                                            </div>
                                            {weekData.loads && (
                                              <div className="text-[11px] text-gray-600 whitespace-pre-wrap">{weekData.loads}</div>
                                            )}
                                            {weekData.intensityInfo && (
                                              <div className="text-[10px] text-muted-foreground whitespace-pre-wrap">{weekData.intensityInfo}</div>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-muted-foreground italic text-xs">-</span>
                                        )}
                                      </div>
                                    </ContextMenuTrigger>
                                    {/* Menu contestuale - disponibile sia per celle piene che vuote */}
                                    <ContextMenuContent>
                                      {weekData.exists ? (
                                        <>
                                          <ContextMenuItem onClick={() => handleCopyBlock(weekNum, weekData.exerciseIndex, blockRow.blockIndex, instance.exerciseName)}>
                                            <Copy className="w-4 h-4 mr-2" />
                                            Copia blocco
                                          </ContextMenuItem>
                                          <ContextMenuItem 
                                            onClick={() => handlePasteBlock(weekNum, weekData.exerciseIndex, blockRow.blockIndex)}
                                            disabled={!clipboard}
                                          >
                                            <Clipboard className="w-4 h-4 mr-2" />
                                            Incolla blocco
                                            {clipboard && <span className="ml-auto text-xs text-muted-foreground">(da {clipboard.exerciseName})</span>}
                                          </ContextMenuItem>
                                          <ContextMenuSeparator />
                                          <ContextMenuItem onClick={() => handleApplyBlockToAllWeeks(weekNum, weekData.exerciseIndex, blockRow.blockIndex, instance.exerciseName)}>
                                            <CopyCheck className="w-4 h-4 mr-2" />
                                            Applica a tutte le settimane
                                          </ContextMenuItem>
                                          <ContextMenuSeparator />
                                          <ContextMenuItem 
                                            onClick={() => handleOpenDeleteBlockDialog(weekNum, weekData.exerciseIndex, blockRow.blockIndex, instance.exerciseName)}
                                            className="text-red-600"
                                          >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Elimina blocco
                                          </ContextMenuItem>
                                        </>
                                      ) : (canCreateBlock || canCreateExercise) && (
                                        <>
                                          <ContextMenuItem 
                                            onClick={() => {
                                              if (canCreateBlock) {
                                                handleCreateBlockInWeek(weekNum, instance.exerciseIndex, blockRow.blockIndex);
                                              } else if (canCreateExercise) {
                                                handleCreateExerciseFromExisting(weekNum, instance);
                                              }
                                            }}
                                          >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Crea blocco vuoto
                                          </ContextMenuItem>
                                          {clipboard && (
                                            <ContextMenuItem 
                                              onClick={() => handlePasteBlockToEmpty(weekNum, instance.exerciseIndex, blockRow.blockIndex, instance.exerciseName)}
                                            >
                                              <Clipboard className="w-4 h-4 mr-2" />
                                              Incolla blocco
                                              <span className="ml-auto text-xs text-muted-foreground">(da {clipboard.exerciseName})</span>
                                            </ContextMenuItem>
                                          )}
                                        </>
                                      )}
                                    </ContextMenuContent>
                                  </ContextMenu>
                                  
                                  {/* RESOCONTO */}
                                  <div 
                                    className={`p-2 ${weekData.exists ? 'cursor-pointer hover:opacity-80' : ''}`}
                                    style={hasLog ? resocontoFilledStyle : resocontoEmptyStyle}
                                    onClick={() => weekData.exists && handleOpenLogModal(weekNum, instance, blockRow)}
                                  >
                                    {hasLog ? (
                                      <div className="space-y-0.5 text-xs whitespace-pre-wrap">
                                        <div className="font-semibold">{logData.reps}</div>
                                        {logData.loads && <div className="text-[11px]">{logData.loads}</div>}
                                        {logData.rpe && <div className="text-[11px]">{logData.rpe}</div>}
                                        {logData.notes && <div className="text-[10px] italic mt-1">{logData.notes}</div>}
                                      </div>
                                    ) : weekData.exists ? (
                                      <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                                        <ClipboardList className="w-3 h-3" />
                                        <span>Log</span>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground italic text-xs">-</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  ))}
                  
                  {/* Riga esercizio pendente */}
                  {pendingExercise !== null && (
                    <tr className="bg-green-50/50 border-2 border-dashed border-green-300">
                      {/* Colonna # con pulsante annulla */}
                      <td className="px-1 py-2 border-b border-r border-green-300 align-middle text-center">
                        <button
                          onClick={handleRemovePendingExercise}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Annulla"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                      
                      {/* Colonna Gruppo Muscolare - Dropdown */}
                      <td className="p-2 border-b border-r border-green-300 align-middle">
                        <Select
                          value={pendingExercise.muscleGroup || 'auto'}
                          onValueChange={(value) => setPendingExercise(prev => prev ? { ...prev, muscleGroup: value === 'auto' ? '' : value } : null)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Gruppo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto</SelectItem>
                            {muscleGroups.map((mg) => (
                              <SelectItem key={mg} value={mg}>{mg}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      
                      {/* Colonna Esercizio - Dropdown */}
                      <td className="p-2 border-b border-r border-green-300 align-middle">
                        <Select
                          value={pendingExercise.exerciseName || ''}
                          onValueChange={(value) => setPendingExercise(prev => prev ? { ...prev, exerciseName: value } : null)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Seleziona esercizio..." />
                          </SelectTrigger>
                          <SelectContent>
                            {exerciseLibrary.map((ex) => (
                              <SelectItem key={ex.name} value={ex.name}>{ex.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      
                      {/* Colonne settimane - Click per creare (celle vuote/tratteggiato) */}
                      {weekNumbers.map((weekNum) => {
                        // Verifica se è già stato creato tramite QUESTA riga pendente
                        const alreadyCreatedHere = pendingExercise.createdInWeeks.includes(weekNum);
                        
                        return (
                          <td key={`pending-${weekNum}`} colSpan={3} className="p-0 border-b border-dashed border-gray-300">
                            <div className="grid grid-cols-3">
                              {/* REST - sempre vuoto per pending */}
                              <div className="p-2 border-r border-dashed border-gray-200 text-xs text-center text-muted-foreground">-</div>
                              {/* SCHEMA - cliccabile se esercizio selezionato */}
                              <div 
                                className={`p-2 border-r border-dashed border-gray-200 ${
                                  !pendingExercise.exerciseName 
                                    ? 'bg-transparent'
                                    : alreadyCreatedHere
                                      ? 'bg-emerald-50'
                                      : 'bg-transparent cursor-pointer hover:bg-gray-50'
                                }`}
                                onClick={() => {
                                  if (pendingExercise.exerciseName && !alreadyCreatedHere) {
                                    handleCreateExerciseInWeek(weekNum);
                                  }
                                }}
                              >
                                {alreadyCreatedHere ? (
                                  <span className="text-emerald-600 text-xs">✓</span>
                                ) : (
                                  <span className="text-muted-foreground italic text-xs">-</span>
                                )}
                              </div>
                              {/* RESOCONTO - sempre vuoto per pending */}
                              <div className="p-2 text-xs text-center text-muted-foreground">-</div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  )}
                  
                  {exerciseInstances.length === 0 && !pendingExercise && (
                    <tr>
                      <td colSpan={3 + weekNumbers.length * 3} className="p-8 text-center text-muted-foreground">
                        Nessun esercizio in questo giorno
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Modal Configurazione Esercizio */}
      {selectedExercise && selectedExerciseIndex !== null && (
        <ConfigureExerciseModal
          open={configModalOpen}
          onOpenChange={setConfigModalOpen}
          exercise={selectedExercise}
          exerciseIndex={selectedExerciseIndex}
          dayIndex={selectedDayIndex}
          exerciseLibrary={exerciseLibrary}
          allTechniques={allTechniques}
          customTechniques={customTechniques}
          onUpdate={handleUpdateExercise}
          onUpdateBlock={handleUpdateBlock}
          onUpdateBlockBatch={handleUpdateBlockBatch}
          onAddBlock={handleAddBlock}
          onDeleteBlock={handleDeleteBlock}
          initialBlockIndex={selectedBlockIndex}
        />
      )}
      
      {/* Modal Log Sessione */}
      {selectedExerciseIndex !== null && (
        <LogSessionModal
          open={logModalOpen}
          onOpenChange={setLogModalOpen}
          dayIndex={selectedDayIndex}
          exerciseIndex={selectedExerciseIndex}
          blockIndex={selectedBlockIndex}
        />
      )}
      
      {/* Dialog Aggiungi Giorno */}
      <Dialog open={showAddDayDialog} onOpenChange={setShowAddDayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Giorno</DialogTitle>
            <DialogDescription>Il nuovo giorno verrà aggiunto a tutte le settimane.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="day-name">Nome Giorno</Label>
            <Input
              id="day-name"
              value={newDayName}
              onChange={(e) => setNewDayName(e.target.value)}
              placeholder="es. Push, Pull, Legs..."
              className="mt-1"
              onKeyDown={(e) => e.key === 'Enter' && handleAddDay()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDayDialog(false)}>Annulla</Button>
            <Button onClick={handleAddDay}><Plus className="w-4 h-4 mr-2" />Aggiungi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog Aggiungi Esercizio */}
      <Dialog open={showAddExerciseDialog} onOpenChange={setShowAddExerciseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aggiungi Esercizio</DialogTitle>
            <DialogDescription>Seleziona l'esercizio e le settimane in cui aggiungerlo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Esercizio</Label>
              <Select value={newExerciseName} onValueChange={setNewExerciseName}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleziona esercizio" />
                </SelectTrigger>
                <SelectContent>
                  {exerciseLibrary.map((ex) => (
                    <SelectItem key={ex.name} value={ex.name}>{ex.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Gruppo Muscolare (opzionale)</Label>
              <Select value={newExerciseMuscleGroup} onValueChange={setNewExerciseMuscleGroup}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Auto dalla libreria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto dalla libreria</SelectItem>
                  {muscleGroups.map((mg) => (
                    <SelectItem key={mg} value={mg}>{mg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="mb-2 block">Settimane</Label>
              <div className="flex flex-wrap gap-2">
                {weekNumbers.map((weekNum) => (
                  <label key={weekNum} className="flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer hover:bg-muted/50">
                    <Checkbox
                      checked={selectedWeeksForNewExercise.includes(weekNum)}
                      onCheckedChange={() => toggleWeekSelection(weekNum)}
                    />
                    <span className="text-sm">W{weekNum}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedWeeksForNewExercise([...weekNumbers])}>
                  Tutte
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedWeeksForNewExercise([])}>
                  Nessuna
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddExerciseDialog(false)}>Annulla</Button>
            <Button onClick={handleAddExercise} disabled={!newExerciseName || selectedWeeksForNewExercise.length === 0}>
              <Plus className="w-4 h-4 mr-2" />Aggiungi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog Cancellazione Blocco */}
      <Dialog open={deleteBlockDialog !== null} onOpenChange={(open) => !open && setDeleteBlockDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Elimina Blocco</DialogTitle>
            <DialogDescription>
              Vuoi eliminare questo blocco solo dalla settimana {deleteBlockDialog?.weekNum} o da tutte le settimane?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDeleteBlockDialog(null)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={() => handleDeleteBlockInWeek(false)}>
              Solo W{deleteBlockDialog?.weekNum}
            </Button>
            <Button variant="destructive" onClick={() => handleDeleteBlockInWeek(true)}>
              Tutte le settimane
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
