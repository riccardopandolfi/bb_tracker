import { useState } from 'react';
import { ProgramExercise, Exercise, ExerciseBlock } from '@/types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { ChevronDown, ChevronUp, Trash2, ClipboardList, Plus, Clock } from 'lucide-react';
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

  // Mappa completa dei colori per blocchi basati sul muscolo e indice
  const getBlockColor = (blockIndex: number): string => {
    const muscle = primaryMuscle?.muscle || null;
    if (!muscle) return 'bg-gray-500 text-white';
    
    // Tonalità più chiare/sbiadite: 400, 500, 600 per blocchi diversi
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

  const getTechniqueColor = (technique: string): string => {
    const muscle = primaryMuscle?.muscle || null;
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
  // blocks è già dichiarato sopra

  // Cardio view
  if (exercise.exerciseType === 'cardio') {
    return (
      <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 mb-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-orange-700 text-white text-xs font-medium rounded">
                    Cardio
                  </span>
                  <span className="text-sm text-muted-foreground">#{exerciseIndex + 1}</span>
                </div>
                <h3 className="text-lg font-semibold mb-3">{exercise.exerciseName}</h3>
              <div className="space-y-3">
                {blocks.map((block, idx) => {
                  const duration = block.duration || 0;
                  const restGlobal = block.rest ? `${block.rest}s` : null;
                  const restBetweenBlocks = idx < blocks.length - 1 && block.blockRest ? `${block.blockRest}s` : null;
                  
                  return (
                    <div key={idx}>
                      <div className="w-full border border-gray-200 rounded-lg p-3 bg-white hover:border-gray-300 transition-colors">
                        {/* Header blocco */}
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                          <span className={`px-2 py-0.5 ${getBlockColor(idx)} text-xs font-medium rounded`}>
                            B{idx + 1}
                          </span>
                          <span className="px-2 py-0.5 bg-orange-700 text-white text-xs font-medium rounded">
                            Cardio
                          </span>
                        </div>
                        
                        {/* Contenuto blocco */}
                        <div className="space-y-2">
                          <div className="text-sm font-semibold text-gray-900">
                            {duration} minuti
                          </div>
                          
                          {/* Rest globale */}
                          {restGlobal && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 pt-1.5 border-t border-gray-100">
                              <Clock className="w-3 h-3" />
                              <span>rest: {restGlobal}</span>
                            </div>
                          )}
                          
                          {/* Note del blocco */}
                          {block.notes && (
                            <div className="text-xs text-gray-600 pt-1.5 border-t border-gray-100 italic">
                              {block.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Rest blocco: mostrato TRA i blocchi */}
                      {restBetweenBlocks && (
                        <div className="flex items-center justify-center py-2">
                          <div className="flex-1 border-t border-gray-200"></div>
                          <span className="px-3 text-xs text-gray-500 bg-gray-50 mx-2">
                            rest blocco: {restBetweenBlocks}
                          </span>
                          <div className="flex-1 border-t border-gray-200"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              </div>
              <div className="flex gap-1 self-end sm:self-start">
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
              <div className="pt-6 mt-4 border-t-2 border-orange-100 bg-gradient-to-b from-orange-50/30 to-transparent rounded-b-lg">
                {/* Header sezione espansa */}
                <div className="px-4 mb-4">
                  <h4 className="text-sm font-bold text-orange-900 mb-1">⚙️ Configurazione Blocchi Cardio</h4>
                  <p className="text-xs text-muted-foreground">
                    Imposta durata, riposi e note per ogni blocco cardio.
                  </p>
                </div>

                {/* Blocks */}
                <div className="space-y-4 px-4">
                  {blocks.map((block, blockIndex) => (
                    <div key={blockIndex}>
                      <ExerciseBlockCard
                        block={block}
                        blockIndex={blockIndex}
                        exerciseType="cardio"
                        exerciseLibrary={exerciseLibrary}
                        exerciseName={exercise.exerciseName}
                        allTechniques={allTechniques}
                        customTechniques={customTechniques}
                        onUpdate={onUpdateBlock}
                        onUpdateBatch={onUpdateBlockBatch}
                        onDelete={onDeleteBlock}
                        isLast={blockIndex === blocks.length - 1}
                        canDelete={blocks.length > 1}
                      />
                      
                      {/* Separatore tra blocchi */}
                      {blockIndex < blocks.length - 1 && (
                        <div className="flex items-center justify-center py-4 my-4">
                          <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
                          {block.blockRest ? (
                            <div className="px-4 py-1.5 bg-amber-100 border border-amber-300 rounded-full text-xs font-semibold text-amber-900 mx-3">
                              ⏱️ Rest Blocco: {block.blockRest}s
                            </div>
                          ) : (
                            <div className="px-4 py-1 bg-gray-100 border border-gray-300 rounded-full text-xs text-gray-600 mx-3">
                              ⬇️ Blocco successivo
                            </div>
                          )}
                          <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Block Button */}
                <div className="px-4 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={onAddBlock} 
                    className="w-full border-2 border-dashed border-orange-300 hover:bg-orange-50 hover:border-orange-400"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Aggiungi Blocco
                  </Button>
                </div>

                {/* Note esercizio */}
                <div className="px-4 pt-4 pb-6">
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <Label className="text-sm font-semibold mb-2 block">📝 Note Esercizio</Label>
                    <Input
                      value={exercise.notes || ''}
                      onChange={(e) => onUpdate('notes', e.target.value)}
                      placeholder="Aggiungi note generali per questo esercizio..."
                      className="h-10"
                    />
                  </div>
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
          <div className="flex flex-col gap-4 mb-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {primaryMuscle && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMuscleColor(primaryMuscle.muscle)}`}>
                    {primaryMuscle.muscle}
                  </span>
                )}
                <span className="text-sm text-muted-foreground">#{exerciseIndex + 1}</span>
              </div>
              <h3 className="text-lg font-semibold mb-3">{exercise.exerciseName}</h3>
              
              {/* Blocchi organizzati verticalmente */}
              <div className="space-y-3">
                {blocks.map((block, idx) => {
                  const isNormal = block.technique === 'Normale';
                  const sets = block.sets || 0;
                  const restGlobal = block.rest ? `${block.rest}s` : null;
                  const restIntraSet = !isNormal && block.techniqueParams?.pause 
                    ? `${block.techniqueParams.pause}s` 
                    : null;
                  const restBetweenBlocks = idx < blocks.length - 1 && block.blockRest ? `${block.blockRest}s` : null;
                  
                  const hasDifferentLoadsByCluster = !isNormal && 
                    block.targetLoadsByCluster && 
                    block.targetLoadsByCluster.length > 0;
                  
                  return (
                    <div key={idx}>
                      <div className="w-full border border-gray-200 rounded-lg p-3 bg-white hover:border-gray-300 transition-colors">
                        {/* Header blocco */}
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                          <span className={`px-2 py-0.5 ${getBlockColor(idx)} text-xs font-medium rounded`}>
                            B{idx + 1}
                          </span>
                          <span className={`px-2 py-0.5 ${getTechniqueColor(block.technique || 'Normale')} text-xs font-medium rounded`}>
                            {block.technique || 'Normale'}
                          </span>
                        </div>
                      
                        {/* Contenuto blocco */}
                        <div className="space-y-2">
                          {/* Tecnica speciale con sottoblocchi */}
                          {hasDifferentLoadsByCluster ? (
                            <div className="space-y-1.5">
                              {block.targetLoadsByCluster!.map((setLoads, setIdx) => {
                                const loadsDisplay = `${setLoads.join('-')}kg`;
                                
                                return (
                                  <div key={setIdx} className="flex w-full flex-wrap items-center gap-2 text-sm p-2">
                                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded min-w-[3rem] text-center">
                                      S{setIdx + 1}
                                    </span>
                                    <span className="text-gray-600">
                                      {block.techniqueSchema || ''}
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                      @ {loadsDisplay}
                                    </span>
                                    {restIntraSet && setIdx === 0 && (
                                      <span className="text-xs text-gray-500 ml-auto">
                                        rest intra: {restIntraSet}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            /* Blocco normale o tecnica speciale semplice */
                            <div className="flex w-full flex-wrap items-center gap-2 text-sm p-2">
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded min-w-[3rem] text-center">
                                S
                              </span>
                              <span className="font-medium text-gray-700">
                                {isNormal ? (
                                  <>{sets}×{block.repsBase || 0}</>
                                ) : (
                                  <>{sets}×{block.techniqueSchema || '-'}</>
                                )}
                              </span>
                              <span className="font-semibold text-gray-900">
                                @ {(() => {
                                  let loads = '0';
                                  if (isNormal) {
                                    const loadsArray = block.targetLoads || [];
                                    loads = loadsArray.length > 0 ? loadsArray.join('-') : '0';
                                  } else {
                                    if (block.targetLoadsByCluster && block.targetLoadsByCluster.length > 0) {
                                      const firstSetLoads = block.targetLoadsByCluster[0];
                                      const allSetsSame = block.targetLoadsByCluster.every(setLoads => 
                                        setLoads.length === firstSetLoads.length && 
                                        setLoads.every((load, i) => load === firstSetLoads[i])
                                      );
                                      if (allSetsSame && firstSetLoads.length > 0) {
                                        const allClustersSame = firstSetLoads.every(load => load === firstSetLoads[0]);
                                        loads = allClustersSame ? firstSetLoads[0] : firstSetLoads.join('/');
                                      } else {
                                        loads = block.targetLoadsByCluster.map(setLoads => setLoads.join('/')).join('-');
                                      }
                                    } else {
                                      const loadsArray = block.targetLoads || [];
                                      loads = loadsArray.length > 0 ? loadsArray.join('-') : '0';
                                    }
                                  }
                                  return `${loads}kg`;
                                })()}
                              </span>
                              {isNormal && block.repRange && (
                                <span className="text-xs text-gray-500">
                                  ({block.repRange} - {REP_RANGES[block.repRange as keyof typeof REP_RANGES]?.focus || ''})
                                </span>
                              )}
                              {restIntraSet && (
                                <span className="text-xs text-gray-500 ml-auto">
                                  rest intra: {restIntraSet}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Rest globale */}
                          {restGlobal && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 pt-1.5 border-t border-gray-100">
                              <Clock className="w-3 h-3" />
                              <span>rest globale: {restGlobal}</span>
                            </div>
                          )}
                          
                          {/* Note del blocco */}
                          {block.notes && (
                            <div className="text-xs text-gray-600 pt-1.5 border-t border-gray-100 italic">
                              {block.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Rest blocco: mostrato TRA i blocchi */}
                      {restBetweenBlocks && (
                        <div className="flex items-center justify-center py-2">
                          <div className="flex-1 border-t border-gray-200"></div>
                          <span className="px-3 text-xs text-gray-500 bg-gray-50 mx-2">
                            rest blocco: {restBetweenBlocks}
                          </span>
                          <div className="flex-1 border-t border-gray-200"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-1 self-end sm:self-start">
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
            <div className="pt-6 mt-4 border-t-2 border-blue-100 bg-gradient-to-b from-blue-50/30 to-transparent rounded-b-lg">
              {/* Header sezione espansa */}
              <div className="px-4 mb-4">
                <h4 className="text-sm font-bold text-blue-900 mb-1">⚙️ Configurazione Blocchi</h4>
                <p className="text-xs text-muted-foreground">
                  Configura i dettagli di ogni blocco: carichi, ripetizioni, rest e tecniche avanzate.
                </p>
              </div>

              {/* Blocks */}
              <div className="space-y-4 px-4">
                {blocks.map((block, blockIndex) => (
                  <div key={blockIndex} className="relative">
                    <ExerciseBlockCard
                      block={block}
                      blockIndex={blockIndex}
                      exerciseType="resistance"
                      exerciseLibrary={exerciseLibrary}
                      exerciseName={exercise.exerciseName}
                      allTechniques={allTechniques}
                      customTechniques={customTechniques}
                      onUpdate={onUpdateBlock}
                      onUpdateBatch={onUpdateBlockBatch}
                      onDelete={onDeleteBlock}
                      isLast={blockIndex === blocks.length - 1}
                      canDelete={blocks.length > 1}
                    />
                    
                    {/* Log singolo blocco (solo se ci sono più blocchi) */}
                    {blocks.length > 1 && (
                      <div className="flex justify-center mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onLog(blockIndex)}
                          className="bg-white hover:bg-blue-50 border-blue-200"
                        >
                          <ClipboardList className="w-4 h-4 mr-2" />
                          Log Blocco {blockIndex + 1}
                        </Button>
                      </div>
                    )}
                    
                    {/* Separatore tra blocchi con rest */}
                    {blockIndex < blocks.length - 1 && (
                      <div className="flex items-center justify-center py-4 my-4">
                        <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
                        {block.blockRest ? (
                          <div className="px-4 py-1.5 bg-amber-100 border border-amber-300 rounded-full text-xs font-semibold text-amber-900 mx-3">
                            ⏱️ Rest Blocco: {block.blockRest}s
                          </div>
                        ) : (
                          <div className="px-4 py-1 bg-gray-100 border border-gray-300 rounded-full text-xs text-gray-600 mx-3">
                            ⬇️ Blocco successivo
                          </div>
                        )}
                        <div className="flex-1 border-t-2 border-dashed border-gray-300"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Block Button */}
              <div className="px-4 pt-4">
                <Button 
                  variant="outline" 
                  onClick={onAddBlock} 
                  className="w-full border-2 border-dashed border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi Blocco
                </Button>
              </div>

              {/* Note esercizio */}
              <div className="px-4 pt-4 pb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <Label className="text-sm font-semibold mb-2 block">📝 Note Esercizio</Label>
                  <Input
                    value={exercise.notes || ''}
                    onChange={(e) => onUpdate('notes', e.target.value)}
                    placeholder="Aggiungi note generali per questo esercizio..."
                    className="h-10"
                  />
                </div>
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
