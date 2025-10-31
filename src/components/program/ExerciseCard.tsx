import { useState } from 'react';
import { ProgramExercise, Exercise, ExerciseBlock } from '@/types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { ChevronDown, ChevronUp, Trash2, ClipboardList, Plus } from 'lucide-react';
import { ExerciseBlockCard } from './ExerciseBlockCard';
import { getExerciseBlocks } from '@/lib/exerciseUtils';
import { REP_RANGES } from '@/types';

interface ExerciseCardProps {
  exercise: ProgramExercise;
  exerciseIndex: number;
  exerciseLibrary: Exercise[];
  allTechniques: string[];
  customTechniques: any[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (field: keyof ProgramExercise, value: any) => void;
  onUpdateBlock: (blockIndex: number, field: keyof ExerciseBlock, value: any) => void;
  onUpdateBlockBatch?: (blockIndex: number, updates: Partial<ExerciseBlock>) => void;
  onAddBlock: () => void;
  onDeleteBlock: (blockIndex: number) => void;
  onDelete: () => void;
  onLog: (blockIndex?: number) => void;
}

export function ExerciseCard({
  exercise,
  exerciseIndex,
  exerciseLibrary,
  allTechniques,
  customTechniques,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onUpdateBlock,
  onUpdateBlockBatch,
  onAddBlock,
  onDeleteBlock,
  onDelete,
  onLog,
}: ExerciseCardProps) {
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const blocks = getExerciseBlocks(exercise);

  const handleLogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (blocks.length === 1) {
      // Un solo blocco: logga direttamente
      onLog(0);
    } else {
      // Più blocchi: mostra il selettore
      setShowBlockSelector(true);
    }
  };

  const handleSelectBlock = (blockIndex: number) => {
    setShowBlockSelector(false);
    onLog(blockIndex);
  };

  const getMuscleColor = (muscle: string): string => {
    const colorMap: Record<string, string> = {
      'Petto': 'bg-red-600 text-white',
      'Dorso - Lats': 'bg-blue-600 text-white',
      'Dorso - Upper Back': 'bg-blue-500 text-white',
      'Dorso - Trapezi': 'bg-blue-700 text-white',
      'Deltoidi - Anteriore': 'bg-orange-600 text-white',
      'Deltoidi - Laterale': 'bg-orange-500 text-white',
      'Deltoidi - Posteriore': 'bg-orange-700 text-white',
      'Bicipiti': 'bg-purple-600 text-white',
      'Tricipiti': 'bg-pink-600 text-white',
      'Avambracci': 'bg-purple-400 text-white',
      'Quadricipiti': 'bg-green-600 text-white',
      'Femorali': 'bg-green-700 text-white',
      'Glutei': 'bg-green-800 text-white',
      'Polpacci': 'bg-green-500 text-white',
      'Adduttori': 'bg-teal-600 text-white',
      'Abduttori': 'bg-teal-500 text-white',
      'Addome': 'bg-yellow-600 text-white',
      'Obliqui': 'bg-yellow-500 text-white',
      'Core': 'bg-yellow-700 text-white',
    };
    return colorMap[muscle] || 'bg-gray-600 text-white';
  };

  const getPrimaryMuscle = () => {
    const libraryEx = exerciseLibrary.find((e) => e.name === exercise.exerciseName);
    if (!libraryEx || !libraryEx.muscles || libraryEx.muscles.length === 0) return null;
    return libraryEx.muscles.reduce((prev, curr) =>
      curr.percent > prev.percent ? curr : prev
    );
  };

  const primaryMuscle = getPrimaryMuscle();
  // blocks è già dichiarato sopra

  // Cardio view
  if (exercise.exerciseType === 'cardio') {
    return (
      <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-sm font-medium">
                    🏃 Cardio
                  </span>
                  <span className="text-sm text-muted-foreground">#{exerciseIndex + 1}</span>
                </div>
              <h3 className="text-lg font-semibold mb-1">{exercise.exerciseName}</h3>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {blocks.map((block, idx) => {
                  const duration = block.duration || 0;
                  const restIntraSet = block.rest ? `rest: ${block.rest}s` : '';
                  const restBetweenBlocks = idx < blocks.length - 1 && block.blockRest ? `rest blocco: ${block.blockRest}s` : '';
                  const restParts = [restIntraSet, restBetweenBlocks].filter(Boolean);
                  const restDisplay = restParts.length > 0 ? ` (${restParts.join(', ')})` : '';
                  
                  return (
                    <span key={idx} className="inline-flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 text-xs font-medium">
                        B{idx + 1}
                      </span>
                      <span>{duration}min</span>
                      {restDisplay && <span className="text-xs italic">{restDisplay}</span>}
                      {idx < blocks.length - 1 && <span className="text-muted-foreground/50 ml-1">•</span>}
                    </span>
                  );
                })}
              </div>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onLog(); // Log del primo blocco
                  }}
                  title="Log sessione"
                >
                  <ClipboardList className="w-4 h-4 text-orange-500" />
                </Button>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <Button variant="ghost" size="icon" onClick={onDelete}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>

            <CollapsibleContent>
              <div className="pt-4 border-t space-y-4">
                {/* Blocks */}
                <div className="space-y-3">
                  {blocks.map((block, blockIndex) => (
                    <ExerciseBlockCard
                      key={blockIndex}
                      block={block}
                      blockIndex={blockIndex}
                      exerciseType="cardio"
                      allTechniques={allTechniques}
                      customTechniques={customTechniques}
                      onUpdate={onUpdateBlock}
                      onUpdateBatch={onUpdateBlockBatch}
                      onDelete={onDeleteBlock}
                      isLast={blockIndex === blocks.length - 1}
                      canDelete={blocks.length > 1}
                    />
                  ))}
                </div>

                {/* Add Block Button */}
                <Button variant="outline" onClick={onAddBlock} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi Blocco
                </Button>

                {/* Note */}
                <div>
                  <Label className="text-xs">Note</Label>
                  <Input
                    value={exercise.notes || ''}
                    onChange={(e) => onUpdate('notes', e.target.value)}
                    placeholder="Aggiungi note..."
                    className="h-9"
                  />
                </div>
              </div>
          </CollapsibleContent>
        </CardContent>
      </Card>

      {/* Block Selector Dialog per Cardio */}
      <Dialog open={showBlockSelector} onOpenChange={setShowBlockSelector}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleziona Blocco da Loggare</DialogTitle>
            <DialogDescription>
              Scegli quale blocco dell'esercizio <strong>{exercise.exerciseName}</strong> vuoi loggare.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {blocks.map((block, blockIndex) => {
              const duration = block.duration || 0;
              const restIntraSet = block.rest ? `${block.rest}s` : '-';
              const restBetweenBlocks = blockIndex < blocks.length - 1 && block.blockRest ? `${block.blockRest}s` : null;
              
              return (
                <Button
                  key={blockIndex}
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  onClick={() => handleSelectBlock(blockIndex)}
                >
                  <div className="flex flex-col items-start gap-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 text-xs font-medium">
                        Blocco {blockIndex + 1}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span>{duration} minuti</span>
                      <span className="text-muted-foreground ml-2">
                        • Rest: {restIntraSet}
                        {restBetweenBlocks && ` • Rest blocco: ${restBetweenBlocks}`}
                      </span>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
      </Collapsible>
    );
  }

  // Resistance view
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {primaryMuscle && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMuscleColor(primaryMuscle.muscle)}`}>
                    {primaryMuscle.muscle}
                  </span>
                )}
                <span className="text-sm text-muted-foreground">#{exerciseIndex + 1}</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">{exercise.exerciseName}</h3>
              <div className="flex flex-wrap items-start gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {blocks.map((block, idx) => {
                  const isNormal = block.technique === 'Normale';
                  const sets = block.sets || 0;
                  const restIntraSet = block.rest ? `rest: ${block.rest}s` : '';
                  const restBetweenBlocks = idx < blocks.length - 1 && block.blockRest ? `rest blocco: ${block.blockRest}s` : '';
                  
                  // Controlla se ci sono carichi diversi per cluster che richiedono visualizzazione espansa
                  const hasDifferentLoadsByCluster = !isNormal && 
                    block.targetLoadsByCluster && 
                    block.targetLoadsByCluster.length > 0;
                  
                  // Per tecniche speciali con targetLoadsByCluster, mostra sempre una riga per set
                  // con tutti i carichi del set (es. @ 80-70-60 se diversi, @ 80 se tutti uguali)
                  if (hasDifferentLoadsByCluster) {
                    const numSets = block.sets || block.targetLoadsByCluster!.length;
                    
                    return (
                      <div key={idx} className="flex flex-col gap-0.5 w-full">
                        {block.targetLoadsByCluster!.map((setLoads, setIdx) => {
                          const isLastSet = setIdx === block.targetLoadsByCluster!.length - 1;
                          
                          // Formato carichi: tutti i carichi del set separati da '-'
                          const loadsDisplay = `${setLoads.join('-')}kg`;
                          
                          return (
                            <div key={setIdx} className="inline-flex items-center gap-1">
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                                B{idx + 1}.{setIdx + 1}
                              </span>
                              <span>{numSets}×{block.techniqueSchema || ''}</span>
                              <span className="font-medium">@ {loadsDisplay}</span>
                              {isLastSet && restIntraSet && (
                                <span className="text-xs italic">({restIntraSet})</span>
                              )}
                              {isLastSet && restBetweenBlocks && (
                                <span className="text-xs italic">({restBetweenBlocks})</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  
                  // Visualizzazione normale (orizzontale)
                  let loads = '0';
                  if (isNormal) {
                    // Tecnica normale: mostra tutti i carichi separati da '-'
                    const loadsArray = block.targetLoads || [];
                    loads = loadsArray.length > 0 ? loadsArray.join('-') : '0';
                  } else {
                    // Tecnica speciale: mostra carichi per cluster se disponibili
                    if (block.targetLoadsByCluster && block.targetLoadsByCluster.length > 0) {
                      // Se tutti i carichi sono uguali per set, mostra solo il primo
                      const firstSetLoads = block.targetLoadsByCluster[0];
                      const allSetsSame = block.targetLoadsByCluster.every(setLoads => 
                        setLoads.length === firstSetLoads.length && 
                        setLoads.every((load, i) => load === firstSetLoads[i])
                      );
                      
                      if (allSetsSame && firstSetLoads.length > 0) {
                        const allClustersSame = firstSetLoads.every(load => load === firstSetLoads[0]);
                        if (allClustersSame) {
                          loads = firstSetLoads[0];
                        } else {
                          loads = firstSetLoads.join('/');
                        }
                      } else {
                        // Per ogni set, mostra i carichi separati da '/' e i set separati da '-'
                        loads = block.targetLoadsByCluster.map(setLoads => setLoads.join('/')).join('-');
                      }
                    } else {
                      // Fallback a targetLoads
                      const loadsArray = block.targetLoads || [];
                      loads = loadsArray.length > 0 ? loadsArray.join('-') : '0';
                    }
                  }
                  
                  const restParts = [restIntraSet, restBetweenBlocks].filter(Boolean);
                  const restDisplay = restParts.length > 0 ? ` (${restParts.join(', ')})` : '';
                  
                  return (
                    <span key={idx} className="inline-flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                        B{idx + 1}
                      </span>
                      {isNormal ? (
                        <span>{sets}×{block.repsBase || 0}</span>
                      ) : (
                        <span>{sets}×{block.techniqueSchema || '-'}</span>
                      )}
                      <span className="font-medium">@ {loads}kg</span>
                      {restDisplay && <span className="text-xs italic">{restDisplay}</span>}
                      {idx < blocks.length - 1 && <span className="text-muted-foreground/50 ml-1">•</span>}
                    </span>
                  );
                })}
              </div>
              {blocks.some(b => b.technique && b.technique !== 'Normale') && (
                <div className="text-xs text-muted-foreground mt-1">
                  {blocks.filter(b => b.technique && b.technique !== 'Normale').map(b => b.technique).join(', ')}
                </div>
              )}
            </div>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogClick}
                title="Log sessione"
              >
                <ClipboardList className="w-4 h-4 text-blue-500" />
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>

          <CollapsibleContent>
            <div className="pt-4 border-t space-y-4">

              {/* Blocks */}
              <div className="space-y-3">
                {blocks.map((block, blockIndex) => (
                  <div key={blockIndex}>
                    <ExerciseBlockCard
                      block={block}
                      blockIndex={blockIndex}
                      exerciseType="resistance"
                      exerciseLibrary={exerciseLibrary}
                      allTechniques={allTechniques}
                      customTechniques={customTechniques}
                      onUpdate={onUpdateBlock}
                      onUpdateBatch={onUpdateBlockBatch}
                      onDelete={onDeleteBlock}
                      isLast={blockIndex === blocks.length - 1}
                      canDelete={blocks.length > 1}
                    />
                    {blockIndex < blocks.length - 1 && block.blockRest && (
                      <div className="text-center py-2 text-xs text-muted-foreground">
                        Rest: {block.blockRest}s
                      </div>
                    )}
                    {blocks.length > 1 && (
                      <div className="flex justify-center mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onLog(blockIndex)}
                        >
                          <ClipboardList className="w-4 h-4 mr-2" />
                          Log Blocco {blockIndex + 1}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Block Button */}
              <Button variant="outline" onClick={onAddBlock} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi Blocco
              </Button>

              {/* Note */}
              <div>
                <Label className="text-xs">Note</Label>
                <Input
                  value={exercise.notes || ''}
                  onChange={(e) => onUpdate('notes', e.target.value)}
                  placeholder="Aggiungi note..."
                  className="h-9"
                />
              </div>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>

      {/* Block Selector Dialog */}
      <Dialog open={showBlockSelector} onOpenChange={setShowBlockSelector}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleziona Blocco da Loggare</DialogTitle>
            <DialogDescription>
              Scegli quale blocco dell'esercizio <strong>{exercise.exerciseName}</strong> vuoi loggare.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {blocks.map((block, blockIndex) => {
              const isNormal = block.technique === 'Normale';
              const sets = block.sets || 0;
              
              // Determina i carichi da mostrare
              let loads = '0';
              if (isNormal) {
                // Tecnica normale: mostra tutti i carichi separati da '-'
                const loadsArray = block.targetLoads || [];
                loads = loadsArray.length > 0 ? loadsArray.join('-') : '0';
              } else {
                // Tecnica speciale: mostra carichi per cluster se disponibili
                if (block.targetLoadsByCluster && block.targetLoadsByCluster.length > 0) {
                  // Per ogni set, mostra i carichi separati da '/' e i set separati da '-'
                  loads = block.targetLoadsByCluster.map(setLoads => setLoads.join('/')).join('-');
                } else {
                  // Fallback a targetLoads
                  const loadsArray = block.targetLoads || [];
                  loads = loadsArray.length > 0 ? loadsArray.join('-') : '0';
                }
              }
              
              const restIntraSet = block.rest ? `${block.rest}s` : '-';
              const restBetweenBlocks = blockIndex < blocks.length - 1 && block.blockRest ? `${block.blockRest}s` : null;
              
              return (
                <Button
                  key={blockIndex}
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  onClick={() => handleSelectBlock(blockIndex)}
                >
                  <div className="flex flex-col items-start gap-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                        Blocco {blockIndex + 1}
                      </span>
                      {block.technique && block.technique !== 'Normale' && (
                        <span className="text-xs text-muted-foreground">
                          {block.technique}
                        </span>
                      )}
                    </div>
                    <div className="text-sm">
                      {isNormal ? (
                        <span>{sets}×{block.repsBase || 0} @ {loads}kg</span>
                      ) : (
                        <span>{sets}×{block.techniqueSchema || '-'} @ {loads}kg</span>
                      )}
                      <span className="text-muted-foreground ml-2">
                        • Rest: {restIntraSet}
                        {restBetweenBlocks && ` • Rest blocco: ${restBetweenBlocks}`}
                      </span>
                    </div>
                    {block.technique === 'Normale' && block.repRange && (
                      <div className="text-xs text-muted-foreground">
                        Range: {block.repRange} - {REP_RANGES[block.repRange as keyof typeof REP_RANGES]?.focus || ''}
                      </div>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </Collapsible>
  );
}
