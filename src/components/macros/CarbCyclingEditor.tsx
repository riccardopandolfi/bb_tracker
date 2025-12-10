import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { CarbCyclingTemplate, CarbCyclingMode } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Save, Trash2, Play, Calculator, Plus, Check } from 'lucide-react';

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const DAY_FULL_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

interface CarbCyclingEditorProps {
  onApply?: () => void;
}

export function CarbCyclingEditor({ onApply }: CarbCyclingEditorProps) {
  const { 
    carbCyclingTemplates = [], 
    saveCarbCyclingTemplate, 
    deleteCarbCyclingTemplate,
    applyCarbCyclingToWeeks,
    activeCarbCyclingId,
    getCurrentProgram,
    calculateMacrosFromBase
  } = useApp();

  // Assicura che sia sempre un array
  const templates = carbCyclingTemplates ?? [];

  const program = getCurrentProgram();
  const weekNumbers = program ? Object.keys(program.weeks).map(Number).sort((a, b) => a - b) : [];

  // Form state
  const [templateName, setTemplateName] = useState('');
  const [baseMacros, setBaseMacros] = useState({ protein: 150, carbs: 250, fat: 70 });
  const [mode, setMode] = useState<CarbCyclingMode>('per_day');
  const [dayMultipliers, setDayMultipliers] = useState<number[]>([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]);
  const [trainingMultiplier, setTrainingMultiplier] = useState(1.2);
  const [restMultiplier, setRestMultiplier] = useState(0.8);
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([]);
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState<number[][]>([]);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Calcola calorie base
  const baseKcal = Math.round(baseMacros.protein * 4 + baseMacros.carbs * 4 + baseMacros.fat * 9);

  // Inizializza i giorni di allenamento per le settimane (ma NON seleziona le settimane)
  useEffect(() => {
    if (weekNumbers.length > 0 && trainingDaysPerWeek.length === 0) {
      setTrainingDaysPerWeek(weekNumbers.map(() => [0, 2, 4])); // Default: Lun, Mer, Ven
    }
  }, [weekNumbers.length]);

  // Carica un template per modificarlo
  const loadTemplate = (template: CarbCyclingTemplate) => {
    setEditingTemplateId(template.id);
    setTemplateName(template.name);
    setBaseMacros(template.baseMacros);
    setMode(template.mode);
    if (template.dayMultipliers) setDayMultipliers(template.dayMultipliers);
    if (template.trainingMultiplier) setTrainingMultiplier(template.trainingMultiplier);
    if (template.restMultiplier) setRestMultiplier(template.restMultiplier);
  };

  // Salva il template
  const handleSave = () => {
    if (!templateName.trim()) {
      alert('Inserisci un nome per il template');
      return;
    }

    const template: CarbCyclingTemplate = {
      id: editingTemplateId || crypto.randomUUID(),
      name: templateName.trim(),
      baseMacros,
      mode,
      dayMultipliers: mode === 'per_day' ? dayMultipliers : undefined,
      trainingMultiplier: mode === 'training_based' ? trainingMultiplier : undefined,
      restMultiplier: mode === 'training_based' ? restMultiplier : undefined,
    };

    saveCarbCyclingTemplate(template);
    setEditingTemplateId(template.id);
  };

  // Nuovo template
  const handleNewTemplate = () => {
    setEditingTemplateId(null);
    setTemplateName('');
    setBaseMacros({ protein: 150, carbs: 250, fat: 70 });
    setMode('per_day');
    setDayMultipliers([1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]);
    setTrainingMultiplier(1.2);
    setRestMultiplier(0.8);
  };

  // Applica alle settimane con conferma
  const handleApply = () => {
    if (selectedWeeks.length === 0) {
      alert('Seleziona almeno una settimana');
      return;
    }

    if (!templateName.trim()) {
      alert('Inserisci un nome per il template');
      return;
    }

    // Mostra conferma
    const weekList = selectedWeeks.map(w => `Week ${w}`).join(', ');
    const confirmed = confirm(
      `Stai per sovrascrivere i macro delle seguenti settimane:\n\n${weekList}\n\nI dati inseriti manualmente verranno sostituiti. Continuare?`
    );
    
    if (!confirmed) return;

    // Genera ID se nuovo template, oppure usa quello esistente
    const templateId = editingTemplateId || crypto.randomUUID();
    
    // Crea/aggiorna il template
    const template: CarbCyclingTemplate = {
      id: templateId,
      name: templateName.trim(),
      baseMacros,
      mode,
      dayMultipliers: mode === 'per_day' ? dayMultipliers : undefined,
      trainingMultiplier: mode === 'training_based' ? trainingMultiplier : undefined,
      restMultiplier: mode === 'training_based' ? restMultiplier : undefined,
    };

    // Salva il template
    saveCarbCyclingTemplate(template);
    setEditingTemplateId(templateId);

    // Applica alle settimane passando il template direttamente (evita problemi di timing)
    applyCarbCyclingToWeeks(
      templateId, 
      selectedWeeks, 
      mode === 'training_based' ? trainingDaysPerWeek : undefined,
      template // Passa il template direttamente
    );

    onApply?.();
  };

  // Toggle settimana
  const toggleWeek = (weekNum: number) => {
    setSelectedWeeks(prev => 
      prev.includes(weekNum) 
        ? prev.filter(w => w !== weekNum)
        : [...prev, weekNum].sort((a, b) => a - b)
    );
  };

  // Toggle giorno allenamento per una settimana
  const toggleTrainingDay = (weekIdx: number, dayIdx: number) => {
    setTrainingDaysPerWeek(prev => {
      const newDays = [...prev];
      if (!newDays[weekIdx]) newDays[weekIdx] = [];
      if (newDays[weekIdx].includes(dayIdx)) {
        newDays[weekIdx] = newDays[weekIdx].filter(d => d !== dayIdx);
      } else {
        newDays[weekIdx] = [...newDays[weekIdx], dayIdx].sort((a, b) => a - b);
      }
      return newDays;
    });
  };

  // Preview calorie per giorno
  const getPreviewForDay = (dayIdx: number, weekIdx?: number) => {
    let multiplier = 1.0;
    if (mode === 'per_day') {
      multiplier = dayMultipliers[dayIdx];
    } else if (mode === 'training_based' && weekIdx !== undefined) {
      const isTraining = trainingDaysPerWeek[weekIdx]?.includes(dayIdx);
      multiplier = isTraining ? trainingMultiplier : restMultiplier;
    }
    return calculateMacrosFromBase(baseMacros, multiplier);
  };

  return (
    <div className="space-y-6">
      {/* Template salvati */}
      {templates.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Template Salvati</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {templates.map(template => (
                <Badge
                  key={template.id}
                  variant={editingTemplateId === template.id ? 'default' : 'outline'}
                  className="cursor-pointer flex items-center gap-1 py-1.5 px-3"
                  onClick={() => loadTemplate(template)}
                >
                  {template.name}
                  {activeCarbCyclingId === template.id && (
                    <Check className="w-3 h-3 ml-1 text-green-500" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Eliminare "${template.name}"?`)) {
                        deleteCarbCyclingTemplate(template.id);
                        if (editingTemplateId === template.id) handleNewTemplate();
                      }
                    }}
                    className="ml-1 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <Button variant="ghost" size="sm" onClick={handleNewTemplate} className="h-7">
                <Plus className="w-3 h-3 mr-1" /> Nuovo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            {editingTemplateId ? 'Modifica Template' : 'Nuovo Template'}
          </CardTitle>
          <CardDescription className="text-xs">
            Configura i macro base e le variazioni giornaliere
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nome template */}
          <div>
            <Label className="text-xs">Nome Template</Label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Es. Cutting Standard"
              className="h-9"
            />
          </div>

          {/* Macro Base */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Macro Base Giornalieri</Label>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label className="text-[10px] text-muted-foreground">Proteine (g)</Label>
                <Input
                  type="number"
                  value={baseMacros.protein}
                  onChange={(e) => setBaseMacros(prev => ({ ...prev, protein: parseInt(e.target.value) || 0 }))}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Carbo (g)</Label>
                <Input
                  type="number"
                  value={baseMacros.carbs}
                  onChange={(e) => setBaseMacros(prev => ({ ...prev, carbs: parseInt(e.target.value) || 0 }))}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Grassi (g)</Label>
                <Input
                  type="number"
                  value={baseMacros.fat}
                  onChange={(e) => setBaseMacros(prev => ({ ...prev, fat: parseInt(e.target.value) || 0 }))}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Calorie</Label>
                <div className="h-8 flex items-center px-3 bg-muted rounded-md text-sm font-medium">
                  {baseKcal} kcal
                </div>
              </div>
            </div>
          </div>

          {/* Modalità */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as CarbCyclingMode)}>
            <TabsList className="grid grid-cols-2 h-8">
              <TabsTrigger value="per_day" className="text-xs">Per Giorno</TabsTrigger>
              <TabsTrigger value="training_based" className="text-xs">Training/Rest</TabsTrigger>
            </TabsList>

            {/* Per Giorno */}
            <TabsContent value="per_day" className="mt-3 space-y-3">
              <p className="text-xs text-muted-foreground">
                Imposta un moltiplicatore diverso per ogni giorno della settimana
              </p>
              <div className="grid grid-cols-7 gap-1">
                {DAY_NAMES.map((day, idx) => (
                  <div key={day} className="text-center space-y-1">
                    <Label className="text-[10px] text-muted-foreground block">{day}</Label>
                    <Input
                      type="number"
                      step="0.05"
                      min="0.5"
                      max="2"
                      value={dayMultipliers[idx]}
                      onChange={(e) => {
                        const newMultipliers = [...dayMultipliers];
                        newMultipliers[idx] = parseFloat(e.target.value) || 1.0;
                        setDayMultipliers(newMultipliers);
                      }}
                      className="h-7 text-xs text-center px-1"
                    />
                    <div className="text-[9px] text-muted-foreground">
                      {getPreviewForDay(idx).kcal}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-7"
                  onClick={() => setDayMultipliers([1.2, 0.8, 1.2, 0.8, 1.2, 1.0, 0.7])}
                >
                  High/Low Alternato
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-7"
                  onClick={() => setDayMultipliers([1.0, 1.0, 1.0, 1.0, 1.0, 1.3, 0.7])}
                >
                  Refeed Weekend
                </Button>
              </div>
            </TabsContent>

            {/* Training Based */}
            <TabsContent value="training_based" className="mt-3 space-y-3">
              <p className="text-xs text-muted-foreground">
                Macro diversi per giorni di allenamento e riposo
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-green-600">Training Day (×)</Label>
                  <Input
                    type="number"
                    step="0.05"
                    min="0.5"
                    max="2"
                    value={trainingMultiplier}
                    onChange={(e) => setTrainingMultiplier(parseFloat(e.target.value) || 1.0)}
                    className="h-8"
                  />
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {calculateMacrosFromBase(baseMacros, trainingMultiplier).kcal} kcal
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-orange-600">Rest Day (×)</Label>
                  <Input
                    type="number"
                    step="0.05"
                    min="0.5"
                    max="2"
                    value={restMultiplier}
                    onChange={(e) => setRestMultiplier(parseFloat(e.target.value) || 1.0)}
                    className="h-8"
                  />
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {calculateMacrosFromBase(baseMacros, restMultiplier).kcal} kcal
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Selezione Settimane */}
      {weekNumbers.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Applica alle Settimane</CardTitle>
            <CardDescription className="text-xs">
              Seleziona le settimane a cui applicare questo piano
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {weekNumbers.map((weekNum) => (
                <Badge
                  key={weekNum}
                  variant={selectedWeeks.includes(weekNum) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleWeek(weekNum)}
                >
                  Week {weekNum}
                </Badge>
              ))}
            </div>

            {/* Giorni allenamento per Training Based */}
            {mode === 'training_based' && selectedWeeks.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-xs">Giorni di Allenamento per Settimana</Label>
                {selectedWeeks.map((weekNum, weekIdx) => (
                  <div key={weekNum} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16">W{weekNum}:</span>
                    <div className="flex gap-1">
                      {DAY_NAMES.map((day, dayIdx) => (
                        <button
                          key={dayIdx}
                          onClick={() => toggleTrainingDay(weekIdx, dayIdx)}
                          className={`w-8 h-6 text-[10px] rounded transition-colors ${
                            trainingDaysPerWeek[weekIdx]?.includes(dayIdx)
                              ? 'bg-green-500 text-white'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Preview Piano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1 px-2">Giorno</th>
                  <th className="text-right py-1 px-2">×</th>
                  <th className="text-right py-1 px-2">P</th>
                  <th className="text-right py-1 px-2">C</th>
                  <th className="text-right py-1 px-2">G</th>
                  <th className="text-right py-1 px-2">Kcal</th>
                </tr>
              </thead>
              <tbody>
                {DAY_FULL_NAMES.map((day, idx) => {
                  const preview = getPreviewForDay(idx, 0);
                  const mult = mode === 'per_day' 
                    ? dayMultipliers[idx] 
                    : (trainingDaysPerWeek[0]?.includes(idx) ? trainingMultiplier : restMultiplier);
                  const isHigh = mult > 1.05;
                  const isLow = mult < 0.95;
                  return (
                    <tr key={idx} className={`border-b ${isHigh ? 'bg-green-50' : isLow ? 'bg-orange-50' : ''}`}>
                      <td className="py-1.5 px-2">{day}</td>
                      <td className="text-right py-1.5 px-2 text-muted-foreground">{mult.toFixed(2)}</td>
                      <td className="text-right py-1.5 px-2">{preview.protein}g</td>
                      <td className="text-right py-1.5 px-2">{preview.carbs}g</td>
                      <td className="text-right py-1.5 px-2">{preview.fat}g</td>
                      <td className="text-right py-1.5 px-2 font-medium">{preview.kcal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Salva Template
        </Button>
        <Button className="flex-1" onClick={handleApply} disabled={selectedWeeks.length === 0}>
          <Play className="w-4 h-4 mr-2" />
          Applica a {selectedWeeks.length} Settimane
        </Button>
      </div>
    </div>
  );
}

