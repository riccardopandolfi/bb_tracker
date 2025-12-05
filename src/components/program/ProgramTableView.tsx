import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { ExerciseBlock, LoggedSession, ProgramExercise, DEFAULT_TECHNIQUES, Day } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { getContrastTextColor, adjustColor } from '@/lib/colorUtils';
import { getExerciseBlocks, createDefaultBlock } from '@/lib/exerciseUtils';
import { ConfigureExerciseModal } from './ConfigureExerciseModal';
import { LogSessionModal } from './LogSessionModal';
import { Pencil, ClipboardList, Plus, Copy, Trash2 } from 'lucide-react';

// Genera la stringa dello schema per un blocco
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
  
  if (block.techniqueSchema) {
    return `${sets} x ${block.techniqueSchema}`;
  }
  
  return `${sets} x ${block.repsBase || '?'}`;
}

// Formatta i carichi per un blocco
function formatBlockLoads(block: ExerciseBlock): string {
  const technique = block.technique || 'Normale';
  
  if (technique === 'Ramping') {
    return block.startLoad || '-';
  }
  
  if (technique === 'Progressione a %' && block.percentageProgression) {
    return `1RM: ${block.percentageProgression.oneRepMax}kg`;
  }
  
  if (technique !== 'Normale' && block.targetLoadsByCluster && block.targetLoadsByCluster.length > 0) {
    return block.targetLoadsByCluster.map(sl => sl.join('/')).join('-');
  }
  
  if (block.targetLoads && block.targetLoads.length > 0) {
    const uniqueLoads = [...new Set(block.targetLoads)];
    if (uniqueLoads.length === 1) {
      return `${uniqueLoads[0]} kg`;
    }
    return block.targetLoads.join('-') + ' kg';
  }
  
  return '-';
}

// Formatta le note del blocco
function formatBlockNotes(block: ExerciseBlock): string {
  const parts: string[] = [];
  
  if (block.targetRPE) {
    parts.push(`RPE ${block.targetRPE}`);
  }
  
  if (block.coefficient && block.coefficient !== 1) {
    parts.push(`Coeff ${block.coefficient}`);
  }
  
  return parts.join('\n');
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

// Chiave unica per un esercizio (nome + blocco)
interface ExerciseKey {
  exerciseName: string;
  blockIndex: number;
  muscleGroup: string;
}

// Dati per settimana di un esercizio
interface WeekExerciseData {
  exists: boolean;
  exerciseIndex: number;
  exercise?: ProgramExercise;
  block?: ExerciseBlock;
  rest: number;
  schema: string;
  loads: string;
  notes: string;
}

// Dati di log per settimana
interface WeekLogData {
  reps: string;
  loads: string;
  rpe: string;
  notes: string;
  session?: LoggedSession;
}

// Riga della tabella
interface TableRow {
  key: ExerciseKey;
  weekData: Record<number, WeekExerciseData>;
  logData: Record<number, WeekLogData>;
}

export function ProgramTableView() {
  const { 
    getCurrentProgram, 
    getCurrentWeeks, 
    loggedSessions,
    getMuscleColor,
    exercises: exerciseLibrary,
    customTechniques,
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
  
  // Dialog per aggiungere giorno
  const [showAddDayDialog, setShowAddDayDialog] = useState(false);
  const [newDayName, setNewDayName] = useState('');
  
  // Funzione per ottenere il gruppo muscolare dalla libreria se non specificato
  const getMuscleGroupFromLibrary = (exerciseName: string): string => {
    const libraryExercise = exerciseLibrary.find(ex => ex.name === exerciseName);
    if (libraryExercise?.muscles && libraryExercise.muscles.length > 0) {
      // Prendi il muscolo con la percentuale più alta
      const primaryMuscle = libraryExercise.muscles.reduce((prev, curr) => 
        curr.percent > prev.percent ? curr : prev
      );
      return primaryMuscle.muscle;
    }
    return 'Non specificato';
  };
  
  // Handler per aggiungere settimana
  const handleAddWeek = () => {
    const newWeekNum = Math.max(...weekNumbers, 0) + 1;
    addWeek(newWeekNum);
  };
  
  // Handler per duplicare settimana
  const handleDuplicateWeek = (weekNum: number) => {
    duplicateWeek(weekNum);
  };
  
  // Handler per eliminare settimana
  const handleDeleteWeek = (weekNum: number) => {
    deleteWeek(weekNum);
  };
  
  // Handler per aggiungere giorno a TUTTE le settimane
  const handleAddDay = () => {
    if (!newDayName.trim()) {
      alert('Inserisci un nome per il giorno');
      return;
    }
    
    const newDay: Day = {
      name: newDayName.trim(),
      exercises: [],
    };
    
    // Aggiungi il giorno a tutte le settimane
    weekNumbers.forEach(weekNum => {
      const week = weeks[weekNum];
      if (week) {
        const updatedWeek = {
          ...week,
          days: [...week.days, newDay],
        };
        updateWeek(weekNum, updatedWeek);
      }
    });
    
    // Seleziona il nuovo giorno
    const firstWeek = weeks[weekNumbers[0]];
    if (firstWeek) {
      setSelectedDayIndex(firstWeek.days.length); // Sarà il nuovo indice dopo l'aggiunta
    }
    
    setNewDayName('');
    setShowAddDayDialog(false);
  };
  
  // Verifica se una settimana ha sessioni loggate
  const hasLoggedSessions = (weekNum: number) =>
    loggedSessions.some((s) => s.weekNum === weekNum && s.programId === currentProgramId);
  
  // Modal states
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedWeekNum, setSelectedWeekNum] = useState<number | null>(null);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ProgramExercise | null>(null);
  
  // Ottieni i giorni disponibili (unione di tutti i giorni da tutte le settimane)
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
  
  // Costruisci un registry di TUTTI gli esercizi da TUTTE le settimane per il giorno selezionato
  const tableRows = useMemo((): TableRow[] => {
    if (!program || weekNumbers.length === 0) return [];
    
    // Mappa: "exerciseName|blockIndex" -> dati
    const exerciseRegistry = new Map<string, TableRow>();
    
    // Prima passata: raccogli tutti gli esercizi unici
    weekNumbers.forEach(weekNum => {
      const week = weeks[weekNum];
      const day = week?.days?.[selectedDayIndex];
      if (!day) return;
      
      day.exercises.forEach((exercise) => {
        const blocks = getExerciseBlocks(exercise);
        
        blocks.forEach((_, blockIndex) => {
          const keyStr = `${exercise.exerciseName}|${blockIndex}`;
          
          if (!exerciseRegistry.has(keyStr)) {
            // Determina il gruppo muscolare: prima da exercise.muscleGroup, poi dalla libreria
            const muscleGroup = exercise.muscleGroup && exercise.muscleGroup !== 'Non specificato'
              ? exercise.muscleGroup
              : getMuscleGroupFromLibrary(exercise.exerciseName);
            
            exerciseRegistry.set(keyStr, {
              key: {
                exerciseName: exercise.exerciseName,
                blockIndex,
                muscleGroup,
              },
              weekData: {},
              logData: {},
            });
          } else {
            // Aggiorna muscleGroup se quello esistente è "Non specificato" e questo ha un valore
            const row = exerciseRegistry.get(keyStr)!;
            if (row.key.muscleGroup === 'Non specificato') {
              if (exercise.muscleGroup && exercise.muscleGroup !== 'Non specificato') {
                row.key.muscleGroup = exercise.muscleGroup;
              } else {
                const fromLibrary = getMuscleGroupFromLibrary(exercise.exerciseName);
                if (fromLibrary !== 'Non specificato') {
                  row.key.muscleGroup = fromLibrary;
                }
              }
            }
          }
        });
      });
    });
    
    // Seconda passata: popola i dati per ogni settimana
    weekNumbers.forEach(weekNum => {
      const week = weeks[weekNum];
      const day = week?.days?.[selectedDayIndex];
      
      exerciseRegistry.forEach((row, keyStr) => {
        const [exerciseName, blockIndexStr] = keyStr.split('|');
        const blockIndex = parseInt(blockIndexStr, 10);
        
        // Trova l'esercizio in questa settimana
        const exerciseIndex = day?.exercises.findIndex(ex => ex.exerciseName === exerciseName) ?? -1;
        const exercise = exerciseIndex >= 0 ? day?.exercises[exerciseIndex] : undefined;
        const blocks = exercise ? getExerciseBlocks(exercise) : [];
        const block = blocks[blockIndex];
        
        if (exercise && block) {
          row.weekData[weekNum] = {
            exists: true,
            exerciseIndex,
            exercise,
            block,
            rest: block.rest || 0,
            schema: formatBlockSchema(block),
            loads: formatBlockLoads(block),
            notes: formatBlockNotes(block),
          };
        } else {
          row.weekData[weekNum] = {
            exists: false,
            exerciseIndex: -1,
            rest: 0,
            schema: '-',
            loads: '-',
            notes: '',
          };
        }
        
        // Trova log
        const session = loggedSessions.find(
          s => s.programId === program.id &&
               s.weekNum === weekNum &&
               s.exercise === exerciseName &&
               s.blockIndex === blockIndex &&
               s.dayIndex === selectedDayIndex
        );
        
        const formatted = formatLoggedSession(session);
        row.logData[weekNum] = { ...formatted, session };
      });
    });
    
    // Converti in array e ordina per gruppo muscolare
    return Array.from(exerciseRegistry.values()).sort((a, b) => {
      if (a.key.muscleGroup !== b.key.muscleGroup) {
        return a.key.muscleGroup.localeCompare(b.key.muscleGroup);
      }
      return a.key.exerciseName.localeCompare(b.key.exerciseName);
    });
  }, [program, weeks, weekNumbers, selectedDayIndex, loggedSessions]);
  
  // Raggruppa per gruppo muscolare
  const groupedRows = useMemo(() => {
    const groups: { muscleGroup: string; rows: TableRow[]; color: string }[] = [];
    const groupMap = new Map<string, TableRow[]>();
    
    tableRows.forEach(row => {
      const group = row.key.muscleGroup;
      if (!groupMap.has(group)) {
        groupMap.set(group, []);
      }
      groupMap.get(group)!.push(row);
    });
    
    groupMap.forEach((rows, muscleGroup) => {
      groups.push({
        muscleGroup,
        rows,
        color: getMuscleColor(muscleGroup),
      });
    });
    
    return groups;
  }, [tableRows, getMuscleColor]);
  
  // Handler per aprire il modal di configurazione
  const handleOpenConfigModal = (weekNum: number, row: TableRow) => {
    const weekData = row.weekData[weekNum];
    if (weekData.exists && weekData.exercise) {
      setSelectedWeekNum(weekNum);
      setSelectedExerciseIndex(weekData.exerciseIndex);
      setSelectedBlockIndex(row.key.blockIndex);
      setSelectedExercise(weekData.exercise);
      setCurrentWeek(weekNum);
      setConfigModalOpen(true);
    }
  };
  
  // Handler per aprire il modal di log
  const handleOpenLogModal = (weekNum: number, row: TableRow) => {
    const weekData = row.weekData[weekNum];
    if (weekData.exists) {
      setSelectedWeekNum(weekNum);
      setSelectedExerciseIndex(weekData.exerciseIndex);
      setSelectedBlockIndex(row.key.blockIndex);
      setCurrentWeek(weekNum);
      setLogModalOpen(true);
    }
  };
  
  // Handler per aggiornare l'esercizio dal modal
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
  
  // Handler per aggiornare un blocco
  const handleUpdateBlock = (blockIndex: number, field: keyof ExerciseBlock, value: any) => {
    if (selectedWeekNum === null || selectedExerciseIndex === null || !selectedExercise) return;
    
    const blocks = [...(selectedExercise.blocks || [])];
    blocks[blockIndex] = { ...blocks[blockIndex], [field]: value };
    
    handleUpdateExercise('blocks', blocks);
  };
  
  // Handler per aggiornamento batch di un blocco
  const handleUpdateBlockBatch = (blockIndex: number, updates: Partial<ExerciseBlock>) => {
    if (selectedWeekNum === null || selectedExerciseIndex === null || !selectedExercise) return;
    
    const blocks = [...(selectedExercise.blocks || [])];
    blocks[blockIndex] = { ...blocks[blockIndex], ...updates };
    
    handleUpdateExercise('blocks', blocks);
  };
  
  // Handler per aggiungere un blocco
  const handleAddBlock = () => {
    if (!selectedExercise) return;
    
    const newBlock = createDefaultBlock(selectedExercise.exerciseType || 'resistance');
    const blocks = [...(selectedExercise.blocks || []), newBlock];
    
    handleUpdateExercise('blocks', blocks);
  };
  
  // Handler per eliminare un blocco
  const handleDeleteBlock = (blockIndex: number) => {
    if (!selectedExercise) return;
    
    let blocks = (selectedExercise.blocks || []).filter((_, i) => i !== blockIndex);
    if (blocks.length === 0) {
      blocks = [createDefaultBlock(selectedExercise.exerciseType || 'resistance')];
    }
    
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddDayDialog(true)}
                title="Aggiungi giorno"
              >
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
                className={`relative ${currentWeek === weekNum 
                  ? 'lime-gradient text-black shadow-md' 
                  : 'bg-muted/50 border border-border text-foreground hover:bg-muted'}`}
              >
                W{weekNum}
                {hasLoggedSessions(weekNum) && (
                  <span className="ml-1">✓</span>
                )}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddWeek}
              className="bg-black text-white border-black hover:bg-black/90"
            >
              <Plus className="w-4 h-4 mr-1" />
              Nuova
            </Button>
            {weekNumbers.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDuplicateWeek(currentWeek)}
              >
                <Copy className="w-4 h-4 mr-1" />
                Duplica W{currentWeek}
              </Button>
            )}
            {weekNumbers.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteWeek(currentWeek)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Elimina W{currentWeek}
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse min-w-max text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="p-3 text-left font-semibold border-b border-r border-border" style={{ minWidth: '120px' }}>
                    Gruppo
                  </th>
                  <th className="p-3 text-left font-semibold border-b border-r border-border" style={{ minWidth: '180px' }}>
                    Esercizio
                  </th>
                  {/* Colonne per ogni settimana: REST | WEEK | RESOCONTO */}
                  {weekNumbers.map((weekNum) => (
                    <th key={`header-${weekNum}`} colSpan={3} className="p-0 border-b border-border">
                      <div className="bg-primary/20 px-3 py-2 text-center font-bold border-b border-border">
                        WEEK {weekNum}
                      </div>
                      <div className="grid grid-cols-3">
                        <div className="p-2 text-center text-xs font-medium border-r border-border bg-muted/50">
                          REST
                        </div>
                        <div className="p-2 text-center text-xs font-medium border-r border-border bg-white">
                          SCHEMA
                        </div>
                        <div className="p-2 text-center text-xs font-medium bg-amber-50">
                          LOG
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupedRows.map((group) => (
                  group.rows.map((row, rowIndex) => (
                    <tr key={`${row.key.exerciseName}-${row.key.blockIndex}`} className="hover:bg-muted/20">
                      {/* Gruppo Muscolare - con rowSpan */}
                      {rowIndex === 0 && (
                        <td
                          rowSpan={group.rows.length}
                          className="p-3 font-bold text-xs border-b border-r border-border align-middle"
                          style={{
                            backgroundColor: group.color,
                            color: getContrastTextColor(group.color),
                            minWidth: '120px',
                          }}
                        >
                          <span className="uppercase tracking-wide">
                            {group.muscleGroup}
                          </span>
                        </td>
                      )}
                      
                      {/* Nome Esercizio */}
                      <td className="p-3 border-b border-r border-border bg-white" style={{ minWidth: '180px' }}>
                        <div className="font-medium text-sm">{row.key.exerciseName}</div>
                        {row.key.blockIndex > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Blocco {row.key.blockIndex + 1}
                          </div>
                        )}
                      </td>
                      
                      {/* Colonne per ogni settimana */}
                      {weekNumbers.map((weekNum) => {
                        const weekData = row.weekData[weekNum];
                        const logData = row.logData[weekNum];
                        const hasLog = Boolean(logData?.reps);
                        
                        return (
                          <td key={`data-${weekNum}`} colSpan={3} className="p-0 border-b border-border">
                            <div className="grid grid-cols-3">
                              {/* REST */}
                              <div className="p-2 text-center border-r border-border bg-muted/30 text-xs">
                                {weekData.exists ? (weekData.rest || '-') : '-'}
                              </div>
                              
                              {/* SCHEMA - Clickable */}
                              <div 
                                className={`p-2 border-r border-border bg-white ${weekData.exists ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                                style={{ minWidth: '140px' }}
                                onClick={() => weekData.exists && handleOpenConfigModal(weekNum, row)}
                              >
                                {weekData.exists ? (
                                  <div className="space-y-0.5">
                                    <div className="font-semibold text-xs text-gray-900 flex items-center gap-1">
                                      {weekData.schema}
                                      <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                                    </div>
                                    {weekData.loads && weekData.loads !== '-' && (
                                      <div className="text-[11px] text-gray-600">{weekData.loads}</div>
                                    )}
                                    {weekData.notes && (
                                      <div className="text-[10px] text-muted-foreground whitespace-pre-line">{weekData.notes}</div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground italic text-xs">-</span>
                                )}
                              </div>
                              
                              {/* LOG - Clickable */}
                              <div 
                                className={`p-2 ${weekData.exists ? 'cursor-pointer hover:opacity-80' : ''}`}
                                style={{ 
                                  ...(hasLog ? resocontoFilledStyle : resocontoEmptyStyle),
                                  minWidth: '140px',
                                }}
                                onClick={() => weekData.exists && handleOpenLogModal(weekNum, row)}
                              >
                                {hasLog ? (
                                  <div className="space-y-0.5 text-xs">
                                    <div className="font-semibold">{logData.reps}</div>
                                    {logData.loads && <div className="text-[11px]">{logData.loads}</div>}
                                    {logData.rpe && <div className="text-[11px]">{logData.rpe}</div>}
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
                  ))
                ))}
                
                {tableRows.length === 0 && (
                  <tr>
                    <td colSpan={2 + weekNumbers.length * 3} className="p-8 text-center text-muted-foreground">
                      Nessun esercizio in questo giorno
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
            <DialogDescription>
              Il nuovo giorno verrà aggiunto a tutte le settimane del programma.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="day-name">Nome Giorno</Label>
              <Input
                id="day-name"
                value={newDayName}
                onChange={(e) => setNewDayName(e.target.value)}
                placeholder="es. Push, Pull, Legs, Upper, Lower..."
                className="mt-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddDay();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDayDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleAddDay}>
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
