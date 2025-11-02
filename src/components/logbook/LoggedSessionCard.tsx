import { LoggedSession } from '@/types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { getExerciseBlocks } from '@/lib/exerciseUtils';
import { calculateBlockTargetReps } from '@/lib/calculations';
import { MUSCLE_COLORS } from '@/lib/constants';

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
  const { getCurrentWeeks, exercises } = useApp();
  const weeks = getCurrentWeeks();
  const week = weeks[session.weekNum];
  
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

  const getWeekColor = (weekNum: number): string => {
    const colors = [
      'bg-emerald-700 text-white',  // W1 - Emerald
      'bg-teal-700 text-white',     // W2 - Teal
      'bg-cyan-700 text-white',     // W3 - Cyan
      'bg-sky-700 text-white',      // W4 - Sky
      'bg-blue-700 text-white',     // W5 - Blue
      'bg-indigo-700 text-white',   // W6 - Indigo
      'bg-violet-700 text-white',   // W7 - Violet
      'bg-purple-700 text-white',   // W8 - Purple
    ];
    return colors[(weekNum - 1) % colors.length];
  };

  // Funzioni helper per ottenere colori basati sul muscolo
  const getBlockColorForMuscle = (muscle: string | null, blockIndex: number): string => {
    if (!muscle) return 'bg-gray-500 text-white';
    
    const shadeIndex = blockIndex % 8;
    const shades = ['400', '500', '600', '500', '400', '500', '600', '500'];
    const shade = shades[shadeIndex];
    
    const colorMap: Record<string, Record<string, string>> = {
      'Petto': {
        '400': 'bg-red-400 text-white',
        '500': 'bg-red-500 text-white',
        '600': 'bg-red-600 text-white',
      },
      'Dorso - Lats': {
        '400': 'bg-blue-400 text-white',
        '500': 'bg-blue-500 text-white',
        '600': 'bg-blue-600 text-white',
      },
      'Dorso - Upper Back': {
        '400': 'bg-blue-400 text-white',
        '500': 'bg-blue-500 text-white',
        '600': 'bg-blue-600 text-white',
      },
      'Dorso - Trapezi': {
        '400': 'bg-blue-400 text-white',
        '500': 'bg-blue-500 text-white',
        '600': 'bg-blue-600 text-white',
      },
      'Deltoidi - Anteriore': {
        '400': 'bg-orange-400 text-white',
        '500': 'bg-orange-500 text-white',
        '600': 'bg-orange-600 text-white',
      },
      'Deltoidi - Laterale': {
        '400': 'bg-orange-400 text-white',
        '500': 'bg-orange-500 text-white',
        '600': 'bg-orange-600 text-white',
      },
      'Deltoidi - Posteriore': {
        '400': 'bg-orange-400 text-white',
        '500': 'bg-orange-500 text-white',
        '600': 'bg-orange-600 text-white',
      },
      'Bicipiti': {
        '400': 'bg-purple-400 text-white',
        '500': 'bg-purple-500 text-white',
        '600': 'bg-purple-600 text-white',
      },
      'Tricipiti': {
        '400': 'bg-pink-400 text-white',
        '500': 'bg-pink-500 text-white',
        '600': 'bg-pink-600 text-white',
      },
      'Avambracci': {
        '400': 'bg-purple-400 text-white',
        '500': 'bg-purple-500 text-white',
        '600': 'bg-purple-600 text-white',
      },
      'Quadricipiti': {
        '400': 'bg-green-400 text-white',
        '500': 'bg-green-500 text-white',
        '600': 'bg-green-600 text-white',
      },
      'Femorali': {
        '400': 'bg-green-400 text-white',
        '500': 'bg-green-500 text-white',
        '600': 'bg-green-600 text-white',
      },
      'Glutei': {
        '400': 'bg-green-400 text-white',
        '500': 'bg-green-500 text-white',
        '600': 'bg-green-600 text-white',
      },
      'Polpacci': {
        '400': 'bg-green-400 text-white',
        '500': 'bg-green-500 text-white',
        '600': 'bg-green-600 text-white',
      },
      'Adduttori': {
        '400': 'bg-teal-400 text-white',
        '500': 'bg-teal-500 text-white',
        '600': 'bg-teal-600 text-white',
      },
      'Abduttori': {
        '400': 'bg-teal-400 text-white',
        '500': 'bg-teal-500 text-white',
        '600': 'bg-teal-600 text-white',
      },
      'Addome': {
        '400': 'bg-yellow-400 text-white',
        '500': 'bg-yellow-500 text-white',
        '600': 'bg-yellow-600 text-white',
      },
      'Obliqui': {
        '400': 'bg-yellow-400 text-white',
        '500': 'bg-yellow-500 text-white',
        '600': 'bg-yellow-600 text-white',
      },
      'Core': {
        '400': 'bg-yellow-400 text-white',
        '500': 'bg-yellow-500 text-white',
        '600': 'bg-yellow-600 text-white',
      },
    };
    
    return colorMap[muscle]?.[shade] || 'bg-gray-500 text-white';
  };

  const getTechniqueColorForMuscle = (muscle: string | null, technique: string): string => {
    if (!muscle) {
      return technique === 'Normale' ? 'bg-gray-300 text-gray-900' : 'bg-gray-400 text-white';
    }
    
    const colorMap: Record<string, { normal: string; special: string }> = {
      'Petto': { normal: 'bg-red-300 text-red-900', special: 'bg-red-400 text-white' },
      'Dorso - Lats': { normal: 'bg-blue-300 text-blue-900', special: 'bg-blue-400 text-white' },
      'Dorso - Upper Back': { normal: 'bg-blue-300 text-blue-900', special: 'bg-blue-400 text-white' },
      'Dorso - Trapezi': { normal: 'bg-blue-300 text-blue-900', special: 'bg-blue-400 text-white' },
      'Deltoidi - Anteriore': { normal: 'bg-orange-300 text-orange-900', special: 'bg-orange-400 text-white' },
      'Deltoidi - Laterale': { normal: 'bg-orange-300 text-orange-900', special: 'bg-orange-400 text-white' },
      'Deltoidi - Posteriore': { normal: 'bg-orange-300 text-orange-900', special: 'bg-orange-400 text-white' },
      'Bicipiti': { normal: 'bg-purple-300 text-purple-900', special: 'bg-purple-400 text-white' },
      'Tricipiti': { normal: 'bg-pink-300 text-pink-900', special: 'bg-pink-400 text-white' },
      'Avambracci': { normal: 'bg-purple-300 text-purple-900', special: 'bg-purple-400 text-white' },
      'Quadricipiti': { normal: 'bg-green-300 text-green-900', special: 'bg-green-400 text-white' },
      'Femorali': { normal: 'bg-green-300 text-green-900', special: 'bg-green-400 text-white' },
      'Glutei': { normal: 'bg-green-300 text-green-900', special: 'bg-green-400 text-white' },
      'Polpacci': { normal: 'bg-green-300 text-green-900', special: 'bg-green-400 text-white' },
      'Adduttori': { normal: 'bg-teal-300 text-teal-900', special: 'bg-teal-400 text-white' },
      'Abduttori': { normal: 'bg-teal-300 text-teal-900', special: 'bg-teal-400 text-white' },
      'Addome': { normal: 'bg-yellow-300 text-yellow-900', special: 'bg-yellow-400 text-white' },
      'Obliqui': { normal: 'bg-yellow-300 text-yellow-900', special: 'bg-yellow-400 text-white' },
      'Core': { normal: 'bg-yellow-300 text-yellow-900', special: 'bg-yellow-400 text-white' },
    };
    
    const colors = colorMap[muscle] || { normal: 'bg-gray-300 text-gray-900', special: 'bg-gray-400 text-white' };
    return technique === 'Normale' ? colors.normal : colors.special;
  };

  const getBlockColor = (blockIndex: number): string => {
    return getBlockColorForMuscle(primaryMuscle?.muscle || null, blockIndex);
  };

  const getTechniqueColor = (technique: string): string => {
    return getTechniqueColorForMuscle(primaryMuscle?.muscle || null, technique);
  };

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

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
      <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
        <CardContent className="pt-6">
          {/* Header - Always Visible */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">
                  {formatDate(session.date)}
                </span>
                <span className={`px-2 py-0.5 ${getWeekColor(session.weekNum)} text-xs font-medium rounded`}>
                  W{session.weekNum}
                </span>
                {session.dayName && (
                  <span className="text-xs text-gray-500">
                    • {session.dayName}
                  </span>
                )}
              </div>

              {primaryMuscle && (
                <div className="mb-1">
                  <span
                    className="inline-block px-2 py-0.5 text-xs font-medium rounded text-white"
                    style={{ backgroundColor: MUSCLE_COLORS[primaryMuscle.muscle] || '#6b7280' }}
                  >
                    {primaryMuscle.muscle}
                  </span>
                </div>
              )}

              <h3 className="text-lg font-semibold mb-2">
                {session.exercise}
                {hasMultipleBlocks && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({groupedSessions.length} blocchi)
                  </span>
                )}
              </h3>

              {hasMultipleBlocks ? (
                <div className="space-y-2 mb-3">
                  {groupedSessions.map((blockSession, idx) => {
                    const blockUniqueSets = Array.from(new Set(blockSession.sets.map(s => s.setNum)));
                    const blockIsSpecial = blockSession.technique !== 'Normale';
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
                        <div key={idx} className="border border-gray-200 rounded-md p-3 bg-white">
                          <div className="flex items-center gap-2 text-xs mb-2 pb-2 border-b border-gray-100">
                            <span className={`px-2 py-0.5 ${getBlockColor(blockSession.blockIndex !== undefined ? blockSession.blockIndex : idx)} rounded text-xs font-medium`}>
                              B{blockSession.blockIndex !== undefined ? blockSession.blockIndex + 1 : idx + 1}
                            </span>
                            <span className={`px-2 py-0.5 ${getTechniqueColor(blockSession.technique)} rounded text-xs font-medium`}>
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
                                <div key={setIdx} className="flex items-center gap-2 text-xs p-2">
                                  <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium min-w-[3rem] text-center">
                                    S{setDisplay}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-600">Programma:</span>
                                    <span className="font-medium text-gray-900">
                                      {targetRepsStr}
                                      {targetLoadsStr !== '-' && ` @ ${targetLoadsStr}kg`}
                                    </span>
                                  </div>
                                  <span className="text-gray-400">→</span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-600">Eseguito:</span>
                                    <span className="font-semibold text-gray-900">
                                      {actualRepsStr} @ {actualLoadsStr}kg
                                    </span>
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
                    const getBlockColorForThis = (blockIdx: number) => {
                      return getBlockColorForMuscle(blockMuscle?.muscle || null, blockIdx);
                    };
                    
                    const getTechniqueColorForThis = (technique: string) => {
                      return getTechniqueColorForMuscle(blockMuscle?.muscle || null, technique);
                    };
                    
                    return (
                      <div key={idx} className="border border-gray-200 rounded-md p-3 bg-white">
                        <div className="flex items-center gap-2 text-xs mb-2 pb-2 border-b border-gray-100">
                          <span className={`px-2 py-0.5 ${getBlockColorForThis(blockSession.blockIndex !== undefined ? blockSession.blockIndex : idx)} rounded text-xs font-medium`}>
                            B{blockSession.blockIndex !== undefined ? blockSession.blockIndex + 1 : idx + 1}
                          </span>
                          <span className={`px-2 py-0.5 ${getTechniqueColorForThis(blockSession.technique)} rounded text-xs font-medium`}>
                            {blockSession.technique}
                          </span>
                          {blockSession.blockRest && idx < groupedSessions.length - 1 && (
                            <span className="text-xs text-gray-500 ml-auto">
                              rest: {blockSession.blockRest}s
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs p-2">
                          {!blockIsSpecial && (
                            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium min-w-[3rem] text-center">
                              S
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            <span className="text-gray-600">Programma:</span>
                            <span className="font-medium text-gray-900">
                              {numSets}×{blockIsSpecial ? blockSession.techniqueSchema || '' : targetRepsPerSet.toFixed(0)}
                              {targetLoadsStr !== '-' && ` @ ${targetLoadsStr}kg`}
                            </span>
                          </div>
                          <span className="text-gray-400">→</span>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-600">Eseguito:</span>
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
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2 mb-3">
                  {isSpecialTechnique ? (
                    // Tecnica speciale: mostra set individuali
                    <div className="border border-gray-200 rounded-md p-3 bg-white">
                      <div className="flex items-center gap-2 text-xs mb-2 pb-2 border-b border-gray-100">
                        <span className={`px-2 py-0.5 ${getTechniqueColor(session.technique)} rounded text-xs font-medium`}>
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
                            <div key={setNum} className="flex items-center gap-2 text-xs p-2">
                              <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium min-w-[3rem] text-center">
                                S{setNum}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-gray-600">Programma:</span>
                                <span className="font-medium text-gray-900">
                                  {session.techniqueSchema}
                                  {targetLoadStr !== '-' && ` @ ${targetLoadStr}kg`}
                                </span>
                              </div>
                              <span className="text-gray-400">→</span>
                              <div className="flex items-center gap-1">
                                <span className="text-gray-600">Eseguito:</span>
                                <span className="font-semibold text-gray-900">
                                  {repsDisplay} @ {loadValue}kg
                                </span>
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
                    <div className="flex items-center gap-3 text-xs p-2">
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium min-w-[3rem] text-center">
                        S
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Programma:</span>
                        <span className="font-medium">
                          {uniqueSets.length}×{(getTargetReps(session) / uniqueSets.length).toFixed(0)}
                          {session.targetLoads && session.targetLoads.length > 0 &&
                            ` @ ${session.targetLoads.join('-')}kg`
                          }
                        </span>
                      </div>
                      <span className="text-muted-foreground">→</span>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Eseguito:</span>
                        <span className="font-medium">
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

            <div className="flex gap-1">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <Button variant="ghost" size="icon" onClick={handleEditClick}>
                <Pencil className="w-4 h-4 text-blue-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>

          {/* Expanded Content */}
          <CollapsibleContent>
            <div className="mt-6 pt-4 border-t space-y-4">
              {hasMultipleBlocks ? (
                // Vista raggruppata con tutti i blocchi
                groupedSessions.map((blockSession, blockIdx) => {
                  const blockUniqueSets = Array.from(new Set(blockSession.sets.map(s => s.setNum)));
                  const blockIsSpecial = blockSession.technique !== 'Normale';
                  const isLastBlock = blockIdx === groupedSessions.length - 1;
                  
                  return (
                    <div key={blockIdx} className="space-y-3 pb-3 border-b last:border-b-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">
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
                        <h5 className="text-xs font-medium mb-2">Dettaglio Sets:</h5>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="text-xs">Set</TableHead>
                                {blockIsSpecial && (
                                  <TableHead className="text-xs">Mini</TableHead>
                                )}
                                <TableHead className="text-xs">Reps</TableHead>
                                <TableHead className="text-xs">Target</TableHead>
                                <TableHead className="text-xs">Load (kg)</TableHead>
                                <TableHead className="text-xs">RPE</TableHead>
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
                                    <TableCell className="text-sm font-medium">
                                      S{set.setNum}
                                    </TableCell>
                                    {blockIsSpecial && (
                                      <TableCell className="text-sm text-muted-foreground">
                                        C{set.clusterNum}
                                      </TableCell>
                                    )}
                                    <TableCell className="text-sm">
                                      {actualReps}
                                      {!isComplete && ' ⚠️'}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {targetReps}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {parseFloat(set.load || '0').toFixed(1)}
                                    </TableCell>
                                    <TableCell className="text-sm font-semibold text-gray-900">
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
                    <h4 className="text-sm font-semibold mb-2">Dettaglio Sets:</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs">Set</TableHead>
                            {isSpecialTechnique && (
                              <TableHead className="text-xs">Mini</TableHead>
                            )}
                            <TableHead className="text-xs">Reps</TableHead>
                            <TableHead className="text-xs">Target</TableHead>
                            <TableHead className="text-xs">Load (kg)</TableHead>
                            <TableHead className="text-xs">RPE</TableHead>
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
                                <TableCell className="text-sm font-medium">
                                  S{set.setNum}
                                </TableCell>
                                {isSpecialTechnique && (
                                  <TableCell className="text-sm text-muted-foreground">
                                    C{set.clusterNum}
                                  </TableCell>
                                )}
                                <TableCell className="text-sm">
                                  {actualReps}
                                  {!isComplete && ' ⚠️'}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {targetReps}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {parseFloat(set.load || '0').toFixed(1)}
                                </TableCell>
                                <TableCell className="text-sm font-semibold text-gray-900">
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
