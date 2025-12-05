import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { ExerciseBlock, LoggedSession } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TableViewRow } from './TableViewRow';

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
  
  if (block.technique && block.technique !== 'Normale') {
    parts.push(block.technique);
  }
  
  if (block.targetRPE) {
    parts.push(`RPE ${block.targetRPE}`);
  }
  
  if (block.coefficient && block.coefficient !== 1) {
    parts.push(`Coeff ${block.coefficient}`);
  }
  
  if (block.notes) {
    parts.push(block.notes);
  }
  
  return parts.join('\n');
}

// Formatta il resoconto di una sessione loggata
function formatLoggedSession(session: LoggedSession | undefined): string {
  if (!session) return '';
  
  const reps = session.sets.map(s => s.reps).join('-');
  const loads = session.sets.map(s => s.load).join('-');
  
  let result = reps;
  if (loads && loads !== '-') {
    result += `\n${loads} kg`;
  }
  
  if (session.avgRPE) {
    result += `\nRPE ${session.avgRPE.toFixed(1)}`;
  }
  
  if (session.notes) {
    result += `\n${session.notes}`;
  }
  
  return result;
}

interface ExerciseRowData {
  exerciseName: string;
  muscleGroup: string;
  exerciseIndex: number;
  blocks: {
    blockIndex: number;
    rest: number;
    weekData: {
      weekNum: number;
      schema: string;
      loads: string;
      notes: string;
      block?: ExerciseBlock;
    }[];
    loggedData: {
      weekNum: number;
      resoconto: string;
      session?: LoggedSession;
    }[];
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
        const weekData: ExerciseRowData['blocks'][0]['weekData'] = [];
        const loggedData: ExerciseRowData['blocks'][0]['loggedData'] = [];
        
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
              block: weekBlock,
            });
          } else {
            weekData.push({
              weekNum,
              schema: '-',
              loads: '-',
              notes: '',
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
          
          loggedData.push({
            weekNum,
            resoconto: formatLoggedSession(session),
            session,
          });
        });
        
        rows.push({
          exerciseName: exercise.exerciseName,
          muscleGroup: exercise.muscleGroup || 'Non specificato',
          exerciseIndex,
          blocks: [{
            blockIndex,
            rest: block.rest || 0,
            weekData,
            loggedData,
          }],
        });
      });
    });
    
    return rows;
  }, [program, weeks, weekNumbers, selectedDayIndex, loggedSessions, availableDays]);
  
  // Raggruppa le righe per gruppo muscolare
  const groupedRows = useMemo(() => {
    const groups: Record<string, ExerciseRowData[]> = {};
    
    rowsData.forEach(row => {
      const group = row.muscleGroup;
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(row);
    });
    
    return groups;
  }, [rowsData]);
  
  if (!program || weekNumbers.length === 0) {
    return (
      <Card className="card-monetra">
        <CardContent className="py-8 text-center text-muted-foreground">
          Nessun programma o settimana disponibile
        </CardContent>
      </Card>
    );
  }
  
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
              <SelectTrigger className="w-[180px]">
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
          <div className="min-w-max">
            {/* Header della tabella */}
            <div className="grid border-b border-border bg-muted/50 sticky top-0 z-10"
                 style={{ 
                   gridTemplateColumns: `150px 200px ${weekNumbers.map(() => '80px 200px 200px').join(' ')}` 
                 }}>
              <div className="p-3 font-semibold text-sm border-r border-border">
                Gruppo
              </div>
              <div className="p-3 font-semibold text-sm border-r border-border">
                Esercizio
              </div>
              {weekNumbers.map((weekNum) => (
                <div key={weekNum} className="contents">
                  <div className="p-3 font-semibold text-sm border-r border-border text-center bg-muted">
                    REST
                  </div>
                  <div className="p-3 font-semibold text-sm border-r border-border text-center bg-primary/10">
                    WEEK {weekNum}
                  </div>
                  <div className="p-3 font-semibold text-sm border-r border-border text-center bg-amber-50">
                    RESOCONTO
                  </div>
                </div>
              ))}
            </div>
            
            {/* Corpo della tabella */}
            {Object.entries(groupedRows).map(([muscleGroup, rows]) => (
              <div key={muscleGroup}>
                {rows.map((row, rowIndex) => (
                  <TableViewRow
                    key={`${row.exerciseName}-${row.blocks[0]?.blockIndex || 0}-${rowIndex}`}
                    row={row}
                    weekNumbers={weekNumbers}
                    muscleColor={getMuscleColor(muscleGroup)}
                    isFirstInGroup={rowIndex === 0}
                    groupRowCount={rows.length}
                  />
                ))}
              </div>
            ))}
            
            {rowsData.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Nessun esercizio in questo giorno
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

