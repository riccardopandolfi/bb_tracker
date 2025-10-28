import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Exercise, MuscleDistribution, MUSCLE_GROUPS } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

export function ExerciseLibrary() {
  const { exercises, addExercise, updateExercise, deleteExercise } = useApp();

  const handleAddExercise = () => {
    const newExercise: Exercise = {
      name: 'Nuovo Esercizio',
      muscles: [{ muscle: 'Petto', percent: 100 }],
    };
    addExercise(newExercise);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Libreria Esercizi</h2>
          <p className="text-muted-foreground">Gestisci i tuoi esercizi e la distribuzione muscolare</p>
        </div>
        <Button onClick={handleAddExercise} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuovo Esercizio
        </Button>
      </div>

      {/* Info Box */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Ogni esercizio può coinvolgere fino a 3 gruppi muscolari. La somma delle percentuali deve essere 100%.
        </AlertDescription>
      </Alert>

      {/* Exercise Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {exercises.map((exercise, index) => (
          <ExerciseCard
            key={index}
            exercise={exercise}
            index={index}
            onUpdate={updateExercise}
            onDelete={deleteExercise}
          />
        ))}
      </div>
    </div>
  );
}

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  onUpdate: (index: number, exercise: Exercise) => void;
  onDelete: (index: number) => void;
}

function ExerciseCard({ exercise, index, onUpdate, onDelete }: ExerciseCardProps) {
  const [localExercise, setLocalExercise] = useState<Exercise>(exercise);

  const totalPercent = localExercise.muscles.reduce((sum, m) => sum + m.percent, 0);
  const isValid = totalPercent === 100;

  const handleNameChange = (name: string) => {
    const updated = { ...localExercise, name };
    setLocalExercise(updated);
    onUpdate(index, updated);
  };

  const handleMuscleChange = (muscleIndex: number, field: keyof MuscleDistribution, value: any) => {
    const updated = { ...localExercise };
    updated.muscles[muscleIndex] = {
      ...updated.muscles[muscleIndex],
      [field]: field === 'percent' ? parseInt(value, 10) || 0 : value,
    };
    setLocalExercise(updated);
    onUpdate(index, updated);
  };

  const handleAddMuscle = () => {
    if (localExercise.muscles.length >= 3) return;
    const updated = {
      ...localExercise,
      muscles: [...localExercise.muscles, { muscle: 'Petto' as any, percent: 0 }],
    };
    setLocalExercise(updated);
    onUpdate(index, updated);
  };

  const handleRemoveMuscle = (muscleIndex: number) => {
    if (localExercise.muscles.length <= 1) return;
    const updated = {
      ...localExercise,
      muscles: localExercise.muscles.filter((_, i) => i !== muscleIndex),
    };
    setLocalExercise(updated);
    onUpdate(index, updated);
  };

  return (
    <Card className={!isValid ? 'border-red-500 border-2' : ''}>
      <CardHeader>
        <CardTitle>
          <Input
            value={localExercise.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="font-bold text-lg"
          />
        </CardTitle>
        <CardDescription>Distribuzione Muscolare</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Muscles */}
        {localExercise.muscles.map((muscle, muscleIndex) => (
          <div key={muscleIndex} className="flex gap-2 items-end">
            <div className="flex-1">
              <Label>Muscolo {muscleIndex + 1}</Label>
              <Select
                value={muscle.muscle}
                onValueChange={(value) => handleMuscleChange(muscleIndex, 'muscle', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MUSCLE_GROUPS.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24">
              <Label>%</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={muscle.percent}
                onChange={(e) => handleMuscleChange(muscleIndex, 'percent', e.target.value)}
              />
            </div>
            {localExercise.muscles.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveMuscle(muscleIndex)}
                className="mb-0"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        ))}

        {/* Add Muscle Button */}
        {localExercise.muscles.length < 3 && (
          <Button variant="outline" size="sm" onClick={handleAddMuscle} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi Muscolo
          </Button>
        )}

        {/* Total Percentage */}
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-sm font-medium">Totale:</span>
          <span
            className={`text-sm font-bold ${
              isValid ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {totalPercent}%
          </span>
        </div>

        {/* Delete Exercise */}
        <Button variant="destructive" size="sm" onClick={() => onDelete(index)} className="w-full">
          <Trash2 className="w-4 h-4 mr-2" />
          Elimina Esercizio
        </Button>
      </CardContent>
    </Card>
  );
}
