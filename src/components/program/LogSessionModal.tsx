import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { LoggedSet, LoggedSession } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import { parseSchema, calculateTargetReps, calculateSessionMetrics } from '@/lib/calculations';

interface LogSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayIndex: number;
  exerciseIndex: number;
}

export function LogSessionModal({
  open,
  onOpenChange,
  dayIndex,
  exerciseIndex,
}: LogSessionModalProps) {
  const { currentWeek, weeks, addLoggedSession } = useApp();
  const week = weeks[currentWeek];
  const day = week?.days[dayIndex];
  const exercise = day?.exercises[exerciseIndex];

  const [tempLogSets, setTempLogSets] = useState<LoggedSet[]>([]);

  useEffect(() => {
    if (open && exercise) {
      // Initialize temp log sets
      initializeTempSets();
    }
  }, [open, exercise]);

  const initializeTempSets = () => {
    if (!exercise) return;

    const sets: LoggedSet[] = [];

    if (exercise.technique === 'Normale') {
      // Normal technique: N sets
      for (let setNum = 1; setNum <= exercise.sets; setNum++) {
        sets.push({
          reps: exercise.repsBase || '',
          load: exercise.targetLoad || '',
          rpe: '',
          setNum,
          clusterNum: 1,
        });
      }
    } else {
      // Special technique: N sets × M clusters
      const clusters = parseSchema(exercise.techniqueSchema);
      if (clusters.length === 0) {
        alert('Schema tecnica non valido!');
        return;
      }

      for (let setNum = 1; setNum <= exercise.sets; setNum++) {
        for (let clusterNum = 1; clusterNum <= clusters.length; clusterNum++) {
          sets.push({
            reps: clusters[clusterNum - 1]?.toString() || '',
            load: exercise.targetLoad || '',
            rpe: '',
            setNum,
            clusterNum,
          });
        }
      }
    }

    setTempLogSets(sets);
  };

  const handleUpdateSet = (index: number, field: keyof LoggedSet, value: string) => {
    const updated = [...tempLogSets];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setTempLogSets(updated);
  };

  const handleAddSet = () => {
    if (!exercise) return;

    const lastSet = tempLogSets[tempLogSets.length - 1];
    const newSetNum = lastSet ? lastSet.setNum + 1 : 1;

    if (exercise.technique === 'Normale') {
      setTempLogSets([
        ...tempLogSets,
        {
          reps: exercise.repsBase || '',
          load: exercise.targetLoad || '',
          rpe: '',
          setNum: newSetNum,
          clusterNum: 1,
        },
      ]);
    } else {
      const clusters = parseSchema(exercise.techniqueSchema);
      const newSets: LoggedSet[] = [];
      for (let clusterNum = 1; clusterNum <= clusters.length; clusterNum++) {
        newSets.push({
          reps: clusters[clusterNum - 1]?.toString() || '',
          load: exercise.targetLoad || '',
          rpe: '',
          setNum: newSetNum,
          clusterNum,
        });
      }
      setTempLogSets([...tempLogSets, ...newSets]);
    }
  };

  const handleRemoveSet = (setNum: number) => {
    setTempLogSets(tempLogSets.filter((s) => s.setNum !== setNum));
  };

  const handleSave = () => {
    if (!exercise) return;

    const targetReps = calculateTargetReps(exercise);
    const metrics = calculateSessionMetrics(tempLogSets);

    const session: LoggedSession = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      weekNum: currentWeek,
      exercise: exercise.exerciseName,
      technique: exercise.technique,
      techniqueSchema: exercise.techniqueSchema,
      repRange: exercise.repRange,
      coefficient: exercise.coefficient,
      sets: tempLogSets,
      totalReps: metrics.totalReps,
      targetReps,
      totalTonnage: metrics.totalTonnage,
      avgRPE: metrics.avgRPE,
      completion: targetReps > 0 ? (metrics.totalReps / targetReps) * 100 : 0,
    };

    addLoggedSession(session);
    onOpenChange(false);
  };

  if (!exercise) return null;

  const metrics = calculateSessionMetrics(tempLogSets);

  // Group sets by setNum
  const setGroups = tempLogSets.reduce((acc, set) => {
    if (!acc[set.setNum]) acc[set.setNum] = [];
    acc[set.setNum].push(set);
    return acc;
  }, {} as Record<number, LoggedSet[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Sessione</DialogTitle>
          <DialogDescription>
            {exercise.exerciseName} - {exercise.technique}
            {exercise.techniqueSchema && ` (${exercise.techniqueSchema})`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Sets */}
          {Object.entries(setGroups).map(([setNumStr, sets]) => {
            const setNum = parseInt(setNumStr, 10);
            return (
              <Card key={setNum} className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold">Set {setNum}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSet(setNum)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {sets.map((set, clusterIndex) => {
                    const globalIndex = tempLogSets.findIndex(
                      (s) => s.setNum === set.setNum && s.clusterNum === set.clusterNum
                    );

                    return (
                      <div key={clusterIndex} className="flex gap-2 items-end">
                        {exercise.technique !== 'Normale' && (
                          <div className="text-sm font-medium text-muted-foreground w-20">
                            Cluster {set.clusterNum}
                          </div>
                        )}
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Reps</Label>
                            <Input
                              type="number"
                              value={set.reps}
                              onChange={(e) =>
                                handleUpdateSet(globalIndex, 'reps', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Carico (kg)</Label>
                            <Input
                              type="text"
                              value={set.load}
                              onChange={(e) =>
                                handleUpdateSet(globalIndex, 'load', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs">RPE</Label>
                            <Input
                              type="number"
                              min="5"
                              max="10"
                              step="0.5"
                              value={set.rpe}
                              onChange={(e) =>
                                handleUpdateSet(globalIndex, 'rpe', e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}

          {/* Add Set Button */}
          <Button variant="outline" onClick={handleAddSet} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi Set
          </Button>

          {/* Summary Box */}
          <Card className="p-4 bg-muted">
            <h4 className="font-bold mb-3">Riepilogo Live</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600">{metrics.totalReps}</div>
                <div className="text-xs text-muted-foreground">Reps Totali</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.totalTonnage.toFixed(1)} kg
                </div>
                <div className="text-xs text-muted-foreground">Tonnellaggio</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {metrics.avgRPE > 0 ? metrics.avgRPE.toFixed(1) : '-'}
                </div>
                <div className="text-xs text-muted-foreground">RPE Medio</div>
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} className="w-full">
            <CheckCircle className="w-4 h-4 mr-2" />
            Salva Sessione
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
