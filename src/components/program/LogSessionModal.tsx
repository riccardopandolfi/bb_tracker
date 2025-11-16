import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { LoggedSet, LoggedSession } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import { parseSchema, calculateBlockTargetReps, calculateSessionMetrics } from '@/lib/calculations';
import { getExerciseBlocks } from '@/lib/exerciseUtils';

interface LogSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayIndex: number;
  exerciseIndex: number;
  blockIndex?: number | null;
}

export function LogSessionModal({
  open,
  onOpenChange,
  dayIndex,
  exerciseIndex,
  blockIndex,
}: LogSessionModalProps) {
  const { currentWeek, getCurrentWeeks, currentProgramId, addLoggedSession } = useApp();
  const weeks = getCurrentWeeks();
  const week = weeks[currentWeek];
  const day = week?.days[dayIndex];
  const exercise = day?.exercises[exerciseIndex];
  
  // Ottieni il blocco specifico (o il primo se non specificato)
  const blocks = exercise ? getExerciseBlocks(exercise) : [];
  const currentBlockIndex = blockIndex !== null && blockIndex !== undefined ? blockIndex : (blocks.length > 0 ? 0 : null);
  const block = currentBlockIndex !== null ? blocks[currentBlockIndex] : null;

  const [tempLogSets, setTempLogSets] = useState<LoggedSet[]>([]);
  const [sessionNotes, setSessionNotes] = useState<string>('');

  useEffect(() => {
    if (open && exercise && block) {
      // Initialize temp log sets
      initializeTempSets();
      setSessionNotes('');
    }
  }, [open, exercise, block]);

  const initializeTempSets = () => {
    if (!block || !block.sets || !block.technique) return;

    const sets: LoggedSet[] = [];

    if (block.technique === 'Normale') {
      // Normal technique: N sets
      for (let setNum = 1; setNum <= block.sets; setNum++) {
        sets.push({
          reps: block.repsBase || '',
          load: block.targetLoads?.[setNum - 1] || '80',
          rpe: '',
          setNum,
          clusterNum: 1,
        });
      }
    } else {
      // Special technique: N sets × M clusters
      const clusters = parseSchema(block.techniqueSchema || '');
      if (clusters.length === 0) {
        alert('Schema tecnica non valido!');
        return;
      }

      // Usa targetLoadsByCluster se disponibile, altrimenti fallback a targetLoads
      const loadsByCluster = block.targetLoadsByCluster || 
        (block.targetLoads?.map(load => Array(clusters.length).fill(load)) || 
         Array(block.sets || 1).fill(Array(clusters.length).fill('80')));
      
      for (let setNum = 1; setNum <= block.sets; setNum++) {
        const setLoads = loadsByCluster[setNum - 1] || Array(clusters.length).fill('80');
        for (let clusterNum = 1; clusterNum <= clusters.length; clusterNum++) {
          sets.push({
            reps: clusters[clusterNum - 1]?.toString() || '',
            load: setLoads[clusterNum - 1] || '80',
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
    if (!block || !block.technique) return;

    const lastSet = tempLogSets[tempLogSets.length - 1];
    const newSetNum = lastSet ? lastSet.setNum + 1 : 1;
    const lastLoad = lastSet?.load || '80';

    if (block.technique === 'Normale') {
      setTempLogSets([
        ...tempLogSets,
        {
          reps: block.repsBase || '',
          load: lastLoad,
          rpe: '',
          setNum: newSetNum,
          clusterNum: 1,
        },
      ]);
    } else {
      const clusters = parseSchema(block.techniqueSchema || '');
      const newSets: LoggedSet[] = [];
      for (let clusterNum = 1; clusterNum <= clusters.length; clusterNum++) {
        newSets.push({
          reps: clusters[clusterNum - 1]?.toString() || '',
          load: lastLoad,
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
    if (!exercise || !block) return;
    if (currentProgramId == null) {
      alert('Seleziona un programma prima di loggare una sessione.');
      return;
    }
    // Per tecniche normali richiedi repRange, per tecniche speciali no
    const isNormalTechnique = block.technique === 'Normale';
    if (!block.technique || (isNormalTechnique && !block.repRange) || block.coefficient === undefined || block.targetRPE === undefined) return;

    const targetReps = calculateBlockTargetReps(block);
    const metrics = calculateSessionMetrics(tempLogSets);

    const session: LoggedSession = {
      id: Date.now(),
      programId: currentProgramId,
      date: new Date().toISOString().split('T')[0],
      weekNum: currentWeek,
      exercise: exercise.exerciseName,
      dayIndex: dayIndex,
      dayName: day?.name,
      blockIndex: currentBlockIndex !== null ? currentBlockIndex : 0,
      technique: block.technique,
      techniqueSchema: block.techniqueSchema || '',
      repRange: isNormalTechnique ? (block.repRange || '8-12') : '8-12', // Solo per normali, altrimenti default (non usato)
      coefficient: block.coefficient,
      // Per tecniche speciali con targetLoadsByCluster, salva i carichi come stringhe separate da '/'
      // Es: ["80/70/60", "70/60/50"] per set con carichi diversi per cluster
      targetLoads: block.targetLoadsByCluster && block.targetLoadsByCluster.length > 0
        ? block.targetLoadsByCluster.map(setLoads => setLoads.join('/'))
        : (block.targetLoads || []),
      targetRPE: block.targetRPE,
      sets: tempLogSets,
      totalReps: metrics.totalReps,
      targetReps,
      avgRPE: metrics.avgRPE,
      completion: targetReps > 0 ? (metrics.totalReps / targetReps) * 100 : 0,
      blockRest: block.blockRest,
      notes: sessionNotes.trim() || undefined,
    };

    addLoggedSession(session);
    onOpenChange(false);
  };

  if (!exercise || !block) return null;

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
            {exercise.exerciseName} - Blocco {currentBlockIndex !== null ? currentBlockIndex + 1 : 1} - {block.technique}
            {block.techniqueSchema && ` (${block.techniqueSchema})`}
            {blocks.length > 1 && ` - ${blocks.length} blocchi totali`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Sets */}
          {Object.entries(setGroups).map(([setNumStr, sets]) => {
            const setNum = parseInt(setNumStr, 10);
            return (
              <Card key={setNum} className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-sm font-medium">
                      S{setNum}
                    </span>
                  </h4>
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
                      <div key={clusterIndex} className="flex gap-2 items-end bg-gray-50 p-2 rounded-md">
                        {block.technique !== 'Normale' && (
                          <div className="text-sm font-medium text-gray-600 w-16">
                            C{set.clusterNum}
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

          {/* Note */}
          <div>
            <Label className="text-sm font-medium mb-2">Note (opzionale)</Label>
            <Textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Aggiungi note sulla sessione..."
              className="min-h-[80px]"
            />
          </div>
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
