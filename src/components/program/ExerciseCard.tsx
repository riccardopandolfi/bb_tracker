import { useState } from 'react';
import { ProgramExercise, Exercise, REP_RANGES } from '@/types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { ChevronDown, ChevronUp, Trash2, ClipboardList } from 'lucide-react';
import { TechniqueParamsForm } from './TechniqueParamsForm';

interface ExerciseCardProps {
  exercise: ProgramExercise;
  exerciseIndex: number;
  exerciseLibrary: Exercise[];
  allTechniques: string[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (field: keyof ProgramExercise, value: any) => void;
  onDelete: () => void;
  onLog: () => void;
}

export function ExerciseCard({
  exercise,
  exerciseIndex,
  exerciseLibrary,
  allTechniques,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onLog,
}: ExerciseCardProps) {
  const [showLoadModal, setShowLoadModal] = useState(false);

  const getMuscleColor = (muscle: string): string => {
    const colorMap: Record<string, string> = {
      'Petto': 'bg-red-600 text-white',
      'Dorso - Lats': 'bg-blue-600 text-white',
      'Dorso - Upper Back': 'bg-blue-500 text-white',
      'Dorso - Trapezi': 'bg-blue-700 text-white',
      'Deltoidi - Anteriore': 'bg-orange-600 text-white',
      'Deltoidi - Laterale': 'bg-orange-500 text-white',
      'Deltoidi - Posteriore': 'bg-orange-700 text-white',
      'Bicipiti': 'bg-purple-600 text-white',
      'Tricipiti': 'bg-pink-600 text-white',
      'Avambracci': 'bg-purple-400 text-white',
      'Quadricipiti': 'bg-green-600 text-white',
      'Femorali': 'bg-green-700 text-white',
      'Glutei': 'bg-green-800 text-white',
      'Polpacci': 'bg-green-500 text-white',
      'Adduttori': 'bg-teal-600 text-white',
      'Abduttori': 'bg-teal-500 text-white',
      'Addome': 'bg-yellow-600 text-white',
      'Obliqui': 'bg-yellow-500 text-white',
      'Core': 'bg-yellow-700 text-white',
    };
    return colorMap[muscle] || 'bg-gray-600 text-white';
  };

  const getPrimaryMuscle = () => {
    const libraryEx = exerciseLibrary.find((e) => e.name === exercise.exerciseName);
    if (!libraryEx || !libraryEx.muscles || libraryEx.muscles.length === 0) return null;
    return libraryEx.muscles.reduce((prev, curr) =>
      curr.percent > prev.percent ? curr : prev
    );
  };

  const primaryMuscle = getPrimaryMuscle();
  const isNormalTechnique = exercise.technique === 'Normale';
  const loadsDisplay = exercise.targetLoads?.join('-') || '0';

  // Cardio view
  if (exercise.exerciseType === 'cardio') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-sm font-medium">
                  🏃 Cardio
                </span>
                <span className="text-sm text-muted-foreground">#{exerciseIndex + 1}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{exercise.exerciseName}</h3>
              <div className="text-sm text-muted-foreground">
                {exercise.duration || 0} minuti
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <div>
                <Label className="text-xs">Durata (minuti)</Label>
                <Input
                  type="number"
                  value={exercise.duration || 0}
                  onChange={(e) => onUpdate('duration', parseInt(e.target.value) || 0)}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Note</Label>
                <Input
                  value={exercise.notes}
                  onChange={(e) => onUpdate('notes', e.target.value)}
                  placeholder="Aggiungi note..."
                  className="h-9"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Resistance view
  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          {/* Header - Always Visible */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {primaryMuscle && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMuscleColor(primaryMuscle.muscle)}`}>
                    {primaryMuscle.muscle}
                  </span>
                )}
                <span className="text-sm text-muted-foreground">#{exerciseIndex + 1}</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">{exercise.exerciseName}</h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {isNormalTechnique ? (
                  <span>{exercise.sets || 0} × {exercise.repsBase || 0}</span>
                ) : (
                  <span>{exercise.sets || 0} × {exercise.techniqueSchema || '-'}</span>
                )}
                <span>•</span>
                <span>@ {loadsDisplay}kg</span>
                {isNormalTechnique && (
                  <>
                    <span>•</span>
                    <span>{exercise.repRange}</span>
                  </>
                )}
                <span>•</span>
                <span>RPE {exercise.targetRPE?.toFixed(1) || 0}</span>
              </div>
              {!isNormalTechnique && (
                <div className="text-xs text-muted-foreground mt-1">
                  {exercise.technique}
                </div>
              )}
            </div>
            <div className="flex gap-1">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <Button variant="ghost" size="icon" onClick={onLog}>
                <ClipboardList className="w-4 h-4 text-blue-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>

          {/* Expanded Content */}
          <CollapsibleContent>
            <div className="pt-4 border-t space-y-4">
              {/* Esercizio Select */}
              <div>
                <Label className="text-xs">Esercizio</Label>
                <Select
                  value={exercise.exerciseName}
                  onValueChange={(v) => onUpdate('exerciseName', v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Seleziona esercizio">
                      {exercise.exerciseName}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {exerciseLibrary
                      .filter(e => e.type === 'resistance')
                      .map((ex) => (
                        <SelectItem key={ex.name} value={ex.name}>
                          {ex.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tecnica */}
              <div>
                <Label className="text-xs">Tecnica</Label>
                <Select
                  value={exercise.technique}
                  onValueChange={(v) => onUpdate('technique', v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Seleziona tecnica">
                      {exercise.technique}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {allTechniques.map((tech) => (
                      <SelectItem key={tech} value={tech}>
                        {tech}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Technique Params Form (solo per tecniche speciali) */}
              {!isNormalTechnique && exercise.technique && (
                <TechniqueParamsForm
                  technique={exercise.technique}
                  params={exercise.techniqueParams || {}}
                  onChange={(params) => onUpdate('techniqueParams', params)}
                />
              )}

              {/* Sets & Reps (condizionale) */}
              {isNormalTechnique ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Sets</Label>
                    <Input
                      type="number"
                      value={exercise.sets || 0}
                      onChange={(e) => onUpdate('sets', parseInt(e.target.value) || 0)}
                      min="1"
                      max="10"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Reps Base</Label>
                    <Input
                      type="number"
                      value={exercise.repsBase || ''}
                      onChange={(e) => onUpdate('repsBase', e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="text-xs">Sets (numero di serie complete)</Label>
                  <Input
                    type="number"
                    value={exercise.sets || 0}
                    onChange={(e) => onUpdate('sets', parseInt(e.target.value) || 0)}
                    min="1"
                    max="10"
                    className="h-9"
                  />
                </div>
              )}

              {/* Rep Range (solo per tecniche normali) */}
              {isNormalTechnique && (
                <div>
                  <Label className="text-xs">Rep Range</Label>
                  <Select
                    value={exercise.repRange}
                    onValueChange={(v) => onUpdate('repRange', v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Seleziona range">
                        {exercise.repRange && `${exercise.repRange} - ${REP_RANGES[exercise.repRange as keyof typeof REP_RANGES]?.focus || ''}`}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(REP_RANGES).map((range) => (
                        <SelectItem key={range} value={range}>
                          {range} - {REP_RANGES[range as keyof typeof REP_RANGES].focus}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Carichi */}
              <div>
                <Label className="text-xs">Carichi per Set (kg)</Label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 px-3 py-2 border rounded-md bg-muted text-sm">
                    {exercise.targetLoads?.join(' - ') || '-'}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLoadModal(true)}
                  >
                    ✏️ Modifica
                  </Button>
                </div>
              </div>

              {/* Load Modal */}
              {showLoadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <Card className="w-full max-w-md mx-4">
                    <CardContent className="pt-6 space-y-3">
                      <h3 className="text-lg font-semibold mb-4">Modifica Carichi</h3>
                      {exercise.targetLoads?.map((load, i) => (
                        <div key={i}>
                          <Label className="text-xs">Set {i + 1}</Label>
                          <Input
                            type="number"
                            value={load}
                            onChange={(e) => {
                              const newLoads = [...(exercise.targetLoads || [])];
                              newLoads[i] = e.target.value;
                              onUpdate('targetLoads', newLoads);
                            }}
                            className="h-9"
                          />
                        </div>
                      ))}
                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setShowLoadModal(false)}
                        >
                          Chiudi
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Intensità */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Coefficiente</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={exercise.coefficient || 0}
                    onChange={(e) => onUpdate('coefficient', parseFloat(e.target.value) || 0)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">RPE Target</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="5"
                    max="10"
                    value={exercise.targetRPE || 0}
                    onChange={(e) => onUpdate('targetRPE', parseFloat(e.target.value) || 0)}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Recupero */}
              <div>
                <Label className="text-xs">Recupero (secondi)</Label>
                <Input
                  type="number"
                  value={exercise.rest || 0}
                  onChange={(e) => onUpdate('rest', parseInt(e.target.value) || 0)}
                  className="h-9"
                />
              </div>

              {/* Note */}
              <div>
                <Label className="text-xs">Note</Label>
                <Input
                  value={exercise.notes}
                  onChange={(e) => onUpdate('notes', e.target.value)}
                  placeholder="Aggiungi note..."
                  className="h-9"
                />
              </div>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}
