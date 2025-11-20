import { useState } from 'react';
import { ProgramExercise, Exercise, ExerciseBlock } from '@/types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Settings, Trash2, ClipboardList, Clock, BarChart3 } from 'lucide-react';
import { ConfigureExerciseModal } from './ConfigureExerciseModal';
import { ExerciseHistoryDialog } from './ExerciseHistoryDialog';
import { getExerciseBlocks } from '@/lib/exerciseUtils';
import { REP_RANGES } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { adjustColor, getContrastTextColor } from '@/lib/colorUtils';

interface ExerciseCardProps {
  exercise: ProgramExercise;
  exerciseIndex: number;
  exerciseLibrary: Exercise[];
  allTechniques: string[];
  customTechniques: any[];
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
  onUpdate,
  onUpdateBlock,
  onUpdateBlockBatch,
  onAddBlock,
  onDeleteBlock,
  onDelete,
  onLog,
}: ExerciseCardProps) {
  const { getMuscleColor: resolveMuscleColor, currentProgramId } = useApp();
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
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

  const getPrimaryMuscle = () => {
    const libraryEx = exerciseLibrary.find((e) => e.name === exercise.exerciseName);
    if (!libraryEx || !libraryEx.muscles || libraryEx.muscles.length === 0) return null;
    return libraryEx.muscles.reduce((prev, curr) =>
      curr.percent > prev.percent ? curr : prev
    );
  };

  const primaryMuscle = getPrimaryMuscle();

  const fallbackColor = '#6b7280';

  const resolveColor = (muscle?: string | null) => {
    if (!muscle) return fallbackColor;
    const color = resolveMuscleColor(muscle);
    return color || fallbackColor;
  };

  const getBadgeStyle = (color: string, modifier = 0) => {
    const adjusted = modifier !== 0 ? adjustColor(color, modifier) : color;
    return {
      backgroundColor: adjusted,
      color: getContrastTextColor(adjusted),
    };
  };

  const getBlockStyle = (blockIndex: number, muscle?: string | null) => {
    const base = resolveColor(muscle ?? primaryMuscle?.muscle ?? null);
    const shadePattern = [0, -0.12, 0.18, -0.2, 0.14, -0.05, 0.24, -0.1];
    const modifier = shadePattern[blockIndex % shadePattern.length];
    return getBadgeStyle(base, modifier);
  };

  const getTechniqueStyle = (technique: string, muscle?: string | null) => {
    const base = resolveColor(muscle ?? primaryMuscle?.muscle ?? null);
    const modifier = technique === 'Normale' ? 0.22 : -0.12;
    return getBadgeStyle(base, modifier);
  };
  // blocks è già dichiarato sopra

  // Cardio view
  if (exercise.exerciseType === 'cardio') {
    return (
      <>
        <Card className="card-monetra">
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
                            <span
                              className="px-2 py-0.5 text-xs font-medium rounded"
                              style={getBlockStyle(idx)}
                            >
                              B{idx + 1}
                            </span>
                            <span className="px-2 py-0.5 bg-orange-700 text-white text-xs font-medium rounded">
                              Cardio
                            </span>
                            {/* Pulsante log blocco */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onLog(idx);
                              }}
                              className="ml-auto p-1 hover:bg-orange-50 rounded transition-colors"
                              title="Log blocco"
                            >
                              <ClipboardList className="w-3.5 h-3.5 text-gray-400 hover:text-orange-600" />
                            </button>
                            {/* Pulsante elimina blocco - solo se ci sono più blocchi */}
                            {blocks.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Eliminare il Blocco ${idx + 1}?`)) {
                                    onDeleteBlock(idx);
                                  }
                                }}
                                className="p-1 hover:bg-red-50 rounded transition-colors"
                                title="Elimina blocco"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-600" />
                              </button>
                            )}
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
                  onClick={() => setShowConfigModal(true)}
                  title="Configura esercizio"
                >
                  <Settings className="w-4 h-4 text-blue-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHistoryDialog(true)}
                  title="Storico progressione"
                >
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogClick}
                  title="Log sessione"
                >
                  <ClipboardList className="w-4 h-4 text-orange-500" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onDelete}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configure Modal */}
        <ConfigureExerciseModal
          open={showConfigModal}
          onOpenChange={setShowConfigModal}
          exercise={exercise}
          exerciseIndex={exerciseIndex}
          exerciseLibrary={exerciseLibrary}
          allTechniques={allTechniques}
          customTechniques={customTechniques}
          onUpdate={onUpdate}
          onUpdateBlock={onUpdateBlock}
          onUpdateBlockBatch={onUpdateBlockBatch}
          onAddBlock={onAddBlock}
          onDeleteBlock={onDeleteBlock}
        />

        {/* Block Selector Dialog per Cardio */}
        <Dialog open={showBlockSelector} onOpenChange={setShowBlockSelector}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Seleziona Blocco da Loggare</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Scegli quale blocco dell'esercizio <strong>{exercise.exerciseName}</strong> vuoi loggare.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-3 sm:py-4">
              {blocks.map((_, blockIndex) => {
                return (
                  <Button
                    key={blockIndex}
                    variant="outline"
                    className="w-full justify-center h-auto p-4"
                    onClick={() => handleSelectBlock(blockIndex)}
                  >
                    <span className="px-3 py-1 rounded bg-orange-50 text-orange-700 text-sm font-medium">
                      Blocco {blockIndex + 1}
                    </span>
                  </Button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        {/* Exercise History Dialog */}
        {currentProgramId && (
          <ExerciseHistoryDialog
            open={showHistoryDialog}
            onOpenChange={setShowHistoryDialog}
            exerciseName={exercise.exerciseName}
            programId={currentProgramId}
          />
        )}
      </>
    );
  }

  // Resistance view
  return (
    <>
      <Card className="card-monetra">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 mb-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {primaryMuscle && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={getBadgeStyle(resolveColor(primaryMuscle.muscle))}
                  >
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

                  const isRamping = block.technique === 'Ramping';

                  return (
                    <div key={idx}>
                      <div className="w-full border border-gray-200 rounded-lg p-3 bg-white hover:border-gray-300 transition-colors">
                        {/* Header blocco */}
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                          <span
                            className="px-2 py-0.5 text-xs font-medium rounded"
                            style={getBlockStyle(idx)}
                          >
                            B{idx + 1}
                          </span>
                          <span
                            className="px-2 py-0.5 text-xs font-medium rounded"
                            style={getTechniqueStyle(block.technique || 'Normale')}
                          >
                            {block.technique || 'Normale'}
                          </span>
                          {/* Pulsante log blocco */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onLog(idx);
                            }}
                            className="ml-auto p-1 hover:bg-green-50 rounded transition-colors"
                            title="Log blocco"
                          >
                            <ClipboardList className="w-3.5 h-3.5 text-gray-400 hover:text-green-600" />
                          </button>
                          {/* Pulsante elimina blocco - solo se ci sono più blocchi */}
                          {blocks.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Eliminare il Blocco ${idx + 1}?`)) {
                                  onDeleteBlock(idx);
                                }
                              }}
                              className="p-1 hover:bg-red-50 rounded transition-colors"
                              title="Elimina blocco"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-600" />
                            </button>
                          )}
                        </div>

                        {/* Contenuto blocco */}
                        <div className="space-y-2">
                          {/* Ramping - Display testuale chiaro */}
                          {isRamping ? (
                            <div className="flex w-full items-center text-sm p-2">
                              <span className="text-gray-700">
                                Ramping {block.repsBase || '?'} rep con partenza da {block.startLoad || '?'}kg
                                {block.increment
                                  ? ` ed aumento di ${block.increment}kg`
                                  : ' (aumento libero)'}
                                {' '}con target RPE {block.targetRPE || '?'}
                              </span>
                            </div>
                          ) : hasDifferentLoadsByCluster ? (
                            /* Tecnica speciale con sottoblocchi */
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
                                  block.targetReps && block.targetReps.length > 0 ? (
                                    <>{sets}× {block.targetReps.join('-')}</>
                                  ) : (
                                    <>{sets}×{block.repsBase || 0}</>
                                  )
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
                onClick={() => setShowConfigModal(true)}
                title="Configura esercizio"
              >
                <Settings className="w-4 h-4 text-blue-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHistoryDialog(true)}
                title="Storico progressione"
              >
                <BarChart3 className="w-4 h-4 text-purple-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogClick}
                title="Log sessione"
              >
                <ClipboardList className="w-4 h-4 text-green-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configure Modal */}
      <ConfigureExerciseModal
        open={showConfigModal}
        onOpenChange={setShowConfigModal}
        exercise={exercise}
        exerciseIndex={exerciseIndex}
        exerciseLibrary={exerciseLibrary}
        allTechniques={allTechniques}
        customTechniques={customTechniques}
        onUpdate={onUpdate}
        onUpdateBlock={onUpdateBlock}
        onUpdateBlockBatch={onUpdateBlockBatch}
        onAddBlock={onAddBlock}
        onDeleteBlock={onDeleteBlock}
      />

      {/* Block Selector Dialog */}
      <Dialog open={showBlockSelector} onOpenChange={setShowBlockSelector}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Seleziona Blocco da Loggare</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Scegli quale blocco dell'esercizio <strong>{exercise.exerciseName}</strong> vuoi loggare.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-3 sm:py-4">
            {blocks.map((_, blockIndex) => {
              return (
                <Button
                  key={blockIndex}
                  variant="outline"
                  className="w-full justify-center h-auto p-4"
                  onClick={() => handleSelectBlock(blockIndex)}
                >
                  <span className="px-3 py-1 rounded bg-blue-50 text-blue-700 text-sm font-medium">
                    Blocco {blockIndex + 1}
                  </span>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Exercise History Dialog */}
      {currentProgramId && (
        <ExerciseHistoryDialog
          open={showHistoryDialog}
          onOpenChange={setShowHistoryDialog}
          exerciseName={exercise.exerciseName}
          programId={currentProgramId}
        />
      )}
    </>
  );
}
