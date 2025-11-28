import { LoggedSession } from '@/types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { ChevronDown, ChevronUp, Pencil, Trash2, Video } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { getExerciseBlocks } from '@/lib/exerciseUtils';
import { calculateBlockTargetReps } from '@/lib/calculations';
import { adjustColor, getContrastTextColor } from '@/lib/colorUtils';
import { countVideosForSession } from '@/lib/videoService';

interface LoggedSessionCardProps {
  session: LoggedSession;
  groupedSessions?: LoggedSession[]; // Sessioni raggruppate dello stesso esercizio nello stesso giorno
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (selectedSession?: LoggedSession) => void;
  onDelete: () => void;
}

export function LoggedSessionCard({
  session,
  groupedSessions,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: LoggedSessionCardProps) {
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [videoCount, setVideoCount] = useState(0);
  const { getCurrentWeeks, exercises, getMuscleColor: resolveMuscleColor } = useApp();
  const { session: authSession } = useAuth();
  const weeks = getCurrentWeeks();
  const week = weeks[session.weekNum];
  const isAuthenticated = Boolean(authSession);
  
  // Carica conteggio video per la sessione
  useEffect(() => {
    if (isAuthenticated && session.id) {
      countVideosForSession(session.id).then(setVideoCount);
    }
  }, [session.id, isAuthenticated]);

  // Funzione per ottenere il blocco originale dalla scheda di allenamento
  const getOriginalBlock = (blockSession: LoggedSession) => {
    if (!week) return null;

    // Cerca l'esercizio nel programma
    for (const day of week.days) {
      const exercise = day.exercises.find(e => e.exerciseName === blockSession.exercise);
      if (exercise) {
        const blocks = getExerciseBlocks(exercise);
        const block = blocks[blockSession.blockIndex];
        return block || null;
      }
    }
    return null;
  };

  // Funzione per ottenere il targetReps corretto (ricalcola se è 0)
  const getTargetReps = (blockSession: LoggedSession): number => {
    // Se targetReps è già impostato e > 0, usalo
    if (blockSession.targetReps && blockSession.targetReps > 0) {
      return blockSession.targetReps;
    }

    // Altrimenti, ricalcola dal blocco originale
    const originalBlock = getOriginalBlock(blockSession);
    if (originalBlock) {
      return calculateBlockTargetReps(originalBlock);
    }

    // Fallback: usa il valore salvato anche se è 0
    return blockSession.targetReps || 0;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Funzione per ottenere il muscolo primario dall'esercizio
  const getPrimaryMuscleForExercise = (exerciseName: string) => {
    const libraryEx = exercises.find((e) => e.name === exerciseName);
    if (!libraryEx || !libraryEx.muscles || libraryEx.muscles.length === 0) return null;
    return libraryEx.muscles.reduce((prev, curr) =>
      curr.percent > prev.percent ? curr : prev
    );
  };

  // Per sessioni multiple, ogni blocco può avere muscolo diverso (ma di solito è lo stesso)
  const primaryMuscle = getPrimaryMuscleForExercise(session.exercise);

  const weekBadgeClass = 'bg-black text-white';

  const fallbackColor = '#6b7280';

  const resolveColor = (muscle?: string | null) => {
    if (!muscle) return fallbackColor;
    return resolveMuscleColor(muscle) || fallbackColor;
  };

  const getBadgeStyle = (baseColor: string, modifier = 0) => {
    const adjusted = modifier !== 0 ? adjustColor(baseColor, modifier) : baseColor;
    return {
      backgroundColor: adjusted,
      color: getContrastTextColor(adjusted),
    };
  };

  const getBlockStyleForMuscle = (muscle: string | null, blockIndex: number) => {
    const base = resolveColor(muscle);
    const shades = [0, -0.12, 0.18, -0.2, 0.14, -0.05, 0.24, -0.1];
    return getBadgeStyle(base, shades[blockIndex % shades.length]);
  };

  const getTechniqueStyleForMuscle = (muscle: string | null, technique: string) => {
    const base = resolveColor(muscle);
    const modifier = technique === 'Normale' ? 0.22 : -0.12;
    return getBadgeStyle(base, modifier);
  };

  const getBlockStyle = (blockIndex: number) =>
    getBlockStyleForMuscle(primaryMuscle?.muscle || null, blockIndex);

  const getTechniqueStyle = (technique: string) =>
    getTechniqueStyleForMuscle(primaryMuscle?.muscle || null, technique);

  const hasMultipleBlocks = groupedSessions && groupedSessions.length > 1;

  const handleEditClick = () => {
    if (hasMultipleBlocks && groupedSessions) {
      // Mostra dialog per scegliere il blocco
      setShowBlockSelector(true);
    } else {
      // Modifica direttamente la sessione singola
      onEdit();
    }
  };

  const handleBlockSelect = (selectedSession: LoggedSession) => {
    setShowBlockSelector(false);
    // Crea una funzione per modificare la sessione selezionata
    // Passa la sessione selezionata a onEdit
    onEdit(selectedSession);
  };

  // Group sets by setNum for techniques
  const uniqueSets = Array.from(new Set(session.sets.map(s => s.setNum)));
  const isSpecialTechnique = session.technique !== 'Normale';
  const isRampingTechnique = session.technique === 'Ramping';

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
      <Card className="w-full card-monetra">
        <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
          {/* Header - Always Visible */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 pb-1.5 sm:pb-2 border-b border-gray-100">
                <span className="text-xs sm:text-sm font-medium text-gray-600">
                  {formatDate(session.date)}
                </span>
                <span className={`px-1.5 sm:px-2 py-0.5 ${weekBadgeClass} text-[10px] sm:text-xs font-medium rounded`}>
                  W{session.weekNum}
                </span>
                {session.dayName && (
                  <span className="text-[10px] sm:text-xs text-gray-500">
                    • {session.dayName}
                  </span>
                )}
              </div>

              {primaryMuscle && (
                <div className="mb-1">
                  <span
                    className="inline-block px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded"
                    style={getBadgeStyle(resolveColor(primaryMuscle.muscle))}
                  >
                    {primaryMuscle.muscle}
                  </span>
                </div>
              )}

              <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2 truncate">
                {session.exercise}
                {hasMultipleBlocks && (
                  <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-muted-foreground">
                    ({groupedSessions.length} blocchi)
                  </span>
                )}
              </h3>

              {hasMultipleBlocks ? (
                <div className="space-y-2 mb-3">
                  {groupedSessions.map((blockSession, idx) => {
                    const blockUniqueSets = Array.from(new Set(blockSession.sets.map(s => s.setNum)));
                    const blockIsSpecial = blockSession.technique !== 'Normale';
                    const isRamping = blockSession.technique === 'Ramping';
                    const numSets = blockUniqueSets.length;

                    // Calcola reps target per set (per tecnica normale)
                    const targetRepsPerSet = blockSession.technique === 'Normale'
                      ? getTargetReps(blockSession) / numSets
                      : 0;

                    // Carichi pianificati
                    const targetLoadsStr = blockSession.targetLoads && blockSession.targetLoads.length > 0
                      ? blockSession.targetLoads.join('-')
                      : '-';

                    // Carichi effettivi per ogni set e cluster
                    const actualDataBySet = blockUniqueSets.map(setNum => {
                      const setData = blockSession.sets.filter(s => s.setNum === setNum);
                      const reps = blockIsSpecial
                        ? setData.map(s => s.reps || '0').join('+')
                        : setData[0]?.reps || '0';
                      const loads = blockIsSpecial
                        ? setData.map(s => parseFloat(s.load || '0').toFixed(0))
                        : [parseFloat(setData[0]?.load || '0').toFixed(0)];
                      return { reps, loads: loads, setNum };
                    });

                    // Carichi pianificati per set e cluster - prendili dal blocco originale della scheda
                    const originalBlock = getOriginalBlock(blockSession);
                    const targetLoadsBySet: string[][] = [];

                    if (originalBlock) {
                      // Usa i carichi dal blocco originale della scheda
                      if (originalBlock.targetLoadsByCluster && originalBlock.targetLoadsByCluster.length > 0) {
                        // Carichi per cluster disponibili
                        blockUniqueSets.forEach(setNum => {
                          const setLoads = originalBlock.targetLoadsByCluster![setNum - 1] ||
                            originalBlock.targetLoadsByCluster![originalBlock.targetLoadsByCluster!.length - 1] ||
                            [];
                          targetLoadsBySet.push(setLoads.length > 0 ? setLoads : ['0']);
                        });
                      } else if (originalBlock.targetLoads && originalBlock.targetLoads.length > 0) {
                        // Carichi normali (un carico per set)
                        blockUniqueSets.forEach(setNum => {
                          const loadForSet = originalBlock.targetLoads![setNum - 1] || originalBlock.targetLoads![0] || '0';
                          targetLoadsBySet.push([loadForSet]);
                        });
                      } else {
                        blockUniqueSets.forEach(() => targetLoadsBySet.push(['0']));
                      }
                    } else {
                      // Fallback: usa i carichi salvati nella sessione
                      if (blockSession.targetLoads && blockSession.targetLoads.length > 0) {
                        blockUniqueSets.forEach(setNum => {
                          const loadForSet = blockSession.targetLoads![setNum - 1] || blockSession.targetLoads![0] || '0';
                          // Se il carico contiene '/', significa che ci sono carichi diversi per cluster
                          if (loadForSet.includes('/')) {
                            targetLoadsBySet.push(loadForSet.split('/'));
                          } else {
                            targetLoadsBySet.push([loadForSet]);
                          }
                        });
                      } else {
                        blockUniqueSets.forEach(() => targetLoadsBySet.push(['0']));
                      }
                    }

                    // Verifica se ci sono carichi diversi tra i set o all'interno degli stessi set
                    const hasDifferentLoads = actualDataBySet.some((set, i) => {
                      const uniqueLoads = [...new Set(set.loads)];
                      return uniqueLoads.length > 1 ||
                        (targetLoadsBySet[i] && targetLoadsBySet[i].length > 0 &&
                          set.loads.some((load, idx) => load !== (targetLoadsBySet[i][idx] || targetLoadsBySet[i][0] || '0')));
                    });

                    const hasDifferentBetweenSets = actualDataBySet.length > 1 && (
                      actualDataBySet.some((set) => {
                        const firstSet = actualDataBySet[0];
                        return set.loads.length !== firstSet.loads.length ||
                          set.loads.some((load, idx) => load !== firstSet.loads[idx]);
                      })
                    );

                    // Se ci sono carichi diversi E la tecnica NON è Normale, mostra ogni set separatamente
                    // Per le tecniche Normali, usa sempre la visualizzazione compatta
                    if (blockIsSpecial && (hasDifferentLoads || hasDifferentBetweenSets)) {
                      return (
                        <div key={idx} className="w-full border border-gray-200 rounded-md p-3 bg-white">
                          <div className="flex items-center gap-2 text-xs mb-2 pb-2 border-b border-gray-100">
                            <span
                              className="px-2 py-0.5 rounded text-xs font-medium"
                              style={getBlockStyle(blockSession.blockIndex !== undefined ? blockSession.blockIndex : idx)}
                            >
                              B{blockSession.blockIndex !== undefined ? blockSession.blockIndex + 1 : idx + 1}
                            </span>
                            <span
                              className="px-2 py-0.5 rounded text-xs font-medium"
                              style={getTechniqueStyle(blockSession.technique)}
                            >
                              {blockSession.technique}
                            </span>
                            {blockSession.blockRest && idx < groupedSessions.length - 1 && (
                              <span className="text-xs text-gray-500 ml-auto">
                                rest: {blockSession.blockRest}s
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5">
                            {actualDataBySet.map((setData, setIdx) => {
                              const setDisplay = setIdx + 1;

                              // Target: carichi e reps dal programma originale
                              const targetLoadsForSet = targetLoadsBySet[setIdx] || [];

                              // Calcola reps target dal programma
                              let targetRepsStr = '';
                              if (originalBlock) {
                                if (blockIsSpecial && originalBlock.techniqueSchema) {
                                  // Tecnica speciale: usa lo schema (es. "10+10+10")
                                  targetRepsStr = originalBlock.techniqueSchema;
                                } else {
                                  // Tecnica normale: reps base
                                  targetRepsStr = targetRepsPerSet.toFixed(0);
                                }
                              } else {
                                // Fallback
                                targetRepsStr = blockIsSpecial ? blockSession.techniqueSchema || '' : targetRepsPerSet.toFixed(0);
                              }

                              // Formato carichi target per display
                              let targetLoadsStr = '-';
                              if (targetLoadsForSet.length > 0) {
                                if (blockIsSpecial) {
                                  // Per tecniche speciali: un carico per cluster
                                  if (targetLoadsForSet.length >= setData.loads.length) {
                                    targetLoadsStr = targetLoadsForSet.slice(0, setData.loads.length).join('-');
                                  } else {
                                    const fillValue = targetLoadsForSet[targetLoadsForSet.length - 1] || targetLoadsForSet[0] || '0';
                                    const filledLoads = [...targetLoadsForSet, ...Array(setData.loads.length - targetLoadsForSet.length).fill(fillValue)];
                                    targetLoadsStr = filledLoads.join('-');
                                  }
                                } else {
                                  targetLoadsStr = targetLoadsForSet[0] || '0';
                                }
                              }

                              // Eseguito: carichi e reps dal logbook (sessione effettiva)
                              const actualLoadsStr = setData.loads.join('-');
                              const actualRepsStr = setData.reps;

                              return (
                                <div
                                  key={setIdx}
                                  className="flex w-full flex-col gap-2 text-xs p-2 sm:flex-row sm:items-center sm:gap-2"
                                >
                                  <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium min-w-[3rem] text-center">
                                    S{setDisplay}
                                  </span>
                                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1.5">
                                    <div className="flex items-baseline gap-1">
                                      <span className="sm:hidden font-semibold text-gray-900">P:</span>
                                      <span className="hidden sm:inline text-gray-600">Programma:</span>
                                      <span className="font-medium text-gray-900">
                                        {targetRepsStr}
                                        {targetLoadsStr !== '-' && ` @ ${targetLoadsStr}kg`}
                                      </span>
                                    </div>
                                    <span className="hidden sm:inline text-gray-400">→</span>
                                    <div className="flex items-baseline gap-1">
                                      <span className="sm:hidden font-semibold text-gray-900">E:</span>
                                      <span className="hidden sm:inline text-gray-600">Eseguito:</span>
                                      <span className="font-semibold text-gray-900">
                                        {actualRepsStr} @ {actualLoadsStr}kg
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    // Altrimenti mostra la visualizzazione compatta originale
                    const actualLoadsBySet = actualDataBySet.map(set => set.loads[0]);
                    const actualRepsBySet = actualDataBySet.map(set => set.reps);

                    // Ottieni il muscolo per questo specifico blocco
                    const blockMuscle = getPrimaryMuscleForExercise(blockSession.exercise);

                    // Funzioni colore specifiche per questo blocco
                    const getBlockStyleForThis = (blockIdx: number) => {
                      return getBlockStyleForMuscle(blockMuscle?.muscle || null, blockIdx);
                    };

                    const getTechniqueStyleForThis = (technique: string) => {
                      return getTechniqueStyleForMuscle(blockMuscle?.muscle || null, technique);
                    };

                    return (
                      <div key={idx} className="w-full border border-gray-200 rounded-md p-3 bg-white">
                        <div className="flex items-center gap-2 text-xs mb-2 pb-2 border-b border-gray-100">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={getBlockStyleForThis(blockSession.blockIndex !== undefined ? blockSession.blockIndex : idx)}
                          >
                            B{blockSession.blockIndex !== undefined ? blockSession.blockIndex + 1 : idx + 1}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={getTechniqueStyleForThis(blockSession.technique)}
                          >
                            {blockSession.technique}
                          </span>
                          {blockSession.blockRest && idx < groupedSessions.length - 1 && (
                            <span className="text-xs text-gray-500 ml-auto">
                              rest: {blockSession.blockRest}s
                            </span>
                          )}
                        </div>
                        <div className="flex w-full flex-col gap-2 text-xs p-2 sm:flex-row sm:items-center sm:gap-2">
                          {!blockIsSpecial && (
                            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium min-w-[3rem] text-center">
                              S
                            </span>
                          )}
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1.5">
                            <div className="flex items-baseline gap-1">
                              <span className="sm:hidden font-semibold text-gray-900">P:</span>
                              <span className="hidden sm:inline text-gray-600">Programma:</span>
                              <span className="font-medium text-gray-900">
                                {isRamping ? (
                                  <>
                                    {originalBlock?.repsBase || '?'} reps → start {originalBlock?.startLoad || '?'}kg
                                    {originalBlock?.increment && ` +${originalBlock.increment}kg/set`} → RPE {originalBlock?.targetRPE || '?'}
                                  </>
                                ) : (
                                  <>
                                    {numSets}×{blockIsSpecial ? blockSession.techniqueSchema || '' : targetRepsPerSet.toFixed(0)}
                                    {targetLoadsStr !== '-' && ` @ ${targetLoadsStr}kg`}
                                  </>
                                )}
                              </span>
                            </div>
                            <span className="hidden sm:inline text-gray-400">→</span>
                            <div className="flex items-baseline gap-1">
                              <span className="sm:hidden font-semibold text-gray-900">E:</span>
                              <span className="hidden sm:inline text-gray-600">Eseguito:</span>
                              <span className="font-semibold text-gray-900">
                                {actualRepsBySet.map((reps, i) => (
                                  <span key={i}>
                                    {reps}@{actualLoadsBySet[i]}kg
                                    {i < actualRepsBySet.length - 1 && ' • '}
                                  </span>
                                ))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2 mb-3">
                  {isRampingTechnique ? (
                    // Tecnica Ramping: mostra informazioni speciali
                    <div className="w-full border border-amber-200 rounded-md p-3 bg-amber-50">
                      <div className="flex items-center gap-2 text-xs mb-2 pb-2 border-b border-amber-200">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium bg-amber-600 text-white"
                        >
                          Ramping
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex w-full flex-col gap-2 text-xs p-2 sm:flex-row sm:items-center sm:gap-2">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1.5 w-full">
                            <div className="flex items-baseline gap-1">
                              <span className="sm:hidden font-semibold text-gray-900">P:</span>
                              <span className="hidden sm:inline text-gray-600">Programma:</span>
                              <span className="font-medium text-gray-900">
                                {getOriginalBlock(session)?.repsBase || session.techniqueSchema || '?'} reps →
                                start {getOriginalBlock(session)?.startLoad || '?'}kg
                                {getOriginalBlock(session)?.increment && ` +${getOriginalBlock(session)!.increment}kg/set`} →
                                RPE {session.targetRPE || '?'}
                              </span>
                            </div>
                            <span className="hidden sm:inline text-gray-400">→</span>
                            <div className="flex items-baseline gap-1">
                              <span className="sm:hidden font-semibold text-gray-900">E:</span>
                              <span className="hidden sm:inline text-gray-600">Eseguito:</span>
                              <span className="font-semibold text-gray-900">
                                {uniqueSets.map((setNum, i) => {
                                  const setData = session.sets.filter(s => s.setNum === setNum);
                                  const repsDisplay = setData[0]?.reps || '0';
                                  const loadValue = parseFloat(setData[0]?.load || '0').toFixed(0);
                                  const rpeValue = setData[0]?.rpe || '';
                                  return (
                                    <span key={setNum}>
                                      {repsDisplay}@{loadValue}kg{rpeValue && ` (RPE ${rpeValue})`}
                                      {i < uniqueSets.length - 1 && ' • '}
                                    </span>
                                  );
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : isSpecialTechnique ? (
                    // Tecnica speciale: mostra set individuali
                    <div className="w-full border border-gray-200 rounded-md p-3 bg-white">
                      <div className="flex items-center gap-2 text-xs mb-2 pb-2 border-b border-gray-100">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={getTechniqueStyle(session.technique)}
                        >
                          {session.technique}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {uniqueSets.map((setNum) => {
                          const setData = session.sets.filter(s => s.setNum === setNum);
                          const repsDisplay = setData.map(s => s.reps || '0').join('+');
                          const loadValue = parseFloat(setData[0]?.load || '0').toFixed(0);
                          const targetLoadStr = session.targetLoads && session.targetLoads[setNum - 1]
                            ? session.targetLoads[setNum - 1]
                            : '-';

                          return (
                            <div
                              key={setNum}
                              className="flex w-full flex-col gap-2 text-xs p-2 sm:flex-row sm:items-center sm:gap-2"
                            >
                              <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium min-w-[3rem] text-center">
                                S{setNum}
                              </span>
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1.5">
                                <div className="flex items-baseline gap-1">
                                  <span className="sm:hidden font-semibold text-gray-900">P:</span>
                                  <span className="hidden sm:inline text-gray-600">Programma:</span>
                                  <span className="font-medium text-gray-900">
                                    {session.techniqueSchema}
                                    {targetLoadStr !== '-' && ` @ ${targetLoadStr}kg`}
                                  </span>
                                </div>
                                <span className="hidden sm:inline text-gray-400">→</span>
                                <div className="flex items-baseline gap-1">
                                  <span className="sm:hidden font-semibold text-gray-900">E:</span>
                                  <span className="hidden sm:inline text-gray-600">Eseguito:</span>
                                  <span className="font-semibold text-gray-900">
                                    {repsDisplay} @ {loadValue}kg
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    // Tecnica normale: visualizzazione compatta
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-muted-foreground font-medium">
                        {session.technique}
                      </span>
                    </div>
                  )}

                  {!isSpecialTechnique && (
                    <div className="flex w-full flex-col gap-2 text-xs p-2 sm:flex-row sm:items-center sm:gap-3">
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium min-w-[3rem] text-center">
                        S
                      </span>
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1.5">
                        <div className="flex items-baseline gap-1">
                          <span className="sm:hidden font-semibold text-gray-900">P:</span>
                          <span className="hidden sm:inline text-muted-foreground">Programma:</span>
                          <span className="font-medium text-gray-900 sm:text-current">
                            {uniqueSets.length}×{(getTargetReps(session) / uniqueSets.length).toFixed(0)}
                            {session.targetLoads && session.targetLoads.length > 0 &&
                              ` @ ${session.targetLoads.join('-')}kg`
                            }
                          </span>
                        </div>
                        <span className="hidden sm:inline text-muted-foreground">→</span>
                        <div className="flex items-baseline gap-1">
                          <span className="sm:hidden font-semibold text-gray-900">E:</span>
                          <span className="hidden sm:inline text-muted-foreground">Eseguito:</span>
                          <span className="font-medium text-gray-900 sm:text-current">
                            {uniqueSets.map((setNum, i) => {
                              const setData = session.sets.filter(s => s.setNum === setNum);
                              const repsDisplay = setData[0]?.reps || '0';
                              const loadValue = parseFloat(setData[0]?.load || '0').toFixed(0);
                              return (
                                <span key={setNum}>
                                  {repsDisplay}@{loadValue}kg
                                  {i < uniqueSets.length - 1 && ' • '}
                                </span>
                              );
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!hasMultipleBlocks && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    RPE Reale:{' '}
                    <span className="font-semibold text-gray-900">
                      {session.avgRPE?.toFixed(1)}
                    </span>
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-0.5 sm:gap-1 flex-shrink-0 self-end sm:self-start">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              {/* Video indicator */}
              {isAuthenticated && videoCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleEditClick} 
                  className="h-8 w-8 sm:h-10 sm:w-10 relative"
                  title={`${videoCount} video`}
                >
                  <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-[10px] text-black font-bold rounded-full flex items-center justify-center">
                    {videoCount}
                  </span>
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleEditClick} className="h-8 w-8 sm:h-10 sm:w-10">
                <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 sm:h-10 sm:w-10">
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
              </Button>
            </div>
          </div>

          {/* Expanded Content */}
          <CollapsibleContent>
            <div className="mt-3 sm:mt-6 pt-3 sm:pt-4 border-t space-y-3 sm:space-y-4">
              {hasMultipleBlocks ? (
                // Vista raggruppata con tutti i blocchi
                groupedSessions.map((blockSession, blockIdx) => {
                  const blockUniqueSets = Array.from(new Set(blockSession.sets.map(s => s.setNum)));
                  const blockIsSpecial = blockSession.technique !== 'Normale';
                  const isLastBlock = blockIdx === groupedSessions.length - 1;

                  return (
                    <div key={blockIdx} className="space-y-3 pb-3 border-b last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs sm:text-sm font-semibold">
                          Blocco {blockSession.blockIndex !== undefined ? blockSession.blockIndex + 1 : blockIdx + 1}: {blockSession.technique}
                        </h4>
                        {!isLastBlock && blockSession.blockRest && (
                          <span className="text-xs text-muted-foreground">
                            Rest dopo: {blockSession.blockRest}s
                          </span>
                        )}
                      </div>

                      {/* Session Details per blocco */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {blockSession.technique === 'Normale' && (
                          <div>
                            <div className="text-xs text-muted-foreground">Range</div>
                            <div className="font-medium">{blockSession.repRange}</div>
                          </div>
                        )}
                        <div>
                          <div className="text-xs text-muted-foreground">Reps Totali</div>
                          <div className="font-medium">
                            {blockSession.totalReps} / {getTargetReps(blockSession)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Coefficiente</div>
                          <div className="font-medium">{blockSession.coefficient}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">RPE Medio</div>
                          <div className="font-semibold text-gray-900">
                            {blockSession.avgRPE?.toFixed(1)}
                          </div>
                        </div>
                      </div>

                      {/* Sets Detail Table per blocco */}
                      <div>
                        <h5 className="text-[10px] sm:text-xs font-medium mb-2">Dettaglio Sets:</h5>
                        <div className="border rounded-lg overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="text-[10px] sm:text-xs">Set</TableHead>
                                {blockIsSpecial && (
                                  <TableHead className="text-[10px] sm:text-xs">Mini</TableHead>
                                )}
                                <TableHead className="text-[10px] sm:text-xs">Reps</TableHead>
                                <TableHead className="text-[10px] sm:text-xs">Target</TableHead>
                                <TableHead className="text-[10px] sm:text-xs">Load (kg)</TableHead>
                                <TableHead className="text-[10px] sm:text-xs">RPE</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {blockSession.sets.map((set, idx) => {
                                const targetReps = blockIsSpecial
                                  ? parseFloat(set.reps || '0')
                                  : getTargetReps(blockSession) / blockUniqueSets.length;
                                const actualReps = parseFloat(set.reps || '0');
                                const rpeValue = parseFloat(set.rpe || '0');
                                const isComplete = actualReps >= targetReps * 0.9;

                                return (
                                  <TableRow key={idx} className={isComplete ? '' : 'bg-red-50'}>
                                    <TableCell className="text-xs sm:text-sm font-medium">
                                      S{set.setNum}
                                    </TableCell>
                                    {blockIsSpecial && (
                                      <TableCell className="text-xs sm:text-sm text-muted-foreground">
                                        C{set.clusterNum}
                                      </TableCell>
                                    )}
                                    <TableCell className="text-xs sm:text-sm">
                                      {actualReps}
                                      {!isComplete && ' ⚠️'}
                                    </TableCell>
                                    <TableCell className="text-xs sm:text-sm text-muted-foreground">
                                      {targetReps}
                                    </TableCell>
                                    <TableCell className="text-xs sm:text-sm">
                                      {parseFloat(set.load || '0').toFixed(1)}
                                    </TableCell>
                                    <TableCell className="text-xs sm:text-sm font-semibold text-gray-900">
                                      {rpeValue.toFixed(1)}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      {/* Target Loads Info per blocco */}
                      {blockSession.targetLoads && blockSession.targetLoads.length > 0 && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Carichi pianificati: </span>
                          <span className="font-medium">{blockSession.targetLoads.join(' - ')} kg</span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                // Vista singola (comportamento originale)
                <>
                  {/* Session Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {session.technique === 'Normale' && (
                      <div>
                        <div className="text-xs text-muted-foreground">Range</div>
                        <div className="font-medium">{session.repRange}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-muted-foreground">Reps Totali</div>
                      <div className="font-medium">
                        {session.totalReps} / {getTargetReps(session)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Coefficiente</div>
                      <div className="font-medium">{session.coefficient}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">RPE Medio</div>
                      <div className="font-semibold text-gray-900">
                        {session.avgRPE?.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  {/* Sets Detail Table */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold mb-2">Dettaglio Sets:</h4>
                    <div className="border rounded-lg overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-[10px] sm:text-xs">Set</TableHead>
                            {isSpecialTechnique && (
                              <TableHead className="text-[10px] sm:text-xs">Mini</TableHead>
                            )}
                            <TableHead className="text-[10px] sm:text-xs">Reps</TableHead>
                            <TableHead className="text-[10px] sm:text-xs">Target</TableHead>
                            <TableHead className="text-[10px] sm:text-xs">Load (kg)</TableHead>
                            <TableHead className="text-[10px] sm:text-xs">RPE</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {session.sets.map((set, idx) => {
                            const targetReps = isSpecialTechnique
                              ? parseFloat(set.reps || '0')
                              : getTargetReps(session) / uniqueSets.length;
                            const actualReps = parseFloat(set.reps || '0');
                            const rpeValue = parseFloat(set.rpe || '0');
                            const isComplete = actualReps >= targetReps * 0.9;

                            return (
                              <TableRow key={idx} className={isComplete ? '' : 'bg-red-50'}>
                                <TableCell className="text-xs sm:text-sm font-medium">
                                  S{set.setNum}
                                </TableCell>
                                {isSpecialTechnique && (
                                  <TableCell className="text-xs sm:text-sm text-muted-foreground">
                                    C{set.clusterNum}
                                  </TableCell>
                                )}
                                <TableCell className="text-xs sm:text-sm">
                                  {actualReps}
                                  {!isComplete && ' ⚠️'}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm text-muted-foreground">
                                  {targetReps}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  {parseFloat(set.load || '0').toFixed(1)}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm font-semibold text-gray-900">
                                  {rpeValue.toFixed(1)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Target Loads Info */}
                  {session.targetLoads && session.targetLoads.length > 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Carichi pianificati: </span>
                      <span className="font-medium">{session.targetLoads.join(' - ')} kg</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>

      {/* Dialog per selezionare il blocco da modificare */}
      {hasMultipleBlocks && groupedSessions && (
        <Dialog open={showBlockSelector} onOpenChange={setShowBlockSelector}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Seleziona Blocco da Modificare</DialogTitle>
              <DialogDescription>
                Scegli quale blocco dell'esercizio {session.exercise} vuoi modificare
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              {groupedSessions.map((blockSession, idx) => {
                const blockUniqueSets = Array.from(new Set(blockSession.sets.map(s => s.setNum)));
                const blockIsSpecial = blockSession.technique !== 'Normale';
                const targetRepsPerSet = blockSession.technique === 'Normale'
                  ? getTargetReps(blockSession) / blockUniqueSets.length
                  : 0;
                const targetLoadsStr = blockSession.targetLoads && blockSession.targetLoads.length > 0
                  ? blockSession.targetLoads.join('-')
                  : '-';

                return (
                  <Button
                    key={idx}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => handleBlockSelect(blockSession)}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="font-semibold">
                        Blocco {blockSession.blockIndex !== undefined ? blockSession.blockIndex + 1 : idx + 1}: {blockSession.technique}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Programma: {blockUniqueSets.length}×{blockIsSpecial ? blockSession.techniqueSchema || '' : targetRepsPerSet.toFixed(0)}
                        {targetLoadsStr !== '-' && ` @ ${targetLoadsStr}kg`}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Collapsible>
  );
}
