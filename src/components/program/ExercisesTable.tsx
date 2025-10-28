import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { ProgramExercise, TECHNIQUES } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Trash2, ClipboardList } from 'lucide-react';
import { LogSessionModal } from './LogSessionModal';

interface ExercisesTableProps {
  dayIndex: number;
}

export function ExercisesTable({ dayIndex }: ExercisesTableProps) {
  const { currentWeek, weeks, updateWeek, exercises } = useApp();
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);

  const week = weeks[currentWeek];
  const day = week?.days[dayIndex];

  if (!day) {
    return <div>Giorno non trovato</div>;
  }

  const handleAddExercise = () => {
    const newExercise: ProgramExercise = {
      exerciseName: exercises[0]?.name || '',
      rest: 90,
      sets: 3,
      repsBase: '10',
      repRange: '8-12',
      targetLoad: '80',
      technique: 'Normale',
      techniqueSchema: '',
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

  const handleUpdateExercise = (
    exIndex: number,
    field: keyof ProgramExercise,
    value: any
  ) => {
    const updatedExercise = {
      ...day.exercises[exIndex],
      [field]: value,
    };

    // Handle technique change logic
    if (field === 'technique') {
      if (value !== 'Normale') {
        updatedExercise.repsBase = '';
      } else {
        updatedExercise.techniqueSchema = '';
        updatedExercise.repsBase = '10';
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

  const getExerciseMuscles = (exerciseName: string) => {
    const exercise = exercises.find((e) => e.name === exerciseName);
    return exercise?.muscles.map((m) => m.muscle).join(', ') || '-';
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
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="min-w-[200px]">Esercizio</TableHead>
              <TableHead className="min-w-[150px]">Muscoli</TableHead>
              <TableHead className="w-20">Sets</TableHead>
              <TableHead className="w-20">Reps</TableHead>
              <TableHead className="w-24">Carico</TableHead>
              <TableHead className="min-w-[150px]">Tecnica</TableHead>
              <TableHead className="min-w-[120px]">Schema</TableHead>
              <TableHead className="w-24">Coeff.</TableHead>
              <TableHead className="w-24">Rest (s)</TableHead>
              <TableHead className="min-w-[150px]">Note</TableHead>
              <TableHead className="w-20">Log</TableHead>
              <TableHead className="w-16">Del</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {day.exercises.map((ex, exIndex) => (
              <TableRow key={exIndex}>
                <TableCell>{exIndex + 1}</TableCell>
                <TableCell>
                  <Select
                    value={ex.exerciseName}
                    onValueChange={(v) => handleUpdateExercise(exIndex, 'exerciseName', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {exercises.map((exercise) => (
                        <SelectItem key={exercise.name} value={exercise.name}>
                          {exercise.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {getExerciseMuscles(ex.exerciseName)}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    value={ex.sets}
                    onChange={(e) =>
                      handleUpdateExercise(exIndex, 'sets', parseInt(e.target.value, 10) || 1)
                    }
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={ex.repsBase}
                    onChange={(e) => handleUpdateExercise(exIndex, 'repsBase', e.target.value)}
                    disabled={ex.technique !== 'Normale'}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={ex.targetLoad}
                    onChange={(e) => handleUpdateExercise(exIndex, 'targetLoad', e.target.value)}
                    className="w-24"
                    placeholder="kg"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={ex.technique}
                    onValueChange={(v) => handleUpdateExercise(exIndex, 'technique', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TECHNIQUES.map((tech) => (
                        <SelectItem key={tech} value={tech}>
                          {tech}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={ex.techniqueSchema}
                    onChange={(e) =>
                      handleUpdateExercise(exIndex, 'techniqueSchema', e.target.value)
                    }
                    disabled={ex.technique === 'Normale'}
                    className="w-28"
                    placeholder="10+10+10"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={ex.coefficient}
                    onChange={(e) =>
                      handleUpdateExercise(
                        exIndex,
                        'coefficient',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-24"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    value={ex.rest}
                    onChange={(e) =>
                      handleUpdateExercise(exIndex, 'rest', parseInt(e.target.value, 10) || 0)
                    }
                    className="w-24"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={ex.notes}
                    onChange={(e) => handleUpdateExercise(exIndex, 'notes', e.target.value)}
                    className="min-w-[150px]"
                    placeholder="Note..."
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleOpenLogModal(exIndex)}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <ClipboardList className="w-4 h-4" />
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteExercise(exIndex)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button onClick={handleAddExercise} variant="outline">
        <Plus className="w-4 h-4 mr-2" />
        Aggiungi Esercizio
      </Button>

      {/* Log Modal */}
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
