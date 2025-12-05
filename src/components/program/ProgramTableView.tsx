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
import { ClipboardList, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

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
              
              // Log
              const session = loggedSessions.find(
                s => s.programId === program.id &&
                     s.weekNum === weekNum &&
                     s.exercise === exercise.exerciseName &&
                     s.blockIndex === blockIndex &&
                     s.dayIndex === selectedDayIndex
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
  }, [program, weeks, weekNumbers, selectedDayIndex, loggedSessions, getMuscleColor, exerciseLibrary]);
  
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
    if (!libraryEx) return;
    
    const muscleGroup = newExerciseMuscleGroup && newExerciseMuscleGroup !== 'auto'
      ? newExerciseMuscleGroup
      : getMuscleGroupFromLibrary(newExerciseName);
    
    // Prepara TUTTE le modifiche in modo sincrono prima di applicarle
    const updates: { weekNum: number; updatedWeek: typeof weeks[number] }[] = [];
    
    selectedWeeksForNewExercise.forEach(weekNum => {
      const week = weeks[weekNum];
      if (!week) return;
      
      // Crea copia profonda dei days
      const newDays = week.days.map(d => ({ ...d, exercises: [...d.exercises] }));
      
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
      
      updates.push({
        weekNum,
        updatedWeek: { ...week, days: newDays },
      });
    });
    
    // Applica tutte le modifiche con delay
    const applyUpdates = async () => {
      for (const { weekNum, updatedWeek } of updates) {
        updateWeek(weekNum, updatedWeek);
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    };
    
    applyUpdates();
    
    setNewExerciseName('');
    setNewExerciseMuscleGroup('auto');
    setSelectedWeeksForNewExercise([]);
    setShowAddExerciseDialog(false);
  };
  
  // Elimina esercizio da tutte le settimane (per exerciseIndex)
  const handleDeleteExercise = (exerciseIndex: number, exerciseName: string) => {
    if (!confirm(`Eliminare "${exerciseName}" da tutte le settimane?`)) return;
    
    weekNumbers.forEach(weekNum => {
      const week = weeks[weekNum];
      const day = week?.days?.[selectedDayIndex];
      if (!week || !day) return;
      
      // Verifica che l'esercizio in quella posizione sia quello giusto
      const exercise = day.exercises[exerciseIndex];
      if (!exercise || exercise.exerciseName !== exerciseName) return;
      
      const filteredExercises = day.exercises.filter((_, i) => i !== exerciseIndex);
      
      const updatedDay = { ...day, exercises: filteredExercises };
      const updatedWeek = {
        ...week,
        days: week.days.map((d, i) => i === selectedDayIndex ? updatedDay : d),
      };
      updateWeek(weekNum, updatedWeek);
    });
  };
  
  // Sposta esercizio su/giù
  const handleMoveExercise = (exerciseIndex: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? exerciseIndex - 1 : exerciseIndex + 1;
    
    weekNumbers.forEach(weekNum => {
      const week = weeks[weekNum];
      const day = week?.days?.[selectedDayIndex];
      if (!week || !day) return;
      
      if (newIndex < 0 || newIndex >= day.exercises.length) return;
      
      const exercises = [...day.exercises];
      const [moved] = exercises.splice(exerciseIndex, 1);
      exercises.splice(newIndex, 0, moved);
      
      const updatedDay = { ...day, exercises };
      const updatedWeek = {
        ...week,
        days: week.days.map((d, i) => i === selectedDayIndex ? updatedDay : d),
      };
      updateWeek(weekNum, updatedWeek);
    });
  };
  
  const toggleWeekSelection = (weekNum: number) => {
    setSelectedWeeksForNewExercise(prev => 
      prev.includes(weekNum) 
        ? prev.filter(w => w !== weekNum)
        : [...prev, weekNum]
    );
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
            <Button variant="outline" size="sm" onClick={() => {
              setSelectedWeeksForNewExercise([...weekNumbers]);
              setShowAddExerciseDialog(true);
            }}>
              <Plus className="w-4 h-4 mr-1" />Aggiungi Esercizio
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
                      
                      return (
                        <tr key={`${instance.exerciseIndex}-${blockIdx}`} className="hover:bg-muted/10">
                          {/* Numero ordine e frecce */}
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
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteExercise(instance.exerciseIndex, instance.exerciseName);
                                  }}
                                  className="opacity-0 group-hover/exercise:opacity-100 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-opacity"
                                  title="Elimina esercizio"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                          
                          {/* Colonne per ogni settimana */}
                          {weekNumbers.map((weekNum) => {
                            const weekData = blockRow.weekData[weekNum];
                            const logData = blockRow.logData[weekNum];
                            const hasLog = Boolean(logData?.reps);
                            
                            // Combina note per REST/NOTE
                            const restNotesParts: string[] = [];
                            if (weekData.rest) restNotesParts.push(`Rest: ${weekData.rest}s`);
                            if (weekData.exerciseNotes) restNotesParts.push(weekData.exerciseNotes);
                            if (weekData.blockNotes) restNotesParts.push(weekData.blockNotes);
                            const restNotesText = restNotesParts.join('\n');
                            
                            return (
                              <td key={`data-${weekNum}`} colSpan={3} className="p-0 border-b border-border">
                                <div className="grid grid-cols-3">
                                  {/* REST / NOTE */}
                                  <div className="p-2 border-r border-border bg-muted/20 text-xs whitespace-pre-wrap">
                                    {weekData.exists ? (restNotesText || '-') : '-'}
                                  </div>
                                  
                                  {/* SCHEMA */}
                                  <div 
                                    className={`p-2 border-r border-border bg-white ${weekData.exists ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                                    onClick={() => weekData.exists && handleOpenConfigModal(weekNum, instance, blockRow)}
                                  >
                                    {weekData.exists ? (
                                      <div className="space-y-0.5">
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
                  
                  {exerciseInstances.length === 0 && (
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
    </>
  );
}
