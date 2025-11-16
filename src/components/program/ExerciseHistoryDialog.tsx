import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { CheckCircle2, Minus, ChevronDown } from 'lucide-react';
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
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());

  if (!program) {
    return null;
  }

  const toggleWeek = (weekNum: number) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekNum)) {
      newExpanded.delete(weekNum);
    } else {
      newExpanded.add(weekNum);
    }
    setExpandedWeeks(newExpanded);
  };

  // Helper per colori distintivi per ogni blocco
  const getBlockColor = (blockIndex: number) => {
    const colors = [
      { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
      { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
      { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
      { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
      { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
    ];
    return colors[blockIndex % colors.length];
  };

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
        const blockColor = getBlockColor(idx);
        return (
          <div key={idx} className={`text-sm p-2 rounded-md border ${blockColor.bg} ${blockColor.border}`}>
            {exercise.blocks.length > 1 && (
              <span className={`font-semibold ${blockColor.text}`}>B{idx + 1}: </span>
            )}
            {duration} min
          </div>
        );
      });
    }

    // Per resistance training - mostra tutti i blocchi
    return exercise.blocks.map((block, idx) => {
      const sets = block.sets || 0;
      const technique = block.technique || 'Normale';
      const isNormal = technique === 'Normale';
      const loads = block.targetLoads && block.targetLoads.length > 0 ? block.targetLoads : [];
      const blockColor = getBlockColor(idx);
      const techniqueStr = technique !== 'Normale' ? ` - ${technique}` : '';

      let displayStr = '';

      if (isNormal) {
        // Tecnica normale
        let repsStr = '-';
        if (block.targetReps && block.targetReps.length > 0) {
          repsStr = block.targetReps.join(', ');
        } else {
          repsStr = block.repsBase || block.repRange || '-';
        }

        let loadStr = '-';
        if (loads.length > 0) {
          loadStr = `${loads.join(', ')}kg`;
        }

        if (block.targetReps && block.targetReps.length > 0) {
          displayStr = `${repsStr} reps @ ${loadStr}`;
        } else {
          displayStr = `${sets}x${repsStr} @ ${loadStr}`;
        }
      } else {
        // Tecnica speciale: mostra lo schema dettagliato
        const schema = block.techniqueSchema || '-';

        // Gestisci targetLoadsByCluster per tecniche speciali
        if (block.targetLoadsByCluster && block.targetLoadsByCluster.length > 0) {
          const loadStrings = block.targetLoadsByCluster.map(setLoads => setLoads.join('/')).join(', ');
          displayStr = `${sets}x${schema} @ ${loadStrings}kg`;
        } else if (loads.length > 0) {
          const loadStr = loads.join(', ');
          displayStr = `${sets}x${schema} @ ${loadStr}kg`;
        } else {
          displayStr = `${sets}x${schema} @ -`;
        }
      }

      return (
        <div key={idx} className={`text-sm space-y-1 p-2 rounded-md border mb-2 ${blockColor.bg} ${blockColor.border}`}>
          <div>
            {exercise.blocks.length > 1 && (
              <span className={`font-semibold ${blockColor.text}`}>B{idx + 1}: </span>
            )}
            {displayStr}{techniqueStr}
          </div>
          {block.notes && (
            <div className="text-xs text-muted-foreground italic pl-2 border-l-2 border-gray-400">
              Note: {block.notes}
            </div>
          )}
        </div>
      );
    });
  };

  // Funzione per formattare i dati eseguiti
  const formatExecutedData = (sessions: LoggedSession[]) => {
    if (sessions.length === 0) return '-';

    // Ordina le sessioni per blockIndex per mantenere l'ordine corretto
    const sortedSessions = [...sessions].sort((a, b) => a.blockIndex - b.blockIndex);

    return sortedSessions.map((session, idx) => {
      const blockColor = getBlockColor(session.blockIndex);
      const technique = session.technique || 'Normale';
      const techniqueStr = technique !== 'Normale' ? ` - ${technique}` : '';
      const isNormal = technique === 'Normale';

      let repsStr = '';
      let loadStr = '';
      let rpeStr = '';

      if (isNormal) {
        // Tecnica normale: mostra tutte le reps e i carichi separati da virgola
        const reps = session.sets.map((s) => s.reps);
        const loads = session.sets.map((s) => s.load);
        const rpes = session.sets.map((s) => s.rpe);

        repsStr = reps.join(', ');
        loadStr = `${loads.join(', ')}kg`;

        // Mostra RPE solo se almeno un set ha RPE inserito
        const hasAnyRPE = rpes.some(rpe => rpe && rpe.trim() !== '');
        rpeStr = hasAnyRPE
          ? `(RPE ${rpes.map(rpe => rpe && rpe.trim() !== '' ? rpe : '-').join(', ')})`
          : '';
      } else {
        // Tecnica speciale: raggruppa per setNum per mostrare i cluster
        const setGroups: Record<number, typeof session.sets> = {};
        session.sets.forEach(set => {
          if (!setGroups[set.setNum]) {
            setGroups[set.setNum] = [];
          }
          setGroups[set.setNum].push(set);
        });

        const setStrings: string[] = [];
        const loadStrings: string[] = [];
        const rpeStrings: string[] = [];

        Object.values(setGroups).forEach(clusters => {
          // Per ogni set, mostra i cluster separati da '+'
          const clusterReps = clusters.map(c => c.reps).join('+');
          const clusterLoads = clusters.map(c => c.load).join('/');
          const clusterRpes = clusters.map(c => c.rpe);

          setStrings.push(`(${clusterReps})`);
          loadStrings.push(clusterLoads);

          const hasRPE = clusterRpes.some(rpe => rpe && rpe.trim() !== '');
          if (hasRPE) {
            rpeStrings.push(`(${clusterRpes.map(rpe => rpe && rpe.trim() !== '' ? rpe : '-').join('+')})`);
          } else {
            rpeStrings.push('-');
          }
        });

        repsStr = setStrings.join(', ');
        loadStr = `${loadStrings.join(', ')}kg`;

        const hasAnyRPE = rpeStrings.some(rpe => rpe !== '-');
        rpeStr = hasAnyRPE ? `(RPE ${rpeStrings.join(', ')})` : '';
      }

      return (
        <div key={idx} className={`text-sm space-y-1 p-2 rounded-md border mb-2 ${blockColor.bg} ${blockColor.border}`}>
          <div>
            {sessions.length > 1 && (
              <span className={`font-semibold ${blockColor.text}`}>B{session.blockIndex + 1}: </span>
            )}
            {repsStr} reps @ {loadStr} {rpeStr}{techniqueStr}
          </div>
          {session.notes && (
            <div className="text-xs text-muted-foreground italic pl-2 border-l-2 border-gray-400">
              Note: {session.notes}
            </div>
          )}
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

        <div className="space-y-2 py-4">
          {weekNumbers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessuna settimana trovata nel programma
            </div>
          ) : (
            weekNumbers.map((weekNum) => {
              const programmedExercise = findProgrammedExercise(weekNum);
              const sessions = sessionsByWeek[weekNum] || [];
              const completionStatus = getCompletionStatus(weekNum);
              const isExpanded = expandedWeeks.has(weekNum);

              const StatusIcon = completionStatus.icon;

              return (
                <Collapsible key={weekNum} open={isExpanded} onOpenChange={() => toggleWeek(weekNum)}>
                  <Card className="border-l-4" style={{ borderLeftColor:
                    completionStatus.status === 'completed' ? '#22c55e' : '#9ca3af'
                  }}>
                    <CardContent className="pt-3 pb-3">
                      {/* Header collapsible */}
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-md transition-colors">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="font-bold">
                              W{weekNum}
                            </Badge>
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`w-4 h-4 ${completionStatus.color}`} />
                              <span className={`text-xs font-medium ${completionStatus.color}`}>
                                {completionStatus.label}
                              </span>
                            </div>
                          </div>
                          <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} />
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="mt-3 space-y-3">
                          {/* Layout mobile-friendly */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Programmato */}
                            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-200">
                              <div className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wide">
                                Programmato
                              </div>
                              <div className="font-mono">
                                {programmedExercise ? formatProgrammedData(programmedExercise) : '-'}
                              </div>
                            </div>

                            {/* Eseguito */}
                            <div className="bg-green-50/50 p-3 rounded-lg border border-green-200">
                              <div className="text-xs font-semibold text-green-900 mb-2 uppercase tracking-wide">
                                Eseguito
                              </div>
                              <div className="font-mono">
                                {formatExecutedData(sessions)}
                              </div>
                            </div>
                          </div>

                          {/* Note sessioni */}
                          {sessions.length > 0 && sessions.some(s => s.blockRest) && (
                            <div className="pt-2 border-t text-xs text-muted-foreground italic">
                              {sessions.map((s, idx) => s.blockRest && (
                                <div key={idx}>Blocco {s.blockIndex + 1}: rest {s.blockRest}s</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </CardContent>
                  </Card>
                </Collapsible>
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
