import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { CarbCyclingTemplate, CarbCyclingMode, MacroMultiplier } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Save, Trash2, Play, Calculator, Plus, Check } from 'lucide-react';

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const DAY_FULL_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

// Moltiplicatore di default
const DEFAULT_MULTIPLIER: MacroMultiplier = { protein: 1.0, carbs: 1.0, fat: 1.0 };

// Helper per creare 7 moltiplicatori di default
const createDefaultDayMultipliers = (): MacroMultiplier[] => 
  Array(7).fill(null).map(() => ({ ...DEFAULT_MULTIPLIER }));

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
  const [dayMultipliers, setDayMultipliers] = useState<MacroMultiplier[]>(createDefaultDayMultipliers());
  const [trainingMultiplier, setTrainingMultiplier] = useState<MacroMultiplier>({ protein: 1.0, carbs: 1.2, fat: 1.0 });
  const [restMultiplier, setRestMultiplier] = useState<MacroMultiplier>({ protein: 1.0, carbs: 0.7, fat: 1.1 });
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
    setDayMultipliers(createDefaultDayMultipliers());
    setTrainingMultiplier({ protein: 1.0, carbs: 1.2, fat: 1.0 });
    setRestMultiplier({ protein: 1.0, carbs: 0.7, fat: 1.1 });
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

  // Aggiorna moltiplicatore per un giorno specifico
  const updateDayMultiplier = (dayIdx: number, field: keyof MacroMultiplier, value: number) => {
    setDayMultipliers(prev => {
      const newMultipliers = [...prev];
      newMultipliers[dayIdx] = { ...newMultipliers[dayIdx], [field]: value };
      return newMultipliers;
    });
  };

  // Preview calorie per giorno
  const getPreviewForDay = (dayIdx: number, weekIdx?: number): { protein: number; carbs: number; fat: number; kcal: number } => {
    let multiplier: MacroMultiplier = DEFAULT_MULTIPLIER;
    if (mode === 'per_day') {
      multiplier = dayMultipliers[dayIdx] || DEFAULT_MULTIPLIER;
    } else if (mode === 'training_based' && weekIdx !== undefined) {
      const isTraining = trainingDaysPerWeek[weekIdx]?.includes(dayIdx);
      multiplier = isTraining ? trainingMultiplier : restMultiplier;
    }
    return calculateMacrosFromBase(baseMacros, multiplier);
  };

  // Preset per modalità per giorno
  const applyDayPreset = (preset: 'highLow' | 'refeed') => {
    if (preset === 'highLow') {
      // High/Low alternato - varia principalmente i carbo
      setDayMultipliers([
        { protein: 1.0, carbs: 1.3, fat: 0.9 },  // Lun - High
        { protein: 1.0, carbs: 0.7, fat: 1.1 },  // Mar - Low
        { protein: 1.0, carbs: 1.3, fat: 0.9 },  // Mer - High
        { protein: 1.0, carbs: 0.7, fat: 1.1 },  // Gio - Low
        { protein: 1.0, carbs: 1.3, fat: 0.9 },  // Ven - High
        { protein: 1.0, carbs: 1.0, fat: 1.0 },  // Sab - Medium
        { protein: 1.0, carbs: 0.6, fat: 1.2 },  // Dom - Low
      ]);
    } else if (preset === 'refeed') {
      // Refeed weekend - carbo alti sabato, bassi domenica
      setDayMultipliers([
        { protein: 1.0, carbs: 1.0, fat: 1.0 },
        { protein: 1.0, carbs: 1.0, fat: 1.0 },
        { protein: 1.0, carbs: 1.0, fat: 1.0 },
        { protein: 1.0, carbs: 1.0, fat: 1.0 },
        { protein: 1.0, carbs: 1.0, fat: 1.0 },
        { protein: 1.0, carbs: 1.5, fat: 0.7 },  // Sab - Refeed
        { protein: 1.0, carbs: 0.5, fat: 1.3 },  // Dom - Low
      ]);
    }
  };

  // Componente per input moltiplicatore singolo
  const MultiplierInput = ({ 
    value, 
    onChange, 
    label, 
    color 
  }: { 
    value: number; 
    onChange: (v: number) => void; 
    label: string;
    color: string;
  }) => (
    <div className="flex flex-col items-center">
      <Label className={`text-[9px] ${color}`}>{label}</Label>
      <Input
        type="number"
        step="0.05"
        min="0.3"
        max="2"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 1.0)}
        className="h-6 w-12 text-[10px] text-center px-1"
      />
    </div>
  );

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
                Imposta moltiplicatori separati per Proteine, Carbo e Grassi per ogni giorno
              </p>
              
              {/* Header con legenda */}
              <div className="flex items-center gap-4 text-[10px]">
                <span className="text-blue-600 font-medium">P = Proteine</span>
                <span className="text-amber-600 font-medium">C = Carbo</span>
                <span className="text-rose-600 font-medium">G = Grassi</span>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {DAY_NAMES.map((day, idx) => (
                  <div key={day} className="text-center space-y-1 p-1 rounded bg-muted/30">
                    <Label className="text-[10px] text-muted-foreground block font-semibold">{day}</Label>
                    <div className="space-y-1">
                      <MultiplierInput
                        value={dayMultipliers[idx]?.protein ?? 1.0}
                        onChange={(v) => updateDayMultiplier(idx, 'protein', v)}
                        label="P"
                        color="text-blue-600"
                      />
                      <MultiplierInput
                        value={dayMultipliers[idx]?.carbs ?? 1.0}
                        onChange={(v) => updateDayMultiplier(idx, 'carbs', v)}
                        label="C"
                        color="text-amber-600"
                      />
                      <MultiplierInput
                        value={dayMultipliers[idx]?.fat ?? 1.0}
                        onChange={(v) => updateDayMultiplier(idx, 'fat', v)}
                        label="G"
                        color="text-rose-600"
                      />
                    </div>
                    <div className="text-[9px] text-muted-foreground pt-1 border-t border-muted">
                      {getPreviewForDay(idx).kcal} kcal
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-7"
                  onClick={() => applyDayPreset('highLow')}
                >
                  High/Low Alternato
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-7"
                  onClick={() => applyDayPreset('refeed')}
                >
                  Refeed Weekend
                </Button>
              </div>
            </TabsContent>

            {/* Training Based */}
            <TabsContent value="training_based" className="mt-3 space-y-3">
              <p className="text-xs text-muted-foreground">
                Moltiplicatori separati per P/C/G nei giorni di allenamento e riposo
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Training Day */}
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-xs text-green-700">🏋️ Training Day</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[9px] text-blue-600">Proteine (×)</Label>
                        <Input
                          type="number"
                          step="0.05"
                          min="0.5"
                          max="2"
                          value={trainingMultiplier.protein}
                          onChange={(e) => setTrainingMultiplier(prev => ({ ...prev, protein: parseFloat(e.target.value) || 1.0 }))}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[9px] text-amber-600">Carbo (×)</Label>
                        <Input
                          type="number"
                          step="0.05"
                          min="0.5"
                          max="2"
                          value={trainingMultiplier.carbs}
                          onChange={(e) => setTrainingMultiplier(prev => ({ ...prev, carbs: parseFloat(e.target.value) || 1.0 }))}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[9px] text-rose-600">Grassi (×)</Label>
                        <Input
                          type="number"
                          step="0.05"
                          min="0.5"
                          max="2"
                          value={trainingMultiplier.fat}
                          onChange={(e) => setTrainingMultiplier(prev => ({ ...prev, fat: parseFloat(e.target.value) || 1.0 }))}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                    <div className="text-[10px] text-green-700 font-medium pt-1 border-t border-green-200">
                      {calculateMacrosFromBase(baseMacros, trainingMultiplier).kcal} kcal
                    </div>
                  </CardContent>
                </Card>

                {/* Rest Day */}
                <Card className="border-orange-200 bg-orange-50/50">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-xs text-orange-700">😴 Rest Day</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[9px] text-blue-600">Proteine (×)</Label>
                        <Input
                          type="number"
                          step="0.05"
                          min="0.5"
                          max="2"
                          value={restMultiplier.protein}
                          onChange={(e) => setRestMultiplier(prev => ({ ...prev, protein: parseFloat(e.target.value) || 1.0 }))}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[9px] text-amber-600">Carbo (×)</Label>
                        <Input
                          type="number"
                          step="0.05"
                          min="0.5"
                          max="2"
                          value={restMultiplier.carbs}
                          onChange={(e) => setRestMultiplier(prev => ({ ...prev, carbs: parseFloat(e.target.value) || 1.0 }))}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[9px] text-rose-600">Grassi (×)</Label>
                        <Input
                          type="number"
                          step="0.05"
                          min="0.5"
                          max="2"
                          value={restMultiplier.fat}
                          onChange={(e) => setRestMultiplier(prev => ({ ...prev, fat: parseFloat(e.target.value) || 1.0 }))}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                    <div className="text-[10px] text-orange-700 font-medium pt-1 border-t border-orange-200">
                      {calculateMacrosFromBase(baseMacros, restMultiplier).kcal} kcal
                    </div>
                  </CardContent>
                </Card>
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
                  <th className="text-right py-1 px-2 text-blue-600">P×</th>
                  <th className="text-right py-1 px-2 text-amber-600">C×</th>
                  <th className="text-right py-1 px-2 text-rose-600">G×</th>
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
                    ? dayMultipliers[idx] || DEFAULT_MULTIPLIER
                    : (trainingDaysPerWeek[0]?.includes(idx) ? trainingMultiplier : restMultiplier);
                  const avgMult = (mult.protein + mult.carbs + mult.fat) / 3;
                  const isHigh = avgMult > 1.05;
                  const isLow = avgMult < 0.95;
                  return (
                    <tr key={idx} className={`border-b ${isHigh ? 'bg-green-50' : isLow ? 'bg-orange-50' : ''}`}>
                      <td className="py-1.5 px-2">{day}</td>
                      <td className="text-right py-1.5 px-2 text-blue-600 text-[10px]">{mult.protein.toFixed(2)}</td>
                      <td className="text-right py-1.5 px-2 text-amber-600 text-[10px]">{mult.carbs.toFixed(2)}</td>
                      <td className="text-right py-1.5 px-2 text-rose-600 text-[10px]">{mult.fat.toFixed(2)}</td>
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
