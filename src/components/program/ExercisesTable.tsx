import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { ProgramExercise, ExerciseBlock, DEFAULT_TECHNIQUES } from '@/types';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Plus } from 'lucide-react';
import { LogSessionModal } from './LogSessionModal';
import { ExerciseCard } from './ExerciseCard';
import { generateSchemaFromParams } from '@/lib/techniques';
import { getExerciseBlocks, createDefaultBlock } from '@/lib/exerciseUtils';

interface ExercisesTableProps {
  dayIndex: number;
}

export function ExercisesTable({ dayIndex }: ExercisesTableProps) {
  const { currentWeek, getCurrentWeeks, updateWeek, exercises, customTechniques } = useApp();
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);

  // Add exercise modal state
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>('');

  const weeks = getCurrentWeeks();
  const week = weeks[currentWeek];
  const day = week?.days[dayIndex];
  const allTechniques = [...DEFAULT_TECHNIQUES, ...customTechniques.map(t => t.name)];

  if (!day) {
    return <div>Giorno non trovato</div>;
  }

  const handleAddExercise = () => {
    // Open modal to select exercise
    if (exercises.length > 0) {
      setSelectedExerciseName(exercises[0].name);
    }
    setShowAddExerciseModal(true);
  };

  const handleConfirmAddExercise = () => {
    if (!selectedExerciseName) {
      alert('Seleziona un esercizio');
      return;
    }

    const selectedExercise = exercises.find(ex => ex.name === selectedExerciseName);
    if (!selectedExercise) return;

    // Crea il primo blocco con valori di default
    const firstBlock: ExerciseBlock = selectedExercise.type === 'cardio' ? {
      duration: 30,
    } : {
      rest: 90,
      sets: 3,
      repsBase: '10',
      repRange: '8-12',
      targetLoads: ['80', '80', '80'],
      targetRPE: 8,
      technique: 'Normale',
      techniqueSchema: '',
      techniqueParams: {},
      coefficient: 1.0,
    };

    const newExercise: ProgramExercise = {
      exerciseName: selectedExercise.name,
      exerciseType: selectedExercise.type,
      blocks: [firstBlock],
      notes: '',
    };

    const updatedDay = {
      ...day,
      exercises: [...day.exercises, newExercise],
    };

    const updatedWeek = {
      ...week,
      days: week.days.map((d, i) => (i === dayIndex ? updatedDay : d)),
    };

    updateWeek(currentWeek, updatedWeek);
    setShowAddExerciseModal(false);
    setSelectedExerciseName('');
  };

  const handleUpdateExercise = (exIndex: number, field: keyof ProgramExercise, value: any) => {
    const currentExercise = day.exercises[exIndex];
    
    // Migra l'esercizio se necessario
    const exercise = getExerciseBlocks(currentExercise).length > 0 ? currentExercise : {
      ...currentExercise,
      blocks: currentExercise.blocks || [createDefaultBlock(currentExercise.exerciseType || 'resistance')],
    };
    
    const updatedExercise: ProgramExercise = {
      ...exercise,
      [field]: value,
    };

    // Handle technique change logic
    if (field === 'technique') {
      if (value !== 'Normale') {
        updatedExercise.repsBase = '';
        updatedExercise.techniqueParams = {};
        // Generate schema with default params
        const customTech = customTechniques.find(t => t.name === value);
        if (customTech) {
          // Custom technique: generate simple schema from default values
          const values = customTech.parameters.map(p => p.defaultValue).filter(v => v);
          updatedExercise.techniqueSchema = values.join('+');
        } else {
          const schema = generateSchemaFromParams(value, {});
          updatedExercise.techniqueSchema = schema;
        }
      } else {
        updatedExercise.techniqueSchema = '';
        updatedExercise.techniqueParams = {};
        updatedExercise.repsBase = '10';
      }
    }

    // Generate schema from params if techniqueParams changed
    if (field === 'techniqueParams' && updatedExercise.technique) {
      const customTech = customTechniques.find(t => t.name === updatedExercise.technique);
      if (customTech) {
        // Custom technique: generate schema from params
        const values = customTech.parameters
          .map(p => value[p.name] ?? p.defaultValue)
          .filter(v => v !== undefined && v !== '');
        updatedExercise.techniqueSchema = values.every(v => !isNaN(Number(v)))
          ? values.join('+')
          : values.join('-');
      } else {
        const schema = generateSchemaFromParams(updatedExercise.technique, value);
        updatedExercise.techniqueSchema = schema;
      }
    }

    // Adjust targetLoads array when sets change
    if (field === 'sets') {
      const newSets = value as number;
      const currentLoads = updatedExercise.targetLoads || [];
      if (newSets > currentLoads.length) {
        // Add new loads (copy last value)
        const lastLoad = currentLoads[currentLoads.length - 1] || '80';
        updatedExercise.targetLoads = [
          ...currentLoads,
          ...Array(newSets - currentLoads.length).fill(lastLoad),
        ];
      } else if (newSets < currentLoads.length) {
        // Remove excess loads
        updatedExercise.targetLoads = currentLoads.slice(0, newSets);
      }
    }

    const updatedDay = {
      ...day,
      exercises: day.exercises.map((ex, i) => (i === exIndex ? updatedExercise : ex)),
    };

    const updatedWeek = {
      ...week,
      days: week.days.map((d, i) => (i === dayIndex ? updatedDay : d)),
    };

    updateWeek(currentWeek, updatedWeek);
  };

  // Aggiornamento batch per gestire più modifiche contemporanee (evita race conditions)
  const handleUpdateBlockBatch = (exIndex: number, blockIndex: number, updates: Partial<ExerciseBlock>) => {
    const currentExercise = day.exercises[exIndex];
    const exercise = getExerciseBlocks(currentExercise).length > 0 ? currentExercise : {
      ...currentExercise,
      blocks: currentExercise.blocks || [createDefaultBlock(currentExercise.exerciseType || 'resistance')],
    };

    const updatedBlocks = [...(exercise.blocks || [])];
    // Applica tutti gli aggiornamenti in una singola operazione
    updatedBlocks[blockIndex] = {
      ...updatedBlocks[blockIndex],
      ...updates,
    };

    const updatedExercise: ProgramExercise = {
      ...exercise,
      blocks: updatedBlocks,
    };

    const updatedDay = {
      ...day,
      exercises: day.exercises.map((ex, i) => (i === exIndex ? updatedExercise : ex)),
    };

    const updatedWeek = {
      ...week,
      days: week.days.map((d, i) => (i === dayIndex ? updatedDay : d)),
    };

    updateWeek(currentWeek, updatedWeek);
  };

  const handleUpdateBlock = (exIndex: number, blockIndex: number, field: keyof ExerciseBlock, value: any) => {
    const currentExercise = day.exercises[exIndex];
    const exercise = getExerciseBlocks(currentExercise).length > 0 ? currentExercise : {
      ...currentExercise,
      blocks: currentExercise.blocks || [createDefaultBlock(currentExercise.exerciseType || 'resistance')],
    };
    
    const updatedBlocks = [...(exercise.blocks || [])];
    updatedBlocks[blockIndex] = {
      ...updatedBlocks[blockIndex],
      [field]: value,
    };

    const updatedExercise: ProgramExercise = {
      ...exercise,
      blocks: updatedBlocks,
    };

    const updatedDay = {
      ...day,
      exercises: day.exercises.map((ex, i) => (i === exIndex ? updatedExercise : ex)),
    };

    const updatedWeek = {
      ...week,
      days: week.days.map((d, i) => (i === dayIndex ? updatedDay : d)),
    };

    updateWeek(currentWeek, updatedWeek);
  };

  const handleAddBlock = (exIndex: number) => {
    const currentExercise = day.exercises[exIndex];
    const exercise = getExerciseBlocks(currentExercise).length > 0 ? currentExercise : {
      ...currentExercise,
      blocks: currentExercise.blocks || [createDefaultBlock(currentExercise.exerciseType || 'resistance')],
    };
    
    const newBlock = createDefaultBlock(exercise.exerciseType || 'resistance');
    const updatedBlocks = [...(exercise.blocks || []), newBlock];

    const updatedExercise: ProgramExercise = {
      ...exercise,
      blocks: updatedBlocks,
    };

    const updatedDay = {
      ...day,
      exercises: day.exercises.map((ex, i) => (i === exIndex ? updatedExercise : ex)),
    };

    const updatedWeek = {
      ...week,
      days: week.days.map((d, i) => (i === dayIndex ? updatedDay : d)),
    };

    updateWeek(currentWeek, updatedWeek);
  };

  const handleDeleteBlock = (exIndex: number, blockIndex: number) => {
    const currentExercise = day.exercises[exIndex];
    const exercise = getExerciseBlocks(currentExercise).length > 0 ? currentExercise : {
      ...currentExercise,
      blocks: currentExercise.blocks || [createDefaultBlock(currentExercise.exerciseType || 'resistance')],
    };
    
    const updatedBlocks = (exercise.blocks || []).filter((_, i) => i !== blockIndex);
    
    if (updatedBlocks.length === 0) {
      // Se rimuoviamo l'ultimo blocco, ricreiamone uno di default
      updatedBlocks.push(createDefaultBlock(exercise.exerciseType || 'resistance'));
    }

    const updatedExercise: ProgramExercise = {
      ...exercise,
      blocks: updatedBlocks,
    };

    const updatedDay = {
      ...day,
      exercises: day.exercises.map((ex, i) => (i === exIndex ? updatedExercise : ex)),
    };

    const updatedWeek = {
      ...week,
      days: week.days.map((d, i) => (i === dayIndex ? updatedDay : d)),
    };

    updateWeek(currentWeek, updatedWeek);
  };

  const handleDeleteExercise = (exIndex: number) => {
    const updatedDay = {
      ...day,
      exercises: day.exercises.filter((_, i) => i !== exIndex),
    };

    const updatedWeek = {
      ...week,
      days: week.days.map((d, i) => (i === dayIndex ? updatedDay : d)),
    };

    updateWeek(currentWeek, updatedWeek);
  };

  const handleOpenLogModal = (exIndex: number, blockIndex?: number) => {
    setSelectedExerciseIndex(exIndex);
    setSelectedBlockIndex(blockIndex ?? null);
    setLogModalOpen(true);
  };

  return (
    <>
      {day.exercises.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Nessun esercizio in questo giorno</p>
          <Button onClick={handleAddExercise} className="lime-gradient text-black hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi Esercizio
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Grid of Exercise Cards */}
          <div className="grid gap-4 grid-cols-1">
            {day.exercises.map((ex, exIndex) => (
              <ExerciseCard
                key={exIndex}
                exercise={ex}
                exerciseIndex={exIndex}
                dayIndex={dayIndex}
                exerciseLibrary={exercises}
                allTechniques={allTechniques}
                customTechniques={customTechniques}
                onUpdate={(field, value) => handleUpdateExercise(exIndex, field, value)}
                onUpdateBlock={(blockIndex, field, value) => handleUpdateBlock(exIndex, blockIndex, field, value)}
                onUpdateBlockBatch={(blockIndex, updates) => handleUpdateBlockBatch(exIndex, blockIndex, updates)}
                onAddBlock={() => handleAddBlock(exIndex)}
                onDeleteBlock={(blockIndex) => handleDeleteBlock(exIndex, blockIndex)}
                onDelete={() => handleDeleteExercise(exIndex)}
                onLog={(blockIndex) => handleOpenLogModal(exIndex, blockIndex)}
              />
            ))}
          </div>

          {/* Add Exercise Button */}
          <Button onClick={handleAddExercise} variant="outline" className="w-full lime-gradient text-black hover:opacity-90 border-primary">
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi Esercizio
          </Button>
        </div>
      )}

      {/* Log Session Modal */}
      {selectedExerciseIndex !== null && (
        <LogSessionModal
          open={logModalOpen}
          onOpenChange={setLogModalOpen}
          dayIndex={dayIndex}
          exerciseIndex={selectedExerciseIndex}
          blockIndex={selectedBlockIndex}
        />
      )}

      {/* Add Exercise Modal - Sempre renderizzato */}
      <Dialog open={showAddExerciseModal} onOpenChange={setShowAddExerciseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleziona Esercizio</DialogTitle>
            <DialogDescription>
              Scegli l'esercizio dalla libreria che vuoi aggiungere a questo giorno.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="exercise-select">Esercizio</Label>
              <Select
                value={selectedExerciseName}
                onValueChange={setSelectedExerciseName}
              >
                <SelectTrigger id="exercise-select">
                  <SelectValue placeholder="Seleziona un esercizio">
                    {selectedExerciseName}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {exercises.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Nessun esercizio disponibile. Aggiungi esercizi dalla libreria.
                    </div>
                  ) : (
                    exercises.map((ex) => (
                      <SelectItem key={ex.name} value={ex.name}>
                        {ex.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddExerciseModal(false)}>
              Annulla
            </Button>
            <Button onClick={handleConfirmAddExercise} disabled={exercises.length === 0 || !selectedExerciseName} className="lime-gradient text-black hover:opacity-90">
              Aggiungi Esercizio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
