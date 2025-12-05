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
import { ClipboardList, Plus, Copy, Trash2 } from 'lucide-react';

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

// Riga della tabella (un blocco)
interface BlockRow {
  exerciseName: string;
  blockIndex: number;
  weekData: Record<number, WeekBlockData>;
  logData: Record<number, WeekLogData>;
}

// Gruppo di blocchi per esercizio
interface ExerciseGroup {
  exerciseName: string;
  muscleGroup: string;
  blocks: BlockRow[];
}

// Gruppo per muscolo
interface MuscleGroupData {
  muscleGroup: string;
  color: string;
  exercises: ExerciseGroup[];
  totalBlocks: number;
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
    duplicateWeek,
    deleteWeek,
    currentProgramId,
    currentWeek,
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
  
  // Costruisci la struttura dati per la tabella
  const muscleGroupsData = useMemo((): MuscleGroupData[] => {
    if (!program || weekNumbers.length === 0) return [];
    
    // Mappa: exerciseName -> ExerciseGroup
    const exerciseMap = new Map<string, ExerciseGroup>();
    
    // Raccogli tutti gli esercizi e blocchi da tutte le settimane
    weekNumbers.forEach(weekNum => {
      const week = weeks[weekNum];
      const day = week?.days?.[selectedDayIndex];
      if (!day) return;
      
      day.exercises.forEach((exercise, exerciseIndex) => {
        const blocks = getExerciseBlocks(exercise);
        
        if (!exerciseMap.has(exercise.exerciseName)) {
          const muscleGroup = exercise.muscleGroup && exercise.muscleGroup !== 'Non specificato'
            ? exercise.muscleGroup
            : getMuscleGroupFromLibrary(exercise.exerciseName);
          
          exerciseMap.set(exercise.exerciseName, {
            exerciseName: exercise.exerciseName,
            muscleGroup,
            blocks: [],
          });
        }
        
        const exGroup = exerciseMap.get(exercise.exerciseName)!;
        
        // Aggiorna muscleGroup se migliore
        if (exGroup.muscleGroup === 'Non specificato') {
          if (exercise.muscleGroup && exercise.muscleGroup !== 'Non specificato') {
            exGroup.muscleGroup = exercise.muscleGroup;
          }
        }
        
        // Assicurati che ci siano abbastanza blocchi
        while (exGroup.blocks.length < blocks.length) {
          exGroup.blocks.push({
            exerciseName: exercise.exerciseName,
            blockIndex: exGroup.blocks.length,
            weekData: {},
            logData: {},
          });
        }
        
        // Popola i dati per questa settimana
        blocks.forEach((block, blockIndex) => {
          const blockRow = exGroup.blocks[blockIndex];
          
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
        });
      });
    });
    
    // Popola weekData mancanti con exists: false
    exerciseMap.forEach(exGroup => {
      exGroup.blocks.forEach(blockRow => {
        weekNumbers.forEach(weekNum => {
          if (!blockRow.weekData[weekNum]) {
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
          }
          if (!blockRow.logData[weekNum]) {
            blockRow.logData[weekNum] = { reps: '', loads: '', rpe: '', notes: '' };
          }
        });
      });
    });
    
    // Raggruppa per muscolo
    const muscleMap = new Map<string, ExerciseGroup[]>();
    exerciseMap.forEach(exGroup => {
      const mg = exGroup.muscleGroup;
      if (!muscleMap.has(mg)) {
        muscleMap.set(mg, []);
      }
      muscleMap.get(mg)!.push(exGroup);
    });
    
    // Converti in array finale
    const result: MuscleGroupData[] = [];
    muscleMap.forEach((exercises, muscleGroup) => {
      const totalBlocks = exercises.reduce((sum, ex) => sum + ex.blocks.length, 0);
      result.push({
        muscleGroup,
        color: getMuscleColor(muscleGroup),
        exercises,
        totalBlocks,
      });
    });
    
    return result.sort((a, b) => a.muscleGroup.localeCompare(b.muscleGroup));
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
    
    const newExercise: ProgramExercise = {
      exerciseName: libraryEx.name,
      exerciseType: libraryEx.type,
      muscleGroup,
      blocks: [createDefaultBlock(libraryEx.type)],
      notes: '',
    };
    
    selectedWeeksForNewExercise.forEach(weekNum => {
      const week = weeks[weekNum];
      const day = week?.days?.[selectedDayIndex];
      if (week && day) {
        const updatedDay = { ...day, exercises: [...day.exercises, newExercise] };
        const updatedWeek = {
          ...week,
          days: week.days.map((d, i) => i === selectedDayIndex ? updatedDay : d),
        };
        updateWeek(weekNum, updatedWeek);
      }
    });
    
    setNewExerciseName('');
    setNewExerciseMuscleGroup('');
    setSelectedWeeksForNewExercise([]);
    setShowAddExerciseDialog(false);
  };
  
  const toggleWeekSelection = (weekNum: number) => {
    setSelectedWeeksForNewExercise(prev => 
      prev.includes(weekNum) 
        ? prev.filter(w => w !== weekNum)
        : [...prev, weekNum]
    );
  };
  
  const hasLoggedSessions = (weekNum: number) =>
    loggedSessions.some((s) => s.weekNum === weekNum && s.programId === currentProgramId);
  
  const handleOpenConfigModal = (weekNum: number, blockRow: BlockRow) => {
    const weekData = blockRow.weekData[weekNum];
    if (weekData.exists && weekData.exercise) {
      setSelectedWeekNum(weekNum);
      setSelectedExerciseIndex(weekData.exerciseIndex);
      setSelectedBlockIndex(blockRow.blockIndex);
      setSelectedExercise(weekData.exercise);
      setCurrentWeek(weekNum);
      setConfigModalOpen(true);
    }
  };
  
  const handleOpenLogModal = (weekNum: number, blockRow: BlockRow) => {
    const weekData = blockRow.weekData[weekNum];
    if (weekData.exists) {
      setSelectedWeekNum(weekNum);
      setSelectedExerciseIndex(weekData.exerciseIndex);
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
          
          {/* Week Selector */}
          <div className="flex flex-wrap gap-2 items-center pt-2 border-t">
            <span className="text-sm font-medium mr-2 font-heading">Settimana:</span>
            {weekNumbers.map((weekNum) => (
              <Button
                key={weekNum}
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(weekNum)}
                className={currentWeek === weekNum 
                  ? 'lime-gradient text-black shadow-md' 
                  : 'bg-muted/50 border border-border text-foreground hover:bg-muted'}
              >
                W{weekNum}
                {hasLoggedSessions(weekNum) && <span className="ml-1">✓</span>}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddWeek} className="bg-black text-white border-black hover:bg-black/90">
              <Plus className="w-4 h-4 mr-1" />Nuova
            </Button>
            {weekNumbers.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => duplicateWeek(currentWeek)}>
                <Copy className="w-4 h-4 mr-1" />Duplica W{currentWeek}
              </Button>
            )}
            {weekNumbers.length > 1 && (
              <Button variant="outline" size="sm" onClick={() => deleteWeek(currentWeek)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-1" />Elimina W{currentWeek}
              </Button>
            )}
          </div>
          
          {/* Pulsante Aggiungi Esercizio */}
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={() => {
              setSelectedWeeksForNewExercise([...weekNumbers]);
              setShowAddExerciseDialog(true);
            }}>
              <Plus className="w-4 h-4 mr-1" />Aggiungi Esercizio
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="w-full overflow-auto max-h-[70vh] pb-24">
            <div className="inline-block min-w-max">
              <table className="table-auto border-collapse text-sm">
                <thead className="sticky top-0 z-20 bg-white">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold border-b border-r border-border bg-muted/50">
                      Gruppo
                    </th>
                    <th className="px-3 py-2 text-left font-semibold border-b border-r border-border bg-muted/50">
                      Esercizio
                    </th>
                    {weekNumbers.map((weekNum) => (
                      <th key={`header-${weekNum}`} colSpan={3} className="p-0 border-b border-border">
                        <div className="bg-primary/20 px-2 py-1.5 text-center font-bold border-b border-border text-xs">
                          WEEK {weekNum}
                        </div>
                        <div className="grid grid-cols-3">
                          <div className="p-1.5 text-center text-[10px] font-medium border-r border-border bg-muted/50">
                            REST / NOTE
                          </div>
                          <div className="p-1.5 text-center text-[10px] font-medium border-r border-border bg-white">
                            SCHEMA
                          </div>
                          <div className="p-1.5 text-center text-[10px] font-medium bg-amber-50">
                            RESOCONTO
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                {muscleGroupsData.map((mgData) => {
                  let muscleRowRendered = false;
                  
                  return mgData.exercises.map((exGroup) => {
                    let exerciseRowRendered = false;
                    
                    return exGroup.blocks.map((blockRow, blockIdx) => {
                      const showMuscleCell = !muscleRowRendered;
                      const showExerciseCell = !exerciseRowRendered;
                      
                      if (showMuscleCell) muscleRowRendered = true;
                      if (showExerciseCell) exerciseRowRendered = true;
                      
                      return (
                        <tr key={`${exGroup.exerciseName}-${blockIdx}`} className="hover:bg-muted/10">
                          {/* Gruppo Muscolare */}
                          {showMuscleCell && (
                            <td
                              rowSpan={mgData.totalBlocks}
                              className="p-2 font-bold text-xs border-b border-r border-border align-middle text-center"
                              style={{
                                backgroundColor: mgData.color,
                                color: getContrastTextColor(mgData.color),
                              }}
                            >
                              <span className="uppercase tracking-wide whitespace-pre-wrap">
                                {mgData.muscleGroup}
                              </span>
                            </td>
                          )}
                          
                          {/* Nome Esercizio */}
                          {showExerciseCell && (
                            <td
                              rowSpan={exGroup.blocks.length}
                              className="p-2 border-b border-r border-border bg-white align-middle"
                            >
                              <div className="font-medium text-sm whitespace-pre-wrap">{exGroup.exerciseName}</div>
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
                                    onClick={() => weekData.exists && handleOpenConfigModal(weekNum, blockRow)}
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
                                    onClick={() => weekData.exists && handleOpenLogModal(weekNum, blockRow)}
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
                    });
                  });
                })}
                
                {muscleGroupsData.length === 0 && (
                  <tr>
                    <td colSpan={2 + weekNumbers.length * 3} className="p-8 text-center text-muted-foreground">
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
