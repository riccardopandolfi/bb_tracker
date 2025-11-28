import { useState } from 'react';
import { PercentageProgression, ProgressionWeekConfig, ProgressionBlockConfig } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import { calculateLoadFromPercentage, createDefaultProgression, validateProgression } from '@/lib/exerciseUtils';
import { cn } from '@/lib/utils';

interface PercentageProgressionEditorProps {
  progression: PercentageProgression | undefined;
  onChange: (progression: PercentageProgression) => void;
  className?: string;
}

export function PercentageProgressionEditor({
  progression,
  onChange,
  className,
}: PercentageProgressionEditorProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]));
  
  // Inizializza con default se non esiste
  const currentProgression = progression || createDefaultProgression();

  const toggleWeekExpanded = (weekNum: number) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekNum)) {
      newExpanded.delete(weekNum);
    } else {
      newExpanded.add(weekNum);
    }
    setExpandedWeeks(newExpanded);
  };

  const updateOneRepMax = (value: string) => {
    const numValue = parseFloat(value) || 0;
    onChange({
      ...currentProgression,
      oneRepMax: numValue,
    });
  };

  const addWeek = () => {
    const maxWeek = Math.max(...currentProgression.weeks.map(w => w.weekNumber), 0);
    const newWeek: ProgressionWeekConfig = {
      weekNumber: maxWeek + 1,
      blocks: [{ sets: 4, reps: 5, percentage: 75 }],
    };
    onChange({
      ...currentProgression,
      weeks: [...currentProgression.weeks, newWeek],
    });
    setExpandedWeeks(new Set([...expandedWeeks, newWeek.weekNumber]));
  };

  const removeWeek = (weekNumber: number) => {
    if (currentProgression.weeks.length <= 1) return;
    onChange({
      ...currentProgression,
      weeks: currentProgression.weeks.filter(w => w.weekNumber !== weekNumber),
    });
  };

  const updateWeek = (weekNumber: number, updatedWeek: ProgressionWeekConfig) => {
    onChange({
      ...currentProgression,
      weeks: currentProgression.weeks.map(w => 
        w.weekNumber === weekNumber ? updatedWeek : w
      ),
    });
  };

  const addBlockToWeek = (weekNumber: number) => {
    const week = currentProgression.weeks.find(w => w.weekNumber === weekNumber);
    if (!week) return;
    
    const lastBlock = week.blocks[week.blocks.length - 1];
    const newBlock: ProgressionBlockConfig = {
      sets: lastBlock?.sets || 3,
      reps: lastBlock?.reps || 8,
      percentage: (lastBlock?.percentage || 70) - 5, // Diminuisci di 5% per varietà
    };
    
    updateWeek(weekNumber, {
      ...week,
      blocks: [...week.blocks, newBlock],
    });
  };

  const removeBlockFromWeek = (weekNumber: number, blockIndex: number) => {
    const week = currentProgression.weeks.find(w => w.weekNumber === weekNumber);
    if (!week || week.blocks.length <= 1) return;
    
    updateWeek(weekNumber, {
      ...week,
      blocks: week.blocks.filter((_, idx) => idx !== blockIndex),
    });
  };

  const updateBlock = (
    weekNumber: number,
    blockIndex: number,
    field: keyof ProgressionBlockConfig,
    value: number
  ) => {
    const week = currentProgression.weeks.find(w => w.weekNumber === weekNumber);
    if (!week) return;
    
    const updatedBlocks = week.blocks.map((block, idx) => {
      if (idx === blockIndex) {
        return { ...block, [field]: value };
      }
      return block;
    });
    
    updateWeek(weekNumber, { ...week, blocks: updatedBlocks });
  };

  const validation = validateProgression(currentProgression);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header con 1RM */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3 border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="h-4 w-4 text-foreground" />
          <Label className="text-sm font-semibold text-foreground">Massimale (1RM)</Label>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={currentProgression.oneRepMax || ''}
            onChange={(e) => updateOneRepMax(e.target.value)}
            placeholder="100"
            className="w-28 h-9 text-sm font-semibold"
            min={1}
            max={500}
            step={0.5}
          />
          <span className="text-sm text-muted-foreground">kg</span>
        </div>
      </div>

      {/* Settimane */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-foreground">
            Configurazione Settimane ({currentProgression.weeks.length})
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addWeek}
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Aggiungi Week
          </Button>
        </div>

        {currentProgression.weeks
          .sort((a, b) => a.weekNumber - b.weekNumber)
          .map((week) => (
            <Card key={week.weekNumber} className="border-border/50">
              <CardHeader
                className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleWeekExpanded(week.weekNumber)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    {expandedWeeks.has(week.weekNumber) ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-foreground">Week {week.weekNumber}</span>
                    <span className="text-muted-foreground font-normal text-xs">
                      ({week.blocks.length} {week.blocks.length === 1 ? 'blocco' : 'blocchi'})
                    </span>
                  </CardTitle>
                  {currentProgression.weeks.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeWeek(week.weekNumber);
                      }}
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardHeader>

              {expandedWeeks.has(week.weekNumber) && (
                <CardContent className="pt-0 pb-4 px-4 space-y-3">
                  {week.blocks.map((block, blockIndex) => (
                    <div
                      key={blockIndex}
                      className="bg-muted/30 rounded-lg p-3 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Blocco {blockIndex + 1}
                        </span>
                        {week.blocks.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBlockFromWeek(week.weekNumber, blockIndex)}
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {/* Sets */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Sets</Label>
                          <Input
                            type="number"
                            value={block.sets}
                            onChange={(e) =>
                              updateBlock(week.weekNumber, blockIndex, 'sets', parseInt(e.target.value) || 1)
                            }
                            min={1}
                            max={10}
                            className="h-9"
                          />
                        </div>

                        {/* Reps */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Reps</Label>
                          <Input
                            type="number"
                            value={block.reps}
                            onChange={(e) =>
                              updateBlock(week.weekNumber, blockIndex, 'reps', parseInt(e.target.value) || 1)
                            }
                            min={1}
                            max={30}
                            className="h-9"
                          />
                        </div>

                        {/* Percentage */}
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">% 1RM</Label>
                          <Input
                            type="number"
                            value={block.percentage}
                            onChange={(e) =>
                              updateBlock(week.weekNumber, blockIndex, 'percentage', parseInt(e.target.value) || 50)
                            }
                            min={30}
                            max={100}
                            className="h-9"
                          />
                        </div>
                      </div>

                      {/* Preview carico calcolato */}
                      {currentProgression.oneRepMax > 0 && (
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <span className="text-xs text-muted-foreground">Carico calcolato:</span>
                          <span className="text-sm font-bold text-foreground">
                            {calculateLoadFromPercentage(currentProgression.oneRepMax, block.percentage)} kg
                          </span>
                        </div>
                      )}
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addBlockToWeek(week.weekNumber)}
                    className="w-full gap-1 border-dashed"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Aggiungi Blocco
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
      </div>

      {/* Schema Preview */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Preview Schema</Label>
        <div className="space-y-1.5">
          {currentProgression.weeks
            .sort((a, b) => a.weekNumber - b.weekNumber)
            .map((week) => (
              <div key={week.weekNumber} className="text-sm flex items-center gap-2">
                <span className="font-semibold text-foreground bg-gray-200 px-1.5 py-0.5 rounded text-xs">
                  W{week.weekNumber}
                </span>
                <span className="text-foreground">
                  {week.blocks
                    .map((b) => `${b.sets}x${b.reps}@${b.percentage}%`)
                    .join(' + ')}
                </span>
                {currentProgression.oneRepMax > 0 && (
                  <span className="text-muted-foreground">
                    ({week.blocks
                      .map((b) => `${calculateLoadFromPercentage(currentProgression.oneRepMax, b.percentage)}kg`)
                      .join(', ')})
                  </span>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Errori di validazione */}
      {!validation.valid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <ul className="text-sm text-red-600 space-y-1">
            {validation.errors.map((error, idx) => (
              <li key={idx}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

