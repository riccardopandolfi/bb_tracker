import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { ExerciseBlock, LoggedSession } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getContrastTextColor, adjustColor } from '@/lib/colorUtils';

// Genera la stringa dello schema per un blocco (es. "3 x 12-10-8" o "3 x 8/10")
function formatBlockSchema(block: ExerciseBlock): string {
  const sets = block.sets || 0;
  const technique = block.technique || 'Normale';
  
  // Per tecnica Ramping
  if (technique === 'Ramping') {
    const startLoad = block.startLoad || '?';
    const increment = block.increment ? `+${block.increment}` : '';
    return `Ramping ${block.repsBase || '?'}@${startLoad}${increment}`;
  }
  
  // Per Progressione a %
  if (technique === 'Progressione a %' && block.percentageProgression) {
    const prog = block.percentageProgression;
    const week1 = prog.weeks?.[0];
    if (week1 && week1.blocks.length > 0) {
      const firstBlock = week1.blocks[0];
      return `${firstBlock.sets}x${firstBlock.reps} @${firstBlock.percentage}%`;
    }
  }
  
  // Per tecnica normale con reps personalizzate
  if (technique === 'Normale') {
    if (block.targetReps && block.targetReps.length > 0) {
      return `${sets} x ${block.targetReps.join('-')}`;
    }
    return `${sets} x ${block.repsBase || '?'}`;
  }
  
  // Per tecniche speciali (Rest-Pause, Myo-Reps, etc.)
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
    // Per tecniche speciali mostra i carichi per cluster
    return block.targetLoadsByCluster.map(sl => sl.join('/')).join(' • ');
  }
  
  if (block.targetLoads && block.targetLoads.length > 0) {
    // Controlla se tutti i carichi sono uguali
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

interface ExerciseRowData {
  exerciseName: string;
  muscleGroup: string;
  exerciseIndex: number;
  blockIndex: number;
  rest: number;
  weekData: {
    weekNum: number;
    schema: string;
    loads: string;
    notes: string;
    rest: number;
    block?: ExerciseBlock;
  }[];
  loggedData: {
    weekNum: number;
    reps: string;
    loads: string;
    rpe: string;
    notes: string;
    session?: LoggedSession;
  }[];
}

export function ProgramTableView() {
  const { 
    getCurrentProgram, 
    getCurrentWeeks, 
    loggedSessions,
    getMuscleColor 
  } = useApp();
  
  const program = getCurrentProgram();
  const weeks = getCurrentWeeks();
  const weekNumbers = Object.keys(weeks).map(Number).sort((a, b) => a - b);
  
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  
  // Ottieni i giorni disponibili dal primo giorno con dati
  const availableDays = useMemo(() => {
    if (weekNumbers.length === 0) return [];
    const firstWeek = weeks[weekNumbers[0]];
    return firstWeek?.days || [];
  }, [weeks, weekNumbers]);
  
  // Costruisci i dati delle righe per il giorno selezionato
  const rowsData = useMemo((): ExerciseRowData[] => {
    if (!program || availableDays.length === 0) return [];
    
    const rows: ExerciseRowData[] = [];
    const day = availableDays[selectedDayIndex];
    if (!day) return [];
    
    day.exercises.forEach((exercise, exerciseIndex) => {
      const blocks = exercise.blocks || [];
      
      blocks.forEach((block, blockIndex) => {
        const weekData: ExerciseRowData['weekData'] = [];
        const loggedData: ExerciseRowData['loggedData'] = [];
        
        weekNumbers.forEach((weekNum) => {
          const weekExercises = weeks[weekNum]?.days[selectedDayIndex]?.exercises || [];
          const weekExercise = weekExercises[exerciseIndex];
          const weekBlock = weekExercise?.blocks?.[blockIndex];
          
          if (weekBlock) {
            weekData.push({
              weekNum,
              schema: formatBlockSchema(weekBlock),
              loads: formatBlockLoads(weekBlock),
              notes: formatBlockNotes(weekBlock),
              rest: weekBlock.rest || block.rest || 0,
              block: weekBlock,
            });
          } else {
            weekData.push({
              weekNum,
              schema: '-',
              loads: '-',
              notes: '',
              rest: block.rest || 0,
            });
          }
          
          // Trova la sessione loggata per questo esercizio/blocco/settimana
          const session = loggedSessions.find(
            s => s.programId === program.id &&
                 s.weekNum === weekNum &&
                 s.exercise === exercise.exerciseName &&
                 s.blockIndex === blockIndex &&
                 s.dayIndex === selectedDayIndex
          );
          
          const formatted = formatLoggedSession(session);
          loggedData.push({
            weekNum,
            ...formatted,
            session,
          });
        });
        
        rows.push({
          exerciseName: exercise.exerciseName,
          muscleGroup: exercise.muscleGroup || 'Non specificato',
          exerciseIndex,
          blockIndex,
          rest: block.rest || 0,
          weekData,
          loggedData,
        });
      });
    });
    
    return rows;
  }, [program, weeks, weekNumbers, selectedDayIndex, loggedSessions, availableDays]);
  
  // Raggruppa le righe per gruppo muscolare
  const groupedRows = useMemo(() => {
    const groups: { muscleGroup: string; rows: ExerciseRowData[]; color: string }[] = [];
    const groupMap = new Map<string, ExerciseRowData[]>();
    
    rowsData.forEach(row => {
      const group = row.muscleGroup;
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
  }, [rowsData, getMuscleColor]);
  
  if (!program || weekNumbers.length === 0) {
    return (
      <Card className="card-monetra">
        <CardContent className="py-8 text-center text-muted-foreground">
          Nessun programma o settimana disponibile
        </CardContent>
      </Card>
    );
  }
  
  // Stile per le celle resoconto (colorate in magenta chiaro)
  const resocontoFilledStyle = {
    backgroundColor: adjustColor('#d946ef', 0.85),
    color: '#831843',
  };
  
  const resocontoEmptyStyle = {
    backgroundColor: '#fef3c7', // amber-100
  };
  
  return (
    <Card className="card-monetra">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="font-heading text-lg">Vista Tabellare</CardTitle>
          
          {/* Selettore Giorno */}
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
                {availableDays.map((day, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {day.name || `Giorno ${index + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse min-w-max text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="p-3 text-left font-semibold border-b border-r border-border sticky left-0 bg-muted/50 z-10">
                  Gruppo
                </th>
                <th className="p-3 text-left font-semibold border-b border-r border-border sticky left-[150px] bg-muted/50 z-10">
                  Esercizio
                </th>
                {weekNumbers.map((weekNum) => (
                  <th key={`rest-${weekNum}`} colSpan={1} className="p-3 text-center font-semibold border-b border-r border-border bg-muted">
                    REST
                  </th>
                ))}
                {weekNumbers.map((weekNum) => (
                  <th key={`week-${weekNum}`} colSpan={1} className="p-3 text-center font-semibold border-b border-r border-border bg-primary/10">
                    WEEK {weekNum}
                  </th>
                ))}
                {weekNumbers.map((weekNum) => (
                  <th key={`resoconto-${weekNum}`} colSpan={1} className="p-3 text-center font-semibold border-b border-r border-border bg-amber-50">
                    RESOCONTO
                  </th>
                ))}
              </tr>
              {/* Seconda riga header per chiarire la struttura */}
              <tr className="bg-muted/30 text-xs">
                <th className="p-2 border-b border-r border-border sticky left-0 bg-muted/30 z-10"></th>
                <th className="p-2 border-b border-r border-border sticky left-[150px] bg-muted/30 z-10"></th>
                {weekNumbers.map((weekNum) => (
                  <th key={`rest-sub-${weekNum}`} className="p-2 text-center border-b border-r border-border text-muted-foreground">
                    W{weekNum}
                  </th>
                ))}
                {weekNumbers.map((weekNum) => (
                  <th key={`week-sub-${weekNum}`} className="p-2 text-center border-b border-r border-border text-muted-foreground">
                    Schema
                  </th>
                ))}
                {weekNumbers.map((weekNum) => (
                  <th key={`res-sub-${weekNum}`} className="p-2 text-center border-b border-r border-border text-muted-foreground">
                    W{weekNum}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedRows.map((group) => (
                group.rows.map((row, rowIndex) => (
                  <tr key={`${row.exerciseName}-${row.blockIndex}`} className="hover:bg-muted/20">
                    {/* Gruppo Muscolare - con rowSpan */}
                    {rowIndex === 0 && (
                      <td
                        rowSpan={group.rows.length}
                        className="p-3 font-bold text-sm border-b border-r border-border align-middle sticky left-0 z-10"
                        style={{
                          backgroundColor: group.color,
                          color: getContrastTextColor(group.color),
                          minWidth: '150px',
                          maxWidth: '150px',
                        }}
                      >
                        <span className="uppercase tracking-wide text-xs">
                          {group.muscleGroup}
                        </span>
                      </td>
                    )}
                    
                    {/* Nome Esercizio */}
                    <td className="p-3 border-b border-r border-border sticky left-[150px] bg-white z-10" style={{ minWidth: '200px' }}>
                      <div className="font-medium">{row.exerciseName}</div>
                      {row.blockIndex > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Blocco {row.blockIndex + 1}
                        </div>
                      )}
                    </td>
                    
                    {/* REST per ogni settimana */}
                    {weekNumbers.map((weekNum, weekIndex) => (
                      <td key={`rest-${weekNum}`} className="p-3 text-center border-b border-r border-border bg-muted/30" style={{ minWidth: '80px' }}>
                        {row.weekData[weekIndex]?.rest || row.rest || '-'}
                      </td>
                    ))}
                    
                    {/* WEEK - Schema per ogni settimana */}
                    {weekNumbers.map((weekNum, weekIndex) => {
                      const weekData = row.weekData[weekIndex];
                      return (
                        <td key={`week-${weekNum}`} className="p-3 border-b border-r border-border bg-white" style={{ minWidth: '200px' }}>
                          <div className="space-y-1">
                            <div className="font-semibold text-gray-900">
                              {weekData?.schema || '-'}
                            </div>
                            {weekData?.loads && weekData.loads !== '-' && (
                              <div className="text-gray-600 text-xs">
                                {weekData.loads}
                              </div>
                            )}
                            {weekData?.notes && (
                              <div className="text-muted-foreground whitespace-pre-line text-[11px] leading-tight">
                                {weekData.notes}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    
                    {/* RESOCONTO per ogni settimana */}
                    {weekNumbers.map((weekNum, weekIndex) => {
                      const loggedData = row.loggedData[weekIndex];
                      const hasData = loggedData?.reps;
                      
                      return (
                        <td 
                          key={`res-${weekNum}`} 
                          className="p-3 border-b border-r border-border"
                          style={{ 
                            ...(hasData ? resocontoFilledStyle : resocontoEmptyStyle),
                            minWidth: '200px' 
                          }}
                        >
                          {hasData ? (
                            <div className="space-y-0.5 text-xs">
                              <div className="font-semibold">{loggedData.reps}</div>
                              {loggedData.loads && (
                                <div>{loggedData.loads}</div>
                              )}
                              {loggedData.rpe && (
                                <div>{loggedData.rpe}</div>
                              )}
                              {loggedData.notes && (
                                <div className="text-[10px] opacity-80">{loggedData.notes}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ))}
              
              {rowsData.length === 0 && (
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
  );
}
