import { LoggedSession } from '@/types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { getRPEColor } from '@/lib/calculations';
import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { getExerciseBlocks } from '@/lib/exerciseUtils';

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
  const { getCurrentWeeks } = useApp();
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
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
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
  
  // Calcola RPE medio per tutti i blocchi se raggruppati
  const avgRPE = hasMultipleBlocks
    ? groupedSessions.reduce((sum, s) => sum + s.avgRPE, 0) / groupedSessions.length
    : session.avgRPE;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          {/* Header - Always Visible */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  🗓️ {formatDate(session.date)}
                </span>
                <Badge variant="outline" className="text-xs">
                  W{session.weekNum}
                </Badge>
              </div>

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
                      ? blockSession.targetReps / numSets 
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
                    
                    // Se ci sono carichi diversi, mostra ogni set separatamente
                    if (hasDifferentLoads || hasDifferentBetweenSets) {
                      return (
                        <div key={idx} className="flex flex-col gap-1 p-2 rounded-md bg-muted/30">
                          <div className="flex items-center gap-2 text-xs mb-1">
                            <span className="font-medium text-muted-foreground">
                              Blocco {blockSession.blockIndex !== undefined ? blockSession.blockIndex + 1 : idx + 1}: {blockSession.technique}
                            </span>
                            {blockSession.blockRest && idx < groupedSessions.length - 1 && (
                              <span className="text-xs text-muted-foreground">
                                (rest: {blockSession.blockRest}s)
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            {actualDataBySet.map((setData, setIdx) => {
                              const blockNum = blockSession.blockIndex !== undefined ? blockSession.blockIndex + 1 : idx + 1;
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
                                <div key={setIdx} className="flex items-center gap-3 text-xs pl-2">
                                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                                    B{blockNum}.{setDisplay}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-muted-foreground">Programma:</span>
                                    <span className="font-medium">
                                      {targetRepsStr}
                                      {targetLoadsStr !== '-' && ` @ ${targetLoadsStr}kg`}
                                    </span>
                                  </div>
                                  <span className="text-muted-foreground">→</span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-muted-foreground">Eseguito:</span>
                                    <span className="font-medium">
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
                    
                    return (
                      <div key={idx} className="flex flex-col gap-1 p-2 rounded-md bg-muted/30">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-medium text-muted-foreground">
                            Blocco {blockSession.blockIndex !== undefined ? blockSession.blockIndex + 1 : idx + 1}: {blockSession.technique}
                          </span>
                          {blockSession.blockRest && idx < groupedSessions.length - 1 && (
                            <span className="text-xs text-muted-foreground">
                              (rest: {blockSession.blockRest}s)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Programma:</span>
                            <span className="font-medium">
                              {numSets}×{blockIsSpecial ? blockSession.techniqueSchema || '' : targetRepsPerSet.toFixed(0)}
                              {targetLoadsStr !== '-' && ` @ ${targetLoadsStr}kg`}
                            </span>
                          </div>
                          <span className="text-muted-foreground">→</span>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Eseguito:</span>
                            <span className="font-medium">
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
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted-foreground font-medium">
                      {session.technique}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs p-2 rounded-md bg-muted/30">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Programma:</span>
                      <span className="font-medium">
                        {uniqueSets.length}×{isSpecialTechnique ? session.techniqueSchema || '' : (session.targetReps / uniqueSets.length).toFixed(0)}
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
                          const repsDisplay = isSpecialTechnique
                            ? setData.map(s => s.reps || '0').join('+')
                            : setData[0]?.reps || '0';
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

              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">
                  RPE {hasMultipleBlocks ? 'Medio' : 'Reale'}:{' '}
                  <span className={getRPEColor(avgRPE)}>
                    {avgRPE?.toFixed(1)}
                  </span>
                </span>
              </div>
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
                            {blockSession.totalReps} / {blockSession.targetReps}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Coefficiente</div>
                          <div className="font-medium">{blockSession.coefficient}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">RPE Medio</div>
                          <div className={`font-medium ${getRPEColor(blockSession.avgRPE)}`}>
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
                                  : blockSession.targetReps / blockUniqueSets.length;
                                const actualReps = parseFloat(set.reps || '0');
                                const rpeValue = parseFloat(set.rpe || '0');
                                const isComplete = actualReps >= targetReps * 0.9;

                                return (
                                  <TableRow key={idx} className={isComplete ? '' : 'bg-red-50'}>
                                    <TableCell className="text-sm font-medium">
                                      {set.setNum}
                                    </TableCell>
                                    {blockIsSpecial && (
                                      <TableCell className="text-sm text-muted-foreground">
                                        {set.clusterNum}
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
                                    <TableCell className={`text-sm font-medium ${getRPEColor(rpeValue)}`}>
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
                        {session.totalReps} / {session.targetReps}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Coefficiente</div>
                      <div className="font-medium">{session.coefficient}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">RPE Medio</div>
                      <div className={`font-medium ${getRPEColor(session.avgRPE)}`}>
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
                              : session.targetReps / uniqueSets.length;
                            const actualReps = parseFloat(set.reps || '0');
                            const rpeValue = parseFloat(set.rpe || '0');
                            const isComplete = actualReps >= targetReps * 0.9;

                            return (
                              <TableRow key={idx} className={isComplete ? '' : 'bg-red-50'}>
                                <TableCell className="text-sm font-medium">
                                  {set.setNum}
                                </TableCell>
                                {isSpecialTechnique && (
                                  <TableCell className="text-sm text-muted-foreground">
                                    {set.clusterNum}
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
                                <TableCell className={`text-sm font-medium ${getRPEColor(rpeValue)}`}>
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
                  ? blockSession.targetReps / blockUniqueSets.length 
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
