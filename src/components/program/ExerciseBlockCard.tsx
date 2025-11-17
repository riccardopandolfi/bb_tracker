import { useState, useEffect } from 'react';
import { ExerciseBlock, Exercise, REP_RANGES } from '@/types';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Trash2, Dumbbell, Clock, FileText } from 'lucide-react';
import { TechniqueParamsForm } from './TechniqueParamsForm';
import { generateSchemaFromParams, TECHNIQUE_DEFINITIONS } from '@/lib/techniques';
import { parseSchema } from '@/lib/calculations';
import { useApp } from '@/contexts/AppContext';
import { adjustColor, getContrastTextColor } from '@/lib/colorUtils';

interface ExerciseBlockCardProps {
  block: ExerciseBlock;
  blockIndex: number;
  exerciseType: 'resistance' | 'cardio';
  exerciseLibrary?: Exercise[];
  exerciseName?: string; // Nome dell'esercizio per determinare il muscolo
  allTechniques: string[];
  customTechniques: any[];
  onUpdate: (blockIndex: number, field: keyof ExerciseBlock, value: any) => void;
  onUpdateBatch?: (blockIndex: number, updates: Partial<ExerciseBlock>) => void;
  onDelete: (blockIndex: number) => void;
  isLast: boolean;
  canDelete: boolean;
}

export function ExerciseBlockCard({
  block,
  blockIndex,
  exerciseType,
  exerciseLibrary,
  exerciseName,
  allTechniques,
  customTechniques,
  onUpdate,
  onUpdateBatch,
  onDelete,
  isLast,
  canDelete,
}: ExerciseBlockCardProps) {
  const { getMuscleColor: resolveMuscleColor } = useApp();
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [localLoadsByCluster, setLocalLoadsByCluster] = useState<string[][]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const isNormalTechnique = (block.technique || 'Normale') === 'Normale';

  // Helper per gestire input numerici con cancellazione libera
  const getFieldValue = (fieldName: string, actualValue: any) => {
    return editingField === fieldName ? tempValue : (actualValue || '');
  };

  const handleNumericFocus = (fieldName: string, currentValue: any) => {
    setEditingField(fieldName);
    setTempValue(String(currentValue || ''));
  };

  const handleNumericChange = (value: string) => {
    setTempValue(value);
  };

  const handleNumericBlur = (fieldName: keyof ExerciseBlock, value: string, defaultValue: number = 0) => {
    const numValue = value === '' ? defaultValue : (fieldName === 'coefficient' || fieldName === 'targetRPE' ? parseFloat(value) : parseInt(value)) || defaultValue;
    onUpdate(blockIndex, fieldName, numValue);
    setEditingField(null);
    setTempValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  // Funzione per ottenere il muscolo primario
  const getPrimaryMuscle = () => {
    if (!exerciseName || !exerciseLibrary || exerciseLibrary.length === 0) return null;
    const libraryEx = exerciseLibrary.find((e) => e.name === exerciseName);
    if (!libraryEx || !libraryEx.muscles || libraryEx.muscles.length === 0) return null;
    return libraryEx.muscles.reduce((prev, curr) =>
      curr.percent > prev.percent ? curr : prev
    );
  };

  const fallbackColor = '#6b7280';

  const resolveColor = (muscle?: string | null) => {
    if (!muscle) return fallbackColor;
    return resolveMuscleColor(muscle) || fallbackColor;
  };

  const getBadgeStyle = (baseColor: string, modifier = 0) => {
    const adjusted = modifier !== 0 ? adjustColor(baseColor, modifier) : baseColor;
    return {
      backgroundColor: adjusted,
      color: getContrastTextColor(adjusted),
    };
  };

  const getBlockStyle = (blockIndex: number) => {
    const base = resolveColor(primaryMuscle?.muscle);
    const shades = [0, -0.12, 0.18, -0.2, 0.14, -0.05, 0.24, -0.1];
    return getBadgeStyle(base, shades[blockIndex % shades.length]);
  };

  const getTechniqueStyle = (technique: string) => {
    const base = resolveColor(primaryMuscle?.muscle);
    const modifier = technique === 'Normale' ? 0.22 : -0.12;
    return getBadgeStyle(base, modifier);
  };

  const primaryMuscle = getPrimaryMuscle();
  
  // Inizializza localLoadsByCluster quando il modal si apre
  useEffect(() => {
    if (showLoadModal && !isNormalTechnique) {
      const clusters = parseSchema(block.techniqueSchema || '');
      const numClusters = clusters.length || 1;
      let loadsByCluster = block.targetLoadsByCluster;
      
      if (!loadsByCluster || loadsByCluster.length === 0) {
        if (block.targetLoads && block.targetLoads.length > 0) {
          loadsByCluster = block.targetLoads.map(load => Array(numClusters).fill(load));
        } else {
          loadsByCluster = Array(block.sets || 1).fill(null).map(() => Array(numClusters).fill('80'));
        }
      }
      
      const numSets = block.sets || 1;
      if (loadsByCluster.length !== numSets) {
        if (loadsByCluster.length < numSets) {
          const lastSetLoads = loadsByCluster[loadsByCluster.length - 1] || Array(numClusters).fill('80');
          loadsByCluster = [
            ...loadsByCluster,
            ...Array(numSets - loadsByCluster.length).fill(null).map(() => [...lastSetLoads])
          ];
        } else {
          loadsByCluster = loadsByCluster.slice(0, numSets);
        }
      }
      
      loadsByCluster = loadsByCluster.map((setLoads) => {
        if (setLoads.length !== numClusters) {
          if (setLoads.length < numClusters) {
            const lastLoad = setLoads[setLoads.length - 1] || '80';
            return [...setLoads, ...Array(numClusters - setLoads.length).fill(lastLoad)];
          } else {
            return setLoads.slice(0, numClusters);
          }
        }
        return setLoads;
      });
      
      loadsByCluster = loadsByCluster.map(setLoads => 
        setLoads.map(load => String(load || '80'))
      );
      
      setLocalLoadsByCluster(loadsByCluster);
      
      if (!block.targetLoadsByCluster || block.targetLoadsByCluster.length === 0) {
        onUpdate(blockIndex, 'targetLoadsByCluster', loadsByCluster);
      }
    } else if (showLoadModal && isNormalTechnique) {
      setLocalLoadsByCluster([]);
    }
  }, [showLoadModal]);

  const handleTechniqueChange = (newTechnique: string) => {
    if (newTechnique !== 'Normale') {
      const customTech = customTechniques.find(t => t.name === newTechnique);
      let defaultParams: Record<string, any> = {};
      let schema = '';
      
      if (customTech) {
        customTech.parameters.forEach((param: any) => {
          defaultParams[param.name] = param.defaultValue;
        });
        const values = customTech.parameters.map((p: any) => p.defaultValue).filter((v: any) => v !== undefined && v !== '');
        schema = values.join('+');
      } else {
        const techniqueDef = TECHNIQUE_DEFINITIONS.find(t => t.name === newTechnique);
        if (techniqueDef) {
          techniqueDef.parameters.forEach(param => {
            defaultParams[param.name] = param.default;
          });
          schema = generateSchemaFromParams(newTechnique, defaultParams);
        }
      }
      
      const clusters = parseSchema(schema);
      const numClusters = clusters.length || 1;
      const numSets = block.sets || 1;
      const initialLoadsByCluster = block.targetLoads?.map(load => Array(numClusters).fill(load)) || 
        Array(numSets).fill(Array(numClusters).fill('80'));
      
      if (onUpdateBatch) {
        const updates: Partial<ExerciseBlock> = {
          technique: newTechnique,
          repsBase: '',
          techniqueParams: defaultParams,
          techniqueSchema: schema,
          repRange: undefined,
          targetLoadsByCluster: initialLoadsByCluster,
        };
        onUpdateBatch(blockIndex, updates);
      } else {
        onUpdate(blockIndex, 'technique', newTechnique);
        onUpdate(blockIndex, 'repsBase', '');
        onUpdate(blockIndex, 'techniqueParams', defaultParams);
        onUpdate(blockIndex, 'repRange', undefined);
        if (schema) {
          onUpdate(blockIndex, 'techniqueSchema', schema);
          const clusters = parseSchema(schema);
          const numClusters = clusters.length || 1;
          const numSets = block.sets || 1;
          const initialLoadsByCluster = block.targetLoads?.map(load => Array(numClusters).fill(load)) || 
            Array(numSets).fill(Array(numClusters).fill('80'));
          onUpdate(blockIndex, 'targetLoadsByCluster', initialLoadsByCluster);
        }
      }
    } else {
      if (onUpdateBatch) {
        const updates: Partial<ExerciseBlock> = {
          technique: 'Normale',
          techniqueSchema: '',
          techniqueParams: {},
          repsBase: '10',
          repRange: '8-12',
        };
        onUpdateBatch(blockIndex, updates);
      } else {
        onUpdate(blockIndex, 'technique', 'Normale');
        onUpdate(blockIndex, 'techniqueSchema', '');
        onUpdate(blockIndex, 'techniqueParams', {});
        onUpdate(blockIndex, 'repsBase', '10');
        onUpdate(blockIndex, 'repRange', '8-12');
      }
    }
  };

  const handleTechniqueParamsChange = (params: Record<string, any>) => {
    if (block.technique) {
      const customTech = customTechniques.find(t => t.name === block.technique);
      let schema = '';

      if (customTech) {
        const values = customTech.parameters
          .map((p: any) => params[p.name] ?? p.defaultValue)
          .filter((v: any) => v !== undefined && v !== '');
        schema = values.every((v: any) => !isNaN(Number(v)))
          ? values.join('+')
          : values.join('-');
      } else {
        schema = generateSchemaFromParams(block.technique, params);
      }

      const updates: Partial<ExerciseBlock> = {
        techniqueParams: params,
        techniqueSchema: schema,
      };

      if (!isNormalTechnique) {
        const clusters = parseSchema(schema);
        const numClusters = clusters.length || 1;
        const currentLoadsByCluster = block.targetLoadsByCluster ||
          (block.targetLoads?.map(load => Array(numClusters).fill(load)) || []);

        const updatedLoadsByCluster = currentLoadsByCluster.map(setLoads => {
          if (setLoads.length === numClusters) {
            return setLoads;
          } else if (setLoads.length > numClusters) {
            return setLoads.slice(0, numClusters);
          } else {
            const lastLoad = setLoads[setLoads.length - 1] || '80';
            return [...setLoads, ...Array(numClusters - setLoads.length).fill(lastLoad)];
          }
        });

        const numSets = block.sets || 1;
        while (updatedLoadsByCluster.length < numSets) {
          const lastSetLoads = updatedLoadsByCluster[updatedLoadsByCluster.length - 1] || Array(numClusters).fill('80');
          updatedLoadsByCluster.push([...lastSetLoads]);
        }

        updates.targetLoadsByCluster = updatedLoadsByCluster.slice(0, numSets);
      }

      // Usa onUpdateBatch se disponibile per aggiornare tutto in una volta
      if (onUpdateBatch) {
        onUpdateBatch(blockIndex, updates);
      } else {
        Object.entries(updates).forEach(([key, value]) => {
          onUpdate(blockIndex, key as keyof ExerciseBlock, value);
        });
      }
    }
  };

  const handleSetsChange = (newSets: number) => {
    const currentLoads = block.targetLoads || [];
    const currentReps = block.targetReps || [];
    const updates: Partial<ExerciseBlock> = {
      sets: newSets,
    };

    if (isNormalTechnique) {
      // Gestisci targetLoads
      if (newSets > currentLoads.length) {
        const lastLoad = currentLoads[currentLoads.length - 1] || '80';
        updates.targetLoads = [
          ...currentLoads,
          ...Array(newSets - currentLoads.length).fill(lastLoad),
        ];
      } else if (newSets < currentLoads.length) {
        updates.targetLoads = currentLoads.slice(0, newSets);
      }

      // Gestisci targetReps (solo se già esistono)
      if (currentReps.length > 0) {
        if (newSets > currentReps.length) {
          const lastReps = currentReps[currentReps.length - 1] || block.repsBase || '10';
          updates.targetReps = [
            ...currentReps,
            ...Array(newSets - currentReps.length).fill(lastReps),
          ];
        } else if (newSets < currentReps.length) {
          updates.targetReps = currentReps.slice(0, newSets);
        }
      }
    } else {
      const clusters = parseSchema(block.techniqueSchema || '');
      const numClusters = clusters.length || 1;
      const currentLoadsByCluster = block.targetLoadsByCluster ||
        (block.targetLoads?.map(load => Array(numClusters).fill(load)) || []);

      if (newSets > currentLoadsByCluster.length) {
        const lastSetLoads = currentLoadsByCluster[currentLoadsByCluster.length - 1] || Array(numClusters).fill('80');
        const newLoadsByCluster = [
          ...currentLoadsByCluster,
          ...Array(newSets - currentLoadsByCluster.length).fill([...lastSetLoads]),
        ];
        updates.targetLoadsByCluster = newLoadsByCluster;
        updates.targetLoads = newLoadsByCluster.map(sl => sl[0] || '80');
      } else if (newSets < currentLoadsByCluster.length) {
        const newLoadsByCluster = currentLoadsByCluster.slice(0, newSets);
        updates.targetLoadsByCluster = newLoadsByCluster;
        updates.targetLoads = newLoadsByCluster.map(sl => sl[0] || '80');
      }
    }

    // Usa onUpdateBatch se disponibile per aggiornare tutto in una volta
    if (onUpdateBatch) {
      onUpdateBatch(blockIndex, updates);
    } else {
      Object.entries(updates).forEach(([key, value]) => {
        onUpdate(blockIndex, key as keyof ExerciseBlock, value);
      });
    }
  };

  if (exerciseType === 'cardio') {
    return (
      <Card className="w-full border border-gray-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 text-xs font-medium rounded"
                style={getBlockStyle(blockIndex)}
              >
                Blocco {blockIndex + 1}
              </span>
              <span className="px-2 py-0.5 bg-orange-700 text-white text-xs font-medium rounded">
                Cardio
              </span>
            </div>
            {canDelete && (
              <Button variant="ghost" size="icon" onClick={() => onDelete(blockIndex)}>
                <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Durata (minuti)
            </Label>
            <Input
              type="number"
              value={getFieldValue('duration', block.duration)}
              onFocus={() => handleNumericFocus('duration', block.duration)}
              onChange={(e) => handleNumericChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={(e) => handleNumericBlur('duration', e.target.value, 0)}
              className="h-10"
            />
          </div>
          {!isLast && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Rest dopo blocco (secondi)
              </Label>
              <Input
                type="number"
                value={getFieldValue('blockRest', block.blockRest)}
                onFocus={() => handleNumericFocus('blockRest', block.blockRest)}
                onChange={(e) => handleNumericChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={(e) => handleNumericBlur('blockRest', e.target.value, 0)}
                className="h-10"
                placeholder="0"
              />
            </div>
          )}
          <div>
            <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Note
            </Label>
            <Textarea
              value={block.notes || ''}
              onChange={(e) => onUpdate(blockIndex, 'notes', e.target.value)}
              placeholder="Aggiungi note per questo blocco..."
              className="min-h-[80px]"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full border border-gray-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 text-xs font-medium rounded"
                style={getBlockStyle(blockIndex)}
              >
                Blocco {blockIndex + 1}
              </span>
              <span
                className="px-2 py-0.5 text-xs font-medium rounded"
                style={getTechniqueStyle(block.technique || 'Normale')}
              >
                {block.technique || 'Normale'}
              </span>
            </div>
            {canDelete && (
              <Button variant="ghost" size="icon" onClick={() => onDelete(blockIndex)}>
                <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Tecnica */}
          <div className="space-y-2">
            <Label className="text-sm font-medium bg-gray-100 text-gray-900 px-2 py-1 rounded inline-block">Tecnica di Allenamento</Label>
            <Select
              key={`technique-select-${blockIndex}-${block.technique || 'Normale'}`}
              value={block.technique || 'Normale'}
              onValueChange={handleTechniqueChange}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Seleziona tecnica">
                  {block.technique || 'Normale'}
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

            {/* Technique Params Form */}
            {block.technique && block.technique !== 'Normale' && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <TechniqueParamsForm
                  technique={block.technique}
                  params={block.techniqueParams || {}}
                  onChange={handleTechniqueParamsChange}
                />
              </div>
            )}
          </div>

          {/* Volume: Sets & Reps */}
          <div className="space-y-3">
            <Label className="text-sm font-medium bg-gray-100 text-gray-900 px-2 py-1 rounded inline-block">Volume</Label>
            {isNormalTechnique ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600 mb-1.5 block">Sets</Label>
                  <Input
                    type="number"
                    value={getFieldValue('sets', block.sets)}
                    onFocus={() => handleNumericFocus('sets', block.sets)}
                    onChange={(e) => handleNumericChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={(e) => {
                      const val = e.target.value === '' ? 1 : parseInt(e.target.value) || 1;
                      handleSetsChange(val);
                      setEditingField(null);
                      setTempValue('');
                    }}
                    className="h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1.5 block">
                    Reps Base <span className="text-xs text-muted-foreground"></span>
                    {block.targetReps && block.targetReps.length > 0 && (
                      <span className="text-xs text-orange-600 ml-1">(disabilitato - reps personalizzate attive)</span>
                    )}
                  </Label>
                  <Input
                    type="text"
                    value={block.repsBase || ''}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      // Permetti solo numeri o "MAX"
                      if (value === '' || value === 'MAX' || /^\d+$/.test(value)) {
                        onUpdate(blockIndex, 'repsBase', value);
                      }
                    }}
                    placeholder="10 o MAX"
                    className="h-10"
                    disabled={block.targetReps && block.targetReps.length > 0}
                  />
                </div>
              </div>
            ) : (
              <div>
                <Label className="text-xs text-gray-600 mb-1.5 block">Sets (numero di serie complete)</Label>
                <Input
                  type="number"
                  value={getFieldValue('sets-special', block.sets)}
                  onFocus={() => handleNumericFocus('sets-special', block.sets)}
                  onChange={(e) => handleNumericChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={(e) => {
                    const val = e.target.value === '' ? 1 : parseInt(e.target.value) || 1;
                    handleSetsChange(val);
                    setEditingField(null);
                    setTempValue('');
                  }}
                  className="h-10"
                />
              </div>
            )}

            {/* Rep Range */}
            {isNormalTechnique && (
              <div className="mt-3">
                <Label className="text-xs text-gray-600 mb-1.5 block">Rep Range</Label>
                <Select
                  value={block.repRange || '8-12'}
                  onValueChange={(v) => onUpdate(blockIndex, 'repRange', v)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Seleziona range">
                      {block.repRange && `${block.repRange} - ${REP_RANGES[block.repRange as keyof typeof REP_RANGES]?.focus || ''}`}
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

            {/* Ripetizioni per Set - Solo per tecnica normale */}
            {isNormalTechnique && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-xs text-gray-600">Ripetizioni per Set</Label>
                  <span className="text-xs text-muted-foreground">
                    {block.targetReps && block.targetReps.length > 0
                      ? 'Personalizzate'
                      : `Tutte: ${block.repsBase || '10'} reps`}
                  </span>
                </div>
                {block.targetReps && block.targetReps.length > 0 ? (
                  // Mostra input se targetReps è già configurato
                  <div className="space-y-2">
                    {block.targetReps.map((reps, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                        <span className="px-2 py-1 rounded bg-green-600 text-white text-xs font-bold min-w-[3rem] text-center">
                          Set {i + 1}
                        </span>
                        <Input
                          type="text"
                          value={reps}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();
                            if (value === '' || value === 'MAX' || /^\d+$/.test(value)) {
                              const newReps = [...(block.targetReps || [])];
                              newReps[i] = value;
                              onUpdate(blockIndex, 'targetReps', newReps);
                            }
                          }}
                          className="h-8 flex-1 text-sm"
                          placeholder="10 o MAX"
                        />
                        <span className="text-xs font-medium text-muted-foreground">reps</span>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUpdate(blockIndex, 'targetReps', [])}
                      className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                    >
                      Rimuovi personalizzazione
                    </Button>
                  </div>
                ) : (
                  // Pulsante per abilitare reps personalizzate
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const sets = block.sets || 1;
                      const baseReps = block.repsBase || '10';
                      onUpdate(blockIndex, 'targetReps', Array(sets).fill(baseReps));
                    }}
                    className="w-full border-dashed text-xs h-8"
                  >
                    + Personalizza reps per ogni set
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Carichi */}
          <div className="space-y-2">
            <Label className="text-sm font-medium bg-gray-100 text-gray-900 px-2 py-1 rounded inline-flex items-center gap-2">
              <Dumbbell className="w-3.5 h-3.5" />
              Carichi per Set
            </Label>
            <div className="flex gap-2 items-center">
              <div className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono text-gray-700">
                {(() => {
                  if (isNormalTechnique) {
                    return block.targetLoads?.join(' - ') || '-';
                  } else {
                    if (block.targetLoadsByCluster && block.targetLoadsByCluster.length > 0) {
                      return block.targetLoadsByCluster.map(setLoads => setLoads.join('/')).join(' • ');
                    }
                    return block.targetLoads?.join(' - ') || '-';
                  }
                })()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLoadModal(true)}
              >
                Modifica
              </Button>
            </div>
          </div>

          {/* Intensità */}
          <div className="space-y-3">
            <Label className="text-sm font-medium bg-gray-100 text-gray-900 px-2 py-1 rounded inline-block">Intensità</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600 mb-1.5 block">Coefficiente</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={getFieldValue('coefficient', block.coefficient)}
                  onFocus={() => handleNumericFocus('coefficient', block.coefficient)}
                  onChange={(e) => handleNumericChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={(e) => handleNumericBlur('coefficient', e.target.value, 0)}
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600 mb-1.5 block">RPE Target</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={getFieldValue('targetRPE', block.targetRPE)}
                  onFocus={() => handleNumericFocus('targetRPE', block.targetRPE)}
                  onChange={(e) => handleNumericChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={(e) => handleNumericBlur('targetRPE', e.target.value, 0)}
                  className="h-10"
                />
              </div>
            </div>
          </div>

          {/* Rest */}
          <div className="space-y-3">
            <Label className="text-sm font-medium bg-gray-100 text-gray-900 px-2 py-1 rounded inline-flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Tempi di Recupero
            </Label>
            <div>
              <Label className="text-xs text-gray-600 mb-1.5 block">
                Rest globale (secondi)
                {!isNormalTechnique && (
                  <span className="text-muted-foreground ml-1 text-xs">
                    - tra i set completi
                  </span>
                )}
              </Label>
              <Input
                type="number"
                value={getFieldValue('rest', block.rest)}
                onFocus={() => handleNumericFocus('rest', block.rest)}
                onChange={(e) => handleNumericChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={(e) => handleNumericBlur('rest', e.target.value, 0)}
                className="h-10"
              />
            </div>

            {!isLast && (
              <div>
                <Label className="text-xs text-gray-600 mb-1.5 block">Rest dopo blocco (secondi)</Label>
                <Input
                  type="number"
                  value={getFieldValue('blockRest2', block.blockRest)}
                  onFocus={() => handleNumericFocus('blockRest2', block.blockRest)}
                  onChange={(e) => handleNumericChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={(e) => handleNumericBlur('blockRest', e.target.value, 0)}
                  className="h-10"
                  placeholder="0"
                />
              </div>
            )}
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label className="text-sm font-medium bg-gray-100 text-gray-900 px-2 py-1 rounded inline-flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              Note
            </Label>
            <Textarea
              value={block.notes || ''}
              onChange={(e) => onUpdate(blockIndex, 'notes', e.target.value)}
              placeholder="Aggiungi note per questo blocco..."
              className="min-h-[80px]"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Load Modal con Tabs */}
      <Dialog open={showLoadModal} onOpenChange={setShowLoadModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="w-5 h-4" />
              Dettagli Blocco {blockIndex + 1}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="loads" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="loads">💪 Carichi</TabsTrigger>
              <TabsTrigger value="rest">⏱️ Rest</TabsTrigger>
              <TabsTrigger value="notes">📝 Note</TabsTrigger>
            </TabsList>

            <TabsContent value="loads" className="flex-1 overflow-y-auto p-4 space-y-6">
              {isNormalTechnique ? (
                // Tecnica normale: solo carichi per set
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">💪 Carichi per Set</h4>
                  {block.targetLoads?.map((load, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm font-bold min-w-[4rem] text-center">
                        Set {i + 1}
                      </span>
                      <Input
                        type="number"
                        value={load}
                        onChange={(e) => {
                          const newLoads = [...(block.targetLoads || [])];
                          newLoads[i] = e.target.value;
                          onUpdate(blockIndex, 'targetLoads', newLoads);
                        }}
                        className="h-10 flex-1"
                        placeholder="80"
                      />
                      <span className="text-sm font-medium text-muted-foreground">kg</span>
                    </div>
                  ))}
                </div>
              ) : (
                // Tecnica speciale: carichi per cluster/mini-set
                localLoadsByCluster.length > 0 ? (
                  <div className="space-y-4">
                    {localLoadsByCluster.map((setLoads, setIdx) => {
                      const clusters = parseSchema(block.techniqueSchema || '');
                      return (
                        <Card key={setIdx} className="border-2 border-black/30 shadow-sm">
                          <CardHeader className="pb-3 bg-gradient-to-r from-neutral-100 to-neutral-200">
                            <h4 className="text-sm font-bold flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded bg-black text-white">Set {setIdx + 1}</span>
                              <span className="text-muted-foreground text-xs">({block.techniqueSchema})</span>
                            </h4>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-2 gap-3">
                              {setLoads.map((load: string, clusterIdx: number) => (
                                <div key={clusterIdx}>
                                  <Label className="text-xs mb-1.5 block">
                                    Cluster {clusterIdx + 1} <span className="text-muted-foreground">({clusters[clusterIdx] || 0} reps)</span>
                                  </Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      step="0.5"
                                      value={String(load || '')}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        const newValue = e.target.value;
                                        setLocalLoadsByCluster(prev => {
                                          const newLoadsByCluster = prev.map((sl: string[], si: number) => 
                                            si === setIdx ? sl.map((l: string, ci: number) => ci === clusterIdx ? newValue : l) : sl
                                          );
                                          return newLoadsByCluster;
                                        });
                                      }}
                                      onBlur={(e) => {
                                        if (!e.target.value || e.target.value === '') {
                                          const newValue = '80';
                                          setLocalLoadsByCluster(prev => {
                                            const newLoadsByCluster = prev.map((sl: string[], si: number) => 
                                              si === setIdx ? sl.map((l: string, ci: number) => ci === clusterIdx ? newValue : l) : sl
                                            );
                                            onUpdate(blockIndex, 'targetLoadsByCluster', newLoadsByCluster);
                                            return newLoadsByCluster;
                                          });
                                          e.target.value = '80';
                                        }
                                      }}
                                      className="h-9"
                                      placeholder="80"
                                    />
                                    <span className="text-xs text-muted-foreground">kg</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
                )
              )}
            </TabsContent>

            <TabsContent value="rest" className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-700">Rest globale:</span>
                    <span className="font-semibold text-gray-900">{block.rest || 0}s</span>
                  </div>
                </div>
                {!isNormalTechnique && block.techniqueParams?.pause && (
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-700">Rest intra-set:</span>
                      <span className="font-semibold text-gray-900">{block.techniqueParams.pause}s</span>
                    </div>
                  </div>
                )}
                {!isLast && block.blockRest && (
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-700">Rest dopo blocco:</span>
                      <span className="font-semibold text-gray-900">{block.blockRest}s</span>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="flex-1 overflow-y-auto p-4">
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <p className="text-sm text-gray-700">
                  {block.notes || 'Nessuna nota per questo blocco.'}
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowLoadModal(false)}
            >
              Annulla
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                if (!isNormalTechnique && localLoadsByCluster.length > 0) {
                  const validLoadsByCluster = localLoadsByCluster.map(setLoads =>
                    setLoads.map(load => {
                      const numLoad = parseFloat(String(load || '0'));
                      return isNaN(numLoad) || numLoad <= 0 ? '80' : String(numLoad);
                    })
                  );
                  if (onUpdateBatch) {
                    onUpdateBatch(blockIndex, {
                      targetLoadsByCluster: validLoadsByCluster,
                      targetLoads: validLoadsByCluster.map((sl: string[]) => sl[0] || '80')
                    });
                  } else {
                    onUpdate(blockIndex, 'targetLoadsByCluster', validLoadsByCluster);
                    const newTargetLoads = validLoadsByCluster.map((sl: string[]) => sl[0] || '80');
                    onUpdate(blockIndex, 'targetLoads', newTargetLoads);
                  }
                }
                setShowLoadModal(false);
              }}
            >
              💾 Salva Modifiche
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
