import { ProgramExercise, Exercise, ExerciseBlock } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Plus } from 'lucide-react';
import { ExerciseBlockCard } from './ExerciseBlockCard';
import { getExerciseBlocks } from '@/lib/exerciseUtils';

interface ConfigureExerciseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}

export function ConfigureExerciseModal({
  open,
  onOpenChange,
  exercise,
  exerciseIndex: _exerciseIndex,
  exerciseLibrary,
  allTechniques,
  customTechniques,
  onUpdate,
  onUpdateBlock,
  onUpdateBlockBatch,
  onAddBlock,
  onDeleteBlock,
}: ConfigureExerciseModalProps) {
  const blocks = getExerciseBlocks(exercise);
  const isCardio = exercise.exerciseType === 'cardio';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-xl font-bold">
            ⚙️ Configura: {exercise.exerciseName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="blocks" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="blocks">
              {isCardio ? '🏃 Blocchi Cardio' : '💪 Blocchi Resistance'}
            </TabsTrigger>
            <TabsTrigger value="notes">📝 Note</TabsTrigger>
          </TabsList>

          {/* Tab Blocchi */}
          <TabsContent value="blocks" className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-4">
              {blocks.map((block, blockIndex) => (
                <div key={blockIndex} className="relative">
                  <ExerciseBlockCard
                    block={block}
                    blockIndex={blockIndex}
                    exerciseType={exercise.exerciseType || 'resistance'}
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
            <div className="pt-4">
              <Button
                variant="outline"
                onClick={onAddBlock}
                className={`w-full border-2 border-dashed ${isCardio
                    ? 'border-orange-300 hover:bg-orange-50 hover:border-orange-400'
                    : 'border-blue-300 hover:bg-blue-50 hover:border-blue-400'
                  }`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi Blocco
              </Button>
            </div>
          </TabsContent>

          {/* Tab Note */}
          <TabsContent value="notes" className="flex-1 overflow-y-auto p-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <Label className="text-sm font-semibold mb-2 block">
                📝 Note Esercizio
              </Label>
              <Input
                value={exercise.notes || ''}
                onChange={(e) => onUpdate('notes', e.target.value)}
                placeholder="Aggiungi note generali per questo esercizio..."
                className="h-10"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer con pulsante chiudi */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>
            ✓ Chiudi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
