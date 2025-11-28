import { useState } from 'react';
import { ProgramExercise, Exercise, ExerciseBlock } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Plus, Calendar, AlertCircle } from 'lucide-react';
import { ExerciseBlockCard } from './ExerciseBlockCard';
import { getExerciseBlocks, validateProgression } from '@/lib/exerciseUtils';
import { usesPercentageProgression } from '@/lib/techniques';
import { useApp } from '@/contexts/AppContext';

interface ConfigureExerciseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: ProgramExercise;
  exerciseIndex: number;
  dayIndex: number;
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
  exerciseIndex,
  dayIndex,
  exerciseLibrary,
  allTechniques,
  customTechniques,
  onUpdate,
  onUpdateBlock,
  onUpdateBlockBatch,
  onAddBlock,
  onDeleteBlock,
}: ConfigureExerciseModalProps) {
  const { applyProgressionToAllWeeks } = useApp();
  const [showProgressionConfirm, setShowProgressionConfirm] = useState(false);
  
  const blocks = getExerciseBlocks(exercise);
  const isCardio = exercise.exerciseType === 'cardio';
  
  // Verifica se c'è una progressione a % in uno dei blocchi
  const hasPercentageProgression = blocks.some(
    block => usesPercentageProgression(block.technique || 'Normale') && block.percentageProgression
  );
  
  // Gestisce la chiusura del modal
  const handleClose = (openState: boolean) => {
    if (!openState && hasPercentageProgression) {
      // Verifica se la progressione è valida prima di mostrare il dialog
      const progressionBlock = blocks.find(
        block => usesPercentageProgression(block.technique || 'Normale') && block.percentageProgression
      );
      if (progressionBlock?.percentageProgression) {
        const validation = validateProgression(progressionBlock.percentageProgression);
        if (validation.valid) {
          setShowProgressionConfirm(true);
          return;
        }
      }
    }
    onOpenChange(openState);
  };
  
  // Applica la progressione a tutte le settimane
  const handleApplyToAllWeeks = () => {
    const progressionBlock = blocks.find(
      block => usesPercentageProgression(block.technique || 'Normale') && block.percentageProgression
    );
    
    if (progressionBlock?.percentageProgression) {
      applyProgressionToAllWeeks(
        progressionBlock.percentageProgression,
        dayIndex,
        exerciseIndex,
        exercise.exerciseName
      );
    }
    
    setShowProgressionConfirm(false);
    onOpenChange(false);
  };
  
  // Chiude senza applicare a tutte le settimane
  const handleCloseWithoutApply = () => {
    setShowProgressionConfirm(false);
    onOpenChange(false);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
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
          <Button onClick={() => handleClose(false)}>
            ✓ Chiudi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    
    {/* Dialog di conferma per Progressione a % */}
    <Dialog open={showProgressionConfirm} onOpenChange={setShowProgressionConfirm}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Applicare la progressione?
          </DialogTitle>
          <DialogDescription className="pt-2">
            Hai configurato una <strong>Progressione a %</strong> con più settimane.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-primary/10 rounded-lg p-4 space-y-2">
            <p className="text-sm text-foreground">
              Vuoi applicare questa progressione a tutte le settimane del programma?
            </p>
            <p className="text-xs text-muted-foreground">
              Questo creerà automaticamente le settimane mancanti e configurerà l'esercizio con i carichi calcolati dalla percentuale del 1RM.
            </p>
          </div>
          
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-amber-50 p-3 rounded-lg border border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              Se scegli "No", la progressione verrà salvata solo per la settimana corrente.
            </p>
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCloseWithoutApply}>
            No, solo questa settimana
          </Button>
          <Button onClick={handleApplyToAllWeeks}>
            Sì, applica a tutte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
