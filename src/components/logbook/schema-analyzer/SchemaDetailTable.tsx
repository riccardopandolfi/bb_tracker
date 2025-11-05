import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { LoggedSession } from '@/types';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getExerciseBlocks } from '@/lib/exerciseUtils';

interface SchemaDetailTableProps {
  sessions: LoggedSession[];
  mode: 'normal' | 'special';
}

export function SchemaDetailTable({ sessions, mode }: SchemaDetailTableProps) {
  const { getCurrentWeeks } = useApp();
  const weeks = getCurrentWeeks();

  // Get original block for session from program
  const getOriginalBlock = (session: LoggedSession) => {
    // Mappa weekNum al week index del programma
    // Programma 999 (PPL): weekNum 1-8 → weeks[1-8]
    // Programma 998 (Upper/Lower): weekNum 9-16 → weeks[1-8]
    let weekIndex = session.weekNum;
    if (session.programId === 998 && session.weekNum > 8) {
      weekIndex = ((session.weekNum - 9) % 8) + 1; // 9→1, 10→2, ..., 16→8
    }

    const week = weeks[weekIndex];
    if (!week) return null;

    for (const day of week.days) {
      const exercise = day.exercises.find((e: any) => e.exerciseName === session.exercise);
      if (exercise) {
        const blocks = getExerciseBlocks(exercise);
        const block = blocks[session.blockIndex];
        return block || null;
      }
    }
    return null;
  };

  const [isExpanded, setIsExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'week'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Sort sessions
  const sortedSessions = [...sessions].sort((a, b) => {
    if (sortBy === 'date') {
      const comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortOrder === 'asc' ? comparison : -comparison;
    } else {
      const comparison = a.weekNum - b.weekNum;
      return sortOrder === 'asc' ? comparison : -comparison;
    }
  });

  const handleSort = (field: 'date' | 'week') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-3 border rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">
          Dettaglio Sessioni ({sessions.length})
        </h4>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              Nascondi <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Mostra <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Table */}
      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left p-2 font-semibold">#</th>
                <th
                  className="text-left p-2 font-semibold cursor-pointer hover:bg-secondary/80"
                  onClick={() => handleSort('date')}
                >
                  Data {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-left p-2 font-semibold cursor-pointer hover:bg-secondary/80"
                  onClick={() => handleSort('week')}
                >
                  Week {sortBy === 'week' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left p-2 font-semibold">Set</th>
                <th className="text-left p-2 font-semibold">Programma</th>
                <th className="text-left p-2 font-semibold">Eseguito</th>
                <th className="text-left p-2 font-semibold">RPE</th>
              </tr>
            </thead>
            <tbody>
              {sortedSessions.map((session, sessionIndex) => {
                // Group sets by setNum
                const setGroups = new Map<number, typeof session.sets>();
                session.sets.forEach(set => {
                  if (!setGroups.has(set.setNum)) {
                    setGroups.set(set.setNum, []);
                  }
                  setGroups.get(set.setNum)!.push(set);
                });

                return Array.from(setGroups.entries()).map(([setNum, sets], setIndex) => {
                  const isFirstSet = setIndex === 0;

                  return sets.map((set, clusterIndex) => {
                    const isFirstCluster = clusterIndex === 0;
                    const showSessionInfo = isFirstSet && isFirstCluster;

                    // Get target values from PROGRAM, not from logged session
                    const originalBlock = getOriginalBlock(session);

                    // Target load from program
                    let targetLoad = '?';
                    if (originalBlock) {
                      if (originalBlock.targetLoadsByCluster && originalBlock.targetLoadsByCluster.length > 0) {
                        const setLoads = originalBlock.targetLoadsByCluster[set.setNum - 1] ||
                          originalBlock.targetLoadsByCluster[originalBlock.targetLoadsByCluster.length - 1] ||
                          [];
                        if (set.clusterNum && setLoads.length >= set.clusterNum) {
                          targetLoad = setLoads[set.clusterNum - 1] || '?';
                        } else if (setLoads.length > 0) {
                          targetLoad = setLoads[0] || '?';
                        }
                      } else if (originalBlock.targetLoads && originalBlock.targetLoads.length > 0) {
                        targetLoad = originalBlock.targetLoads[set.setNum - 1] || originalBlock.targetLoads[0] || '?';
                      }
                    }

                    // Target reps from program
                    let targetRepsPerSet: string | number = '?';
                    if (originalBlock) {
                      if (originalBlock.technique === 'Normale') {
                        targetRepsPerSet = parseFloat(originalBlock.repsBase || '0');
                      } else if (originalBlock.techniqueSchema) {
                        const clusters = originalBlock.techniqueSchema.split('+').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
                        if (set.clusterNum && clusters.length >= set.clusterNum) {
                          targetRepsPerSet = clusters[set.clusterNum - 1] || '?';
                        } else if (clusters.length > 0) {
                          targetRepsPerSet = clusters[0] || '?';
                        }
                      }
                    }

                    const programText = `${targetLoad}kg x ${targetRepsPerSet}`;
                    const actualText = `${set.load}kg x ${set.reps}`;

                    const setLabel = mode === 'normal'
                      ? `${setNum}`
                      : `${setNum}.${set.clusterNum}`;

                    return (
                      <tr
                        key={`${session.date}-${set.setNum}-${set.clusterNum || 0}`}
                        className="border-t hover:bg-secondary/30"
                      >
                        {/* Session number (only first row) */}
                        {showSessionInfo && (
                          <td className="p-2 font-medium" rowSpan={session.sets.length}>
                            {sessionIndex + 1}
                          </td>
                        )}

                        {/* Date (only first row) */}
                        {showSessionInfo && (
                          <td className="p-2" rowSpan={session.sets.length}>
                            {format(new Date(session.date), 'dd/MM/yy')}
                          </td>
                        )}

                        {/* Week (only first row) */}
                        {showSessionInfo && (
                          <td className="p-2" rowSpan={session.sets.length}>
                            {session.weekNum}
                          </td>
                        )}

                        {/* Set number */}
                        <td className="p-2 font-mono">{setLabel}</td>

                        {/* Programma */}
                        <td className="p-2 text-blue-600">{programText}</td>

                        {/* Eseguito */}
                        <td className="p-2 text-green-600">{actualText}</td>

                        {/* RPE */}
                        <td className="p-2">
                          {set.rpe ? (
                            <span className="inline-block bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                              {set.rpe}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  });
                });
              })}
            </tbody>
          </table>

          {sessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs">
              Nessuna sessione da mostrare
            </div>
          )}
        </div>
      )}
    </div>
  );
}
