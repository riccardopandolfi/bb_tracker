import { useApp } from '@/contexts/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { CheckCircle2, Minus } from 'lucide-react';
import { LoggedSession, ProgramExercise } from '@/types';

interface ExerciseHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseName: string;
  programId: number;
}

export function ExerciseHistoryDialog({
  open,
  onOpenChange,
  exerciseName,
  programId,
}: ExerciseHistoryDialogProps) {
  const { programs, loggedSessions, currentWeek } = useApp();
  const program = programs[programId];

  if (!program) {
    return null;
  }

  // Ottieni tutte le settimane del programma precedenti alla settimana corrente
  const weekNumbers = Object.keys(program.weeks)
    .map(Number)
    .filter((weekNum) => weekNum < currentWeek)
    .sort((a, b) => a - b);

  // Filtra le sessioni loggat per questo esercizio e programma
  const exerciseSessions = loggedSessions.filter(
    (session) => session.programId === programId && session.exercise === exerciseName
  );

  // Raggruppa le sessioni per settimana
  const sessionsByWeek = exerciseSessions.reduce((acc, session) => {
    if (!acc[session.weekNum]) {
      acc[session.weekNum] = [];
    }
    acc[session.weekNum].push(session);
    return acc;
  }, {} as Record<number, LoggedSession[]>);

  // Funzione per trovare l'esercizio programmato in una settimana
  const findProgrammedExercise = (weekNum: number): ProgramExercise | null => {
    const week = program.weeks[weekNum];
    if (!week) return null;

    for (const day of week.days) {
      const exercise = day.exercises.find((ex) => ex.exerciseName === exerciseName);
      if (exercise) return exercise;
    }
    return null;
  };

  // Funzione per ottenere lo stato di completamento
  const getCompletionStatus = (weekNum: number) => {
    const sessions = sessionsByWeek[weekNum] || [];

    if (sessions.length > 0) {
      return { status: 'completed', icon: CheckCircle2, color: 'text-green-500', label: 'Completato' };
    }

    return { status: 'not-done', icon: Minus, color: 'text-gray-400', label: '-' };
  };

  // Funzione per formattare i dati programmati
  const formatProgrammedData = (exercise: ProgramExercise) => {
    if (exercise.exerciseType === 'cardio') {
      return exercise.blocks.map((block, idx) => {
        const duration = block.duration || 0;
        return (
          <div key={idx} className="text-sm">
            {exercise.blocks.length > 1 && <span className="text-muted-foreground">B{idx + 1}: </span>}
            {duration} min
          </div>
        );
      });
    }

    // Per resistance training - mostra tutti i blocchi
    return exercise.blocks.map((block, idx) => {
      const sets = block.sets || 0;
      const reps = block.repsBase || block.repRange || '-';
      const technique = block.technique || 'Normale';
      const loads = block.targetLoads && block.targetLoads.length > 0 ? block.targetLoads : [];

      let loadStr = '-';
      if (loads.length > 0) {
        // Mostra tutti i carichi separati da virgola
        loadStr = `${loads.join(', ')}kg`;
      }

      const techniqueStr = technique !== 'Normale' ? ` (${technique})` : '';

      return (
        <div key={idx} className="text-sm">
          {exercise.blocks.length > 1 && <span className="text-muted-foreground">B{idx + 1}: </span>}
          {sets}x{reps} @ {loadStr}{techniqueStr}
        </div>
      );
    });
  };

  // Funzione per formattare i dati eseguiti
  const formatExecutedData = (sessions: LoggedSession[]) => {
    if (sessions.length === 0) return '-';

    return sessions.map((session, idx) => {
      const totalSets = session.sets.length;
      const totalReps = session.totalReps;
      const avgRPE = session.avgRPE.toFixed(1);
      const loads = session.sets.map((s) => s.load);
      // Mostra tutti i carichi separati da virgola
      const loadStr = `${loads.join(', ')}kg`;

      return (
        <div key={idx} className="text-sm">
          {sessions.length > 1 && <span className="text-muted-foreground">B{session.blockIndex + 1}: </span>}
          {totalSets}x{Math.round(totalReps / totalSets)} @ {loadStr} (RPE {avgRPE})
        </div>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Storico Progressione: {exerciseName}</DialogTitle>
          <DialogDescription>
            Visualizza settimana per settimana cosa era programmato vs cosa hai eseguito
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {weekNumbers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessuna settimana trovata nel programma
            </div>
          ) : (
            weekNumbers.map((weekNum) => {
              const programmedExercise = findProgrammedExercise(weekNum);
              const sessions = sessionsByWeek[weekNum] || [];
              const completionStatus = getCompletionStatus(weekNum);

              const StatusIcon = completionStatus.icon;

              return (
                <Card key={weekNum} className="border-l-4" style={{ borderLeftColor:
                  completionStatus.status === 'completed' ? '#22c55e' : '#9ca3af'
                }}>
                  <CardContent className="pt-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                      {/* Settimana */}
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-bold">
                            W{weekNum}
                          </Badge>
                        </div>
                      </div>

                      {/* Programmato */}
                      <div className="md:col-span-4">
                        <div className="text-xs text-muted-foreground mb-1 font-medium">Programmato</div>
                        <div className="text-sm font-mono">
                          {programmedExercise ? formatProgrammedData(programmedExercise) : '-'}
                        </div>
                      </div>

                      {/* Eseguito */}
                      <div className="md:col-span-4">
                        <div className="text-xs text-muted-foreground mb-1 font-medium">Eseguito</div>
                        <div className="font-mono">
                          {formatExecutedData(sessions)}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="md:col-span-2 flex items-center justify-end gap-2">
                        <StatusIcon className={`w-5 h-5 ${completionStatus.color}`} />
                        <span className={`text-xs font-medium ${completionStatus.color}`}>
                          {completionStatus.label}
                        </span>
                      </div>
                    </div>

                    {/* Note sessioni */}
                    {sessions.length > 0 && sessions.some(s => s.blockRest) && (
                      <div className="mt-2 pt-2 border-t text-xs text-muted-foreground italic">
                        {sessions.map((s, idx) => s.blockRest && (
                          <div key={idx}>Blocco {s.blockIndex + 1}: rest {s.blockRest}s</div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {exerciseSessions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
            Nessuna sessione loggata per questo esercizio
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
