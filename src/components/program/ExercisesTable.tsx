import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { ProgramExercise, DEFAULT_TECHNIQUES, REP_RANGES } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Plus, Trash2, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import { LogSessionModal } from './LogSessionModal';
import { TechniqueParamsForm } from './TechniqueParamsForm';
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
      const lastLoad = currentLoads[currentLoads.length - 1] || '80';

      if (newSets > currentLoads.length) {
        // Add more loads
        updatedExercise.targetLoads = [
          ...currentLoads,
          ...Array(newSets - currentLoads.length).fill(lastLoad)
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

  const getMuscleColor = (muscle: string): string => {
    const colorMap: Record<string, string> = {
      'Petto': 'bg-red-600 hover:bg-red-700 text-white',
      'Dorso - Lats': 'bg-blue-600 hover:bg-blue-700 text-white',
      'Dorso - Upper Back': 'bg-blue-500 hover:bg-blue-600 text-white',
      'Dorso - Trapezi': 'bg-blue-700 hover:bg-blue-800 text-white',
      'Deltoidi - Anteriore': 'bg-orange-500 hover:bg-orange-600 text-white',
      'Deltoidi - Laterale': 'bg-orange-600 hover:bg-orange-700 text-white',
      'Deltoidi - Posteriore': 'bg-orange-700 hover:bg-orange-800 text-white',
      'Bicipiti': 'bg-purple-600 hover:bg-purple-700 text-white',
      'Tricipiti': 'bg-pink-600 hover:bg-pink-700 text-white',
      'Avambracci': 'bg-purple-400 hover:bg-purple-500 text-white',
      'Quadricipiti': 'bg-green-600 hover:bg-green-700 text-white',
      'Femorali': 'bg-green-700 hover:bg-green-800 text-white',
      'Glutei': 'bg-green-500 hover:bg-green-600 text-white',
      'Polpacci': 'bg-teal-600 hover:bg-teal-700 text-white',
      'Adduttori': 'bg-emerald-600 hover:bg-emerald-700 text-white',
      'Abduttori': 'bg-emerald-500 hover:bg-emerald-600 text-white',
      'Addome': 'bg-yellow-600 hover:bg-yellow-700 text-white',
      'Obliqui': 'bg-yellow-700 hover:bg-yellow-800 text-white',
      'Core': 'bg-amber-600 hover:bg-amber-700 text-white',
    };
    return colorMap[muscle] || 'bg-gray-600 hover:bg-gray-700 text-white';
  };

  const getExerciseMuscles = (exerciseName: string) => {
    const exercise = exercises.find((e) => e.name === exerciseName);
    if (!exercise || !exercise.muscles || exercise.muscles.length === 0) return null;

    // Sort muscles by percentage (descending)
    const sortedMuscles = [...exercise.muscles].sort((a, b) => b.percent - a.percent);

    return {
      primary: sortedMuscles[0],
      accessories: sortedMuscles.slice(1),
    };
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
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Muscolo</TableHead>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="min-w-[200px]">Esercizio</TableHead>
              <TableHead className="w-20">Sets</TableHead>
              <TableHead className="w-20">Reps</TableHead>
              <TableHead className="min-w-[120px]">Rep Range</TableHead>
              <TableHead className="min-w-[200px]">Carichi (kg)</TableHead>
              <TableHead className="w-20">RPE</TableHead>
              <TableHead className="min-w-[150px]">Tecnica</TableHead>
              <TableHead className="min-w-[120px]">Schema</TableHead>
              <TableHead className="w-24">Coeff.</TableHead>
              <TableHead className="w-24">Rest (s)</TableHead>
              <TableHead className="min-w-[150px]">Note</TableHead>
              <TableHead className="w-16">Config</TableHead>
              <TableHead className="w-20">Log</TableHead>
              <TableHead className="w-16">Del</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {day.exercises.map((ex, exIndex) => {
              const isExpanded = expandedExercises.has(exIndex);
              const isNormalTechnique = ex.technique === 'Normale';
              const muscleData = getExerciseMuscles(ex.exerciseName);

              return (
                <>
                  <TableRow key={exIndex}>
                    <TableCell>
                      {muscleData ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              size="sm"
                              className={getMuscleColor(muscleData.primary.muscle)}
                            >
                              {muscleData.primary.muscle}
                            </Button>
                          </PopoverTrigger>
                          {muscleData.accessories.length > 0 && (
                            <PopoverContent className="w-48">
                              <div className="space-y-2">
                                <p className="text-sm font-semibold">Muscoli Accessori</p>
                                <div className="space-y-1">
                                  {muscleData.accessories.map((muscle, i) => (
                                    <div key={i} className="text-xs">
                                      {muscle.muscle}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </PopoverContent>
                          )}
                        </Popover>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
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
                        disabled={!isNormalTechnique}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={ex.repRange}
                        onValueChange={(v) => handleUpdateExercise(exIndex, 'repRange', v)}
                        disabled={!isNormalTechnique}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(REP_RANGES).map((range) => (
                            <SelectItem key={range} value={range}>
                              {range}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(ex.targetLoads || []).map((load, loadIndex) => (
                          <Input
                            key={loadIndex}
                            type="text"
                            value={load}
                            onChange={(e) => {
                              const newLoads = [...(ex.targetLoads || [])];
                              newLoads[loadIndex] = e.target.value;
                              handleUpdateExercise(exIndex, 'targetLoads', newLoads);
                            }}
                            className="w-16"
                            placeholder={`S${loadIndex + 1}`}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="5"
                        max="10"
                        step="0.5"
                        value={ex.targetRPE}
                        onChange={(e) =>
                          handleUpdateExercise(exIndex, 'targetRPE', parseFloat(e.target.value) || 8)
                        }
                        className="w-20"
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
                          {allTechniques.map((tech) => (
                            <SelectItem key={tech} value={tech}>
                              {tech}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono text-muted-foreground">
                        {ex.techniqueSchema || '-'}
                      </div>
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
                      {!isNormalTechnique && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleExpanded(exIndex)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      )}
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

                  {/* Expanded row for technique params */}
                  {isExpanded && !isNormalTechnique && ex.technique && (
                    <TableRow>
                      <TableCell colSpan={16} className="bg-muted/50 p-4">
                        <TechniqueParamsForm
                          technique={ex.technique}
                          params={ex.techniqueParams || {}}
                          onChange={(params) =>
                            handleUpdateExercise(exIndex, 'techniqueParams', params)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
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
