import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { LoggedSet, LoggedSession } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import { calculateSessionMetrics } from '@/lib/calculations';

interface EditSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: LoggedSession;
}

export function EditSessionModal({
  open,
  onOpenChange,
  session,
}: EditSessionModalProps) {
  const { updateLoggedSession } = useApp();
  const [tempLogSets, setTempLogSets] = useState<LoggedSet[]>([]);

  useEffect(() => {
    if (open && session) {
      // Initialize with existing sets
      setTempLogSets(session.sets);
    }
  }, [open, session]);

  const handleUpdateSet = (index: number, field: keyof LoggedSet, value: string) => {
    const updated = [...tempLogSets];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setTempLogSets(updated);
  };

  const handleAddSet = () => {
    const lastSet = tempLogSets[tempLogSets.length - 1];
    const newSetNum = lastSet ? lastSet.setNum + 1 : 1;
    const lastLoad = lastSet?.load || '80';

    if (session.technique === 'Normale') {
      setTempLogSets([
        ...tempLogSets,
        {
          reps: '',
          load: lastLoad,
          rpe: '',
          setNum: newSetNum,
          clusterNum: 1,
        },
      ]);
    } else {
      // For special techniques, add clusters based on existing pattern
      const clustersInLastSet = tempLogSets.filter(s => s.setNum === lastSet.setNum).length;
      const newSets: LoggedSet[] = [];
      for (let clusterNum = 1; clusterNum <= clustersInLastSet; clusterNum++) {
        newSets.push({
          reps: '',
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
    const metrics = calculateSessionMetrics(tempLogSets);

    const updatedSession: LoggedSession = {
      ...session,
      sets: tempLogSets,
      totalReps: metrics.totalReps,
      avgRPE: metrics.avgRPE,
      completion: session.targetReps > 0 ? (metrics.totalReps / session.targetReps) * 100 : 0,
    };

    updateLoggedSession(updatedSession);
    onOpenChange(false);
  };

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
          <DialogTitle>Modifica Sessione</DialogTitle>
          <DialogDescription>
            {session.exercise} - {session.technique}
            {session.techniqueSchema && ` (${session.techniqueSchema})`}
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
                        {session.technique !== 'Normale' && (
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
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600">{metrics.totalReps}</div>
                <div className="text-xs text-muted-foreground">Reps Totali</div>
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
            Salva Modifiche
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
