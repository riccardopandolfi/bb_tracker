import { useState, useEffect } from 'react';
import { ExerciseBlock, Exercise, REP_RANGES } from '@/types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Trash2 } from 'lucide-react';
import { TechniqueParamsForm } from './TechniqueParamsForm';
import { generateSchemaFromParams, TECHNIQUE_DEFINITIONS } from '@/lib/techniques';
import { parseSchema } from '@/lib/calculations';

interface ExerciseBlockCardProps {
  block: ExerciseBlock;
  blockIndex: number;
  exerciseType: 'resistance' | 'cardio';
  exerciseLibrary?: Exercise[];
  allTechniques: string[];
  customTechniques: any[];
  onUpdate: (blockIndex: number, field: keyof ExerciseBlock, value: any) => void;
  onUpdateBatch?: (blockIndex: number, updates: Partial<ExerciseBlock>) => void; // Aggiornamento batch opzionale
  onDelete: (blockIndex: number) => void;
  isLast: boolean;
  canDelete: boolean;
}

export function ExerciseBlockCard({
  block,
  blockIndex,
  exerciseType,
  allTechniques,
  customTechniques,
  onUpdate,
  onUpdateBatch,
  onDelete,
  isLast,
  canDelete,
}: ExerciseBlockCardProps) {
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [localLoadsByCluster, setLocalLoadsByCluster] = useState<string[][]>([]);
  const isNormalTechnique = (block.technique || 'Normale') === 'Normale';
  
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
      
      // Normalizza i valori (assicurati che siano stringhe)
      loadsByCluster = loadsByCluster.map(setLoads => 
        setLoads.map(load => String(load || '80'))
      );
      
      setLocalLoadsByCluster(loadsByCluster);
      
      // Salva l'inizializzazione solo se non esisteva (non sovrascrivere modifiche in corso)
      if (!block.targetLoadsByCluster || block.targetLoadsByCluster.length === 0) {
        onUpdate(blockIndex, 'targetLoadsByCluster', loadsByCluster);
      }
    } else if (showLoadModal && isNormalTechnique) {
      // Reset per tecniche normali
      setLocalLoadsByCluster([]);
    }
  }, [showLoadModal]); // Dipendenze ridotte: solo quando il modal si apre/chiude

  const handleTechniqueChange = (newTechnique: string) => {
    if (newTechnique !== 'Normale') {
      // Per tecniche speciali: prepara i parametri di default
      const customTech = customTechniques.find(t => t.name === newTechnique);
      let defaultParams: Record<string, any> = {};
      let schema = '';
      
      if (customTech) {
        // Tecnica personalizzata: usa i default values
        customTech.parameters.forEach((param: any) => {
          defaultParams[param.name] = param.defaultValue;
        });
        const values = customTech.parameters.map((p: any) => p.defaultValue).filter((v: any) => v !== undefined && v !== '');
        schema = values.join('+');
      } else {
        // Tecnica standard: genera schema con parametri di default
        const techniqueDef = TECHNIQUE_DEFINITIONS.find(t => t.name === newTechnique);
        if (techniqueDef) {
          techniqueDef.parameters.forEach(param => {
            defaultParams[param.name] = param.default;
          });
          schema = generateSchemaFromParams(newTechnique, defaultParams);
        }
      }
      
      // Inizializza targetLoadsByCluster se necessario
      const clusters = parseSchema(schema);
      const numClusters = clusters.length || 1;
      const numSets = block.sets || 1;
      const initialLoadsByCluster = block.targetLoads?.map(load => Array(numClusters).fill(load)) || 
        Array(numSets).fill(Array(numClusters).fill('80'));
      
      // Se disponibile, usa aggiornamento batch per evitare race conditions
      if (onUpdateBatch) {
        const updates: Partial<ExerciseBlock> = {
          technique: newTechnique,
          repsBase: '',
          techniqueParams: defaultParams,
          techniqueSchema: schema,
          repRange: undefined, // Rimuovi repRange per tecniche speciali
          targetLoadsByCluster: initialLoadsByCluster, // Inizializza con carichi per cluster
        };
        onUpdateBatch(blockIndex, updates);
      } else {
        // Fallback: aggiorna sequenzialmente
        onUpdate(blockIndex, 'technique', newTechnique);
        onUpdate(blockIndex, 'repsBase', '');
        onUpdate(blockIndex, 'techniqueParams', defaultParams);
        onUpdate(blockIndex, 'repRange', undefined); // Rimuovi repRange per tecniche speciali
        if (schema) {
          onUpdate(blockIndex, 'techniqueSchema', schema);
          // Inizializza targetLoadsByCluster
          const clusters = parseSchema(schema);
          const numClusters = clusters.length || 1;
          const numSets = block.sets || 1;
          const initialLoadsByCluster = block.targetLoads?.map(load => Array(numClusters).fill(load)) || 
            Array(numSets).fill(Array(numClusters).fill('80'));
          onUpdate(blockIndex, 'targetLoadsByCluster', initialLoadsByCluster);
        }
      }
    } else {
      // Per tecnica normale: aggiorna tutto
      if (onUpdateBatch) {
        const updates: Partial<ExerciseBlock> = {
          technique: 'Normale',
          techniqueSchema: '',
          techniqueParams: {},
          repsBase: '10',
          repRange: '8-12', // Imposta repRange di default per tecnica normale
        };
        onUpdateBatch(blockIndex, updates);
      } else {
        // Fallback: aggiorna sequenzialmente
        onUpdate(blockIndex, 'technique', 'Normale');
        onUpdate(blockIndex, 'techniqueSchema', '');
        onUpdate(blockIndex, 'techniqueParams', {});
        onUpdate(blockIndex, 'repsBase', '10');
        onUpdate(blockIndex, 'repRange', '8-12'); // Imposta repRange di default per tecnica normale
      }
    }
  };

  const handleTechniqueParamsChange = (params: Record<string, any>) => {
    onUpdate(blockIndex, 'techniqueParams', params);
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
      
      onUpdate(blockIndex, 'techniqueSchema', schema);
      
      // Aggiorna targetLoadsByCluster se la struttura dei cluster cambia
      if (!isNormalTechnique) {
        const clusters = parseSchema(schema);
        const numClusters = clusters.length || 1;
        const currentLoadsByCluster = block.targetLoadsByCluster || 
          (block.targetLoads?.map(load => Array(numClusters).fill(load)) || []);
        
        // Ricalcola targetLoadsByCluster con la nuova struttura
        const updatedLoadsByCluster = currentLoadsByCluster.map(setLoads => {
          if (setLoads.length === numClusters) {
            return setLoads; // Già corretto
          } else if (setLoads.length > numClusters) {
            return setLoads.slice(0, numClusters); // Riduci
          } else {
            // Espandi con l'ultimo valore
            const lastLoad = setLoads[setLoads.length - 1] || '80';
            return [...setLoads, ...Array(numClusters - setLoads.length).fill(lastLoad)];
          }
        });
        
        // Aggiungi set mancanti se necessario
        const numSets = block.sets || 1;
        while (updatedLoadsByCluster.length < numSets) {
          const lastSetLoads = updatedLoadsByCluster[updatedLoadsByCluster.length - 1] || Array(numClusters).fill('80');
          updatedLoadsByCluster.push([...lastSetLoads]);
        }
        
        onUpdate(blockIndex, 'targetLoadsByCluster', updatedLoadsByCluster.slice(0, numSets));
      }
    }
  };

  const handleSetsChange = (newSets: number) => {
    onUpdate(blockIndex, 'sets', newSets);
    
    if (isNormalTechnique) {
      // Tecnica normale: aggiorna targetLoads
      const currentLoads = block.targetLoads || [];
      if (newSets > currentLoads.length) {
        const lastLoad = currentLoads[currentLoads.length - 1] || '80';
        onUpdate(blockIndex, 'targetLoads', [
          ...currentLoads,
          ...Array(newSets - currentLoads.length).fill(lastLoad),
        ]);
      } else if (newSets < currentLoads.length) {
        onUpdate(blockIndex, 'targetLoads', currentLoads.slice(0, newSets));
      }
    } else {
      // Tecnica speciale: aggiorna targetLoadsByCluster
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
        onUpdate(blockIndex, 'targetLoadsByCluster', newLoadsByCluster);
        // Aggiorna anche targetLoads come fallback (primo carico di ogni set)
        onUpdate(blockIndex, 'targetLoads', newLoadsByCluster.map(sl => sl[0] || '80'));
      } else if (newSets < currentLoadsByCluster.length) {
        const newLoadsByCluster = currentLoadsByCluster.slice(0, newSets);
        onUpdate(blockIndex, 'targetLoadsByCluster', newLoadsByCluster);
        // Aggiorna anche targetLoads come fallback (primo carico di ogni set)
        onUpdate(blockIndex, 'targetLoads', newLoadsByCluster.map(sl => sl[0] || '80'));
      }
    }
  };

  if (exerciseType === 'cardio') {
    return (
      <Card className="border-l-4 border-l-orange-500">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 rounded bg-orange-100 text-orange-800 text-xs font-medium">
                  Blocco {blockIndex + 1}
                </span>
                {!isLast && block.blockRest && (
                  <span className="text-xs text-muted-foreground">
                    Rest: {block.blockRest}s
                  </span>
                )}
              </div>
            </div>
            {canDelete && (
              <Button variant="ghost" size="icon" onClick={() => onDelete(blockIndex)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">Durata (minuti)</Label>
              <Input
                type="number"
                value={block.duration || 0}
                onChange={(e) => onUpdate(blockIndex, 'duration', parseInt(e.target.value) || 0)}
                className="h-9"
              />
            </div>
            {!isLast && (
              <div>
                <Label className="text-xs">Rest dopo blocco (secondi)</Label>
                <Input
                  type="number"
                  value={block.blockRest || 0}
                  onChange={(e) => onUpdate(blockIndex, 'blockRest', parseInt(e.target.value) || 0)}
                  className="h-9"
                  placeholder="0"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-medium">
                Blocco {blockIndex + 1}
              </span>
              {block.technique && block.technique !== 'Normale' && (
                <span className="text-xs text-muted-foreground">{block.technique}</span>
              )}
              {!isLast && block.blockRest && (
                <span className="text-xs text-muted-foreground">
                  Rest: {block.blockRest}s
                </span>
              )}
            </div>
          </div>
          {canDelete && (
            <Button variant="ghost" size="icon" onClick={() => onDelete(blockIndex)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {/* Tecnica */}
          <div>
            <Label className="text-xs">Tecnica</Label>
            <Select
              key={`technique-select-${blockIndex}-${block.technique || 'Normale'}`}
              value={block.technique || 'Normale'}
              onValueChange={(value) => {
                console.log('Select changed to:', value);
                handleTechniqueChange(value);
              }}
            >
              <SelectTrigger className="h-9">
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
          </div>

          {/* Technique Params Form */}
          {block.technique && block.technique !== 'Normale' && (
            <TechniqueParamsForm
              technique={block.technique}
              params={block.techniqueParams || {}}
              onChange={handleTechniqueParamsChange}
            />
          )}

          {/* Sets & Reps */}
          {((block.technique || 'Normale') === 'Normale') ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Sets</Label>
                <Input
                  type="number"
                  value={block.sets || 0}
                  onChange={(e) => handleSetsChange(parseInt(e.target.value) || 0)}
                  min="1"
                  max="10"
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Reps Base</Label>
                <Input
                  type="number"
                  value={block.repsBase || ''}
                  onChange={(e) => onUpdate(blockIndex, 'repsBase', e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          ) : (
            <div>
              <Label className="text-xs">Sets (numero di serie complete)</Label>
              <Input
                type="number"
                value={block.sets || 0}
                onChange={(e) => handleSetsChange(parseInt(e.target.value) || 0)}
                min="1"
                max="10"
                className="h-9"
              />
            </div>
          )}

          {/* Rep Range */}
          {((block.technique || 'Normale') === 'Normale') && (
            <div>
              <Label className="text-xs">Rep Range</Label>
              <Select
                value={block.repRange || '8-12'}
                onValueChange={(v) => onUpdate(blockIndex, 'repRange', v)}
              >
                <SelectTrigger className="h-9">
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

          {/* Carichi */}
          <div>
            <Label className="text-xs">Carichi per Set (kg)</Label>
            <div className="flex gap-2 items-center">
              <div className="flex-1 px-3 py-2 border rounded-md bg-muted text-sm">
                {(() => {
                  if (isNormalTechnique) {
                    // Tecnica normale: mostra tutti i carichi separati da '-'
                    return block.targetLoads?.join('-') || '-';
                  } else {
                    // Tecnica speciale: mostra carichi per cluster se disponibili
                    if (block.targetLoadsByCluster && block.targetLoadsByCluster.length > 0) {
                      return block.targetLoadsByCluster.map(setLoads => setLoads.join('/')).join(' • ');
                    }
                    // Fallback a targetLoads
                    return block.targetLoads?.join('-') || '-';
                  }
                })()}
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
            <div 
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={(e) => {
                // Chiudi il modal se si clicca sull'overlay
                if (e.target === e.currentTarget) {
                  setShowLoadModal(false);
                }
              }}
            >
              <Card 
                className="w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-lg font-semibold mb-4">Modifica Carichi</h3>
                  {isNormalTechnique ? (
                    // Tecnica normale: un carico per set
                    block.targetLoads?.map((load, i) => (
                      <div key={i}>
                        <Label className="text-xs">Set {i + 1}</Label>
                        <Input
                          type="number"
                          value={load}
                          onChange={(e) => {
                            const newLoads = [...(block.targetLoads || [])];
                            newLoads[i] = e.target.value;
                            onUpdate(blockIndex, 'targetLoads', newLoads);
                          }}
                          className="h-9"
                        />
                      </div>
                    ))
                  ) : (
                    // Tecnica speciale: carichi per cluster/mini-set
                    localLoadsByCluster.length > 0 ? (
                      <>
                        {localLoadsByCluster.map((setLoads, setIdx) => {
                          const clusters = parseSchema(block.techniqueSchema || '');
                          return (
                            <div key={setIdx} className="border rounded-lg p-3 space-y-2 mb-3">
                              <Label className="text-xs font-semibold">Set {setIdx + 1}</Label>
                              <div className="grid grid-cols-2 gap-2">
                                {setLoads.map((load: string, clusterIdx: number) => (
                                  <div key={clusterIdx} onClick={(e) => e.stopPropagation()}>
                                    <Label className="text-xs">Cluster {clusterIdx + 1} ({clusters[clusterIdx] || 0} reps)</Label>
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
                                          
                                          // Aggiorna solo lo stato locale, il salvataggio finale avverrà con il pulsante "Salva"
                                          return newLoadsByCluster;
                                        });
                                      }}
                                      onBlur={(e) => {
                                        // Assicurati che il valore non sia vuoto quando si perde il focus
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
                                      placeholder="0"
                                      onClick={(e) => e.stopPropagation()}
                                      onKeyDown={(e) => e.stopPropagation()}
                                      onFocus={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">Caricamento...</div>
                    )
                  )}
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        // Annulla: ripristina i valori originali
                        setShowLoadModal(false);
                      }}
                    >
                      Annulla
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        // Salva i valori dal localLoadsByCluster al blocco
                        if (!isNormalTechnique && localLoadsByCluster.length > 0) {
                          // Assicurati che tutti i valori siano validi (non vuoti)
                          const validLoadsByCluster = localLoadsByCluster.map(setLoads =>
                            setLoads.map(load => {
                              const numLoad = parseFloat(String(load || '0'));
                              return isNaN(numLoad) || numLoad <= 0 ? '80' : String(numLoad);
                            })
                          );
                          // Usa onUpdateBatch se disponibile per aggiornare tutto in una volta
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
                      Salva
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
                value={block.coefficient || 0}
                onChange={(e) => onUpdate(blockIndex, 'coefficient', parseFloat(e.target.value) || 0)}
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
                value={block.targetRPE || 0}
                onChange={(e) => onUpdate(blockIndex, 'targetRPE', parseFloat(e.target.value) || 0)}
                className="h-9"
              />
            </div>
          </div>

          {/* Recupero intra-set */}
          <div>
            <Label className="text-xs">Recupero intra-set (secondi)</Label>
            <Input
              type="number"
              value={block.rest || 0}
              onChange={(e) => onUpdate(blockIndex, 'rest', parseInt(e.target.value) || 0)}
              className="h-9"
            />
          </div>

          {/* Rest tra blocchi (solo se non è l'ultimo) */}
          {!isLast && (
            <div>
              <Label className="text-xs">Rest dopo blocco (secondi)</Label>
              <Input
                type="number"
                value={block.blockRest || 0}
                onChange={(e) => onUpdate(blockIndex, 'blockRest', parseInt(e.target.value) || 0)}
                className="h-9"
                placeholder="0"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

