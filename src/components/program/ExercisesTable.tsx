import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { ProgramExercise, DEFAULT_TECHNIQUES } from '@/types';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import { LogSessionModal } from './LogSessionModal';
import { ExerciseCard } from './ExerciseCard';
import { generateSchemaFromParams } from '@/lib/techniques';

interface ExercisesTableProps {
  dayIndex: number;
}

export function ExercisesTable({ dayIndex }: ExercisesTableProps) {
  const { currentWeek, weeks, updateWeek, exercises, customTechniques } = useApp();
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(new Set());

  const week = weeks[currentWeek];
  const day = week?.days[dayIndex];
  const allTechniques = [...DEFAULT_TECHNIQUES, ...customTechniques.map(t => t.name)];

  if (!day) {
    return <div>Giorno non trovato</div>;
  }

  const handleAddExercise = () => {
    const firstExercise = exercises[0];
    const newExercise: ProgramExercise = {
      exerciseName: firstExercise?.name || '',
      exerciseType: firstExercise?.type || 'resistance',
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
  };

  const handleUpdateExercise = (exIndex: number, field: keyof ProgramExercise, value: any) => {
    const updatedExercise: ProgramExercise = {
      ...day.exercises[exIndex],
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

  const handleOpenLogModal = (exIndex: number) => {
    setSelectedExerciseIndex(exIndex);
    setLogModalOpen(true);
  };

  const toggleExpanded = (exIndex: number) => {
    const newExpanded = new Set(expandedExercises);
    if (newExpanded.has(exIndex)) {
      newExpanded.delete(exIndex);
    } else {
      newExpanded.add(exIndex);
    }
    setExpandedExercises(newExpanded);
  };

  if (day.exercises.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Nessun esercizio in questo giorno</p>
        <Button onClick={handleAddExercise}>
          <Plus className="w-4 h-4 mr-2" />
          Aggiungi Esercizio
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grid of Exercise Cards */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {day.exercises.map((ex, exIndex) => (
          <ExerciseCard
            key={exIndex}
            exercise={ex}
            exerciseIndex={exIndex}
            exerciseLibrary={exercises}
            allTechniques={allTechniques}
            isExpanded={expandedExercises.has(exIndex)}
            onToggleExpand={() => toggleExpanded(exIndex)}
            onUpdate={(field, value) => handleUpdateExercise(exIndex, field, value)}
            onDelete={() => handleDeleteExercise(exIndex)}
            onLog={() => handleOpenLogModal(exIndex)}
          />
        ))}
      </div>

      {/* Add Exercise Button */}
      <Button onClick={handleAddExercise} variant="outline" className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Aggiungi Esercizio
      </Button>

      {/* Log Session Modal */}
      {selectedExerciseIndex !== null && (
        <LogSessionModal
          open={logModalOpen}
          onOpenChange={setLogModalOpen}
          dayIndex={dayIndex}
          exerciseIndex={selectedExerciseIndex}
        />
      )}
    </div>
  );
}
