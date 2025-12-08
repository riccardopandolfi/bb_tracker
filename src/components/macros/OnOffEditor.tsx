import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { OnOffMacrosPlan, PlannedDayMacros } from '@/types';
import { Dumbbell, Moon, Save, Zap } from 'lucide-react';

interface OnOffEditorProps {
  onApply?: () => void;
}

// Calcola kcal dai macro
const calculateKcal = (protein: number, carbs: number, fat: number): number => {
  return Math.round(protein * 4 + carbs * 4 + fat * 9);
};

export function OnOffEditor({ onApply }: OnOffEditorProps) {
  const { onOffPlan, updateOnOffPlan } = useApp();
  
  // Stato locale per l'editing
  const [onMacros, setOnMacros] = useState<PlannedDayMacros>({
    protein: 0,
    carbs: 0,
    fat: 0,
    kcal: 0,
  });
  
  const [offMacros, setOffMacros] = useState<PlannedDayMacros>({
    protein: 0,
    carbs: 0,
    fat: 0,
    kcal: 0,
  });
  
  // Carica valori esistenti
  useEffect(() => {
    if (onOffPlan) {
      setOnMacros(onOffPlan.onDayMacros);
      setOffMacros(onOffPlan.offDayMacros);
    }
  }, [onOffPlan]);
  
  // Aggiorna macro On
  const handleOnChange = (field: 'protein' | 'carbs' | 'fat', value: number) => {
    setOnMacros(prev => {
      const updated = { ...prev, [field]: value };
      updated.kcal = calculateKcal(updated.protein, updated.carbs, updated.fat);
      return updated;
    });
  };
  
  // Aggiorna macro Off
  const handleOffChange = (field: 'protein' | 'carbs' | 'fat', value: number) => {
    setOffMacros(prev => {
      const updated = { ...prev, [field]: value };
      updated.kcal = calculateKcal(updated.protein, updated.carbs, updated.fat);
      return updated;
    });
  };
  
  // Salva il piano
  const handleSave = () => {
    const plan: OnOffMacrosPlan = {
      onDayMacros: onMacros,
      offDayMacros: offMacros,
    };
    updateOnOffPlan(plan);
    onApply?.();
  };
  
  // Differenza calorie
  const kcalDiff = onMacros.kcal - offMacros.kcal;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Configurazione Macro On/Off</h3>
        <p className="text-sm text-muted-foreground">
          Definisci i macro per i giorni di allenamento (On) e riposo (Off)
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* Giorno On */}
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Dumbbell className="w-5 h-5" />
              Giorno On
            </CardTitle>
            <CardDescription>Giorni di allenamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-green-700">Proteine (g)</Label>
              <Input
                type="number"
                value={onMacros.protein || ''}
                onChange={(e) => handleOnChange('protein', parseInt(e.target.value) || 0)}
                className="h-10 border-green-200 focus:border-green-400"
                placeholder="es. 180"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-green-700">Carboidrati (g)</Label>
              <Input
                type="number"
                value={onMacros.carbs || ''}
                onChange={(e) => handleOnChange('carbs', parseInt(e.target.value) || 0)}
                className="h-10 border-green-200 focus:border-green-400"
                placeholder="es. 300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-green-700">Grassi (g)</Label>
              <Input
                type="number"
                value={onMacros.fat || ''}
                onChange={(e) => handleOnChange('fat', parseInt(e.target.value) || 0)}
                className="h-10 border-green-200 focus:border-green-400"
                placeholder="es. 70"
              />
            </div>
            <div className="pt-3 border-t border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700">Calorie Totali</span>
                <span className="text-2xl font-bold text-green-600">{onMacros.kcal} kcal</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Giorno Off */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Moon className="w-5 h-5" />
              Giorno Off
            </CardTitle>
            <CardDescription>Giorni di riposo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-blue-700">Proteine (g)</Label>
              <Input
                type="number"
                value={offMacros.protein || ''}
                onChange={(e) => handleOffChange('protein', parseInt(e.target.value) || 0)}
                className="h-10 border-blue-200 focus:border-blue-400"
                placeholder="es. 180"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-blue-700">Carboidrati (g)</Label>
              <Input
                type="number"
                value={offMacros.carbs || ''}
                onChange={(e) => handleOffChange('carbs', parseInt(e.target.value) || 0)}
                className="h-10 border-blue-200 focus:border-blue-400"
                placeholder="es. 200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-blue-700">Grassi (g)</Label>
              <Input
                type="number"
                value={offMacros.fat || ''}
                onChange={(e) => handleOffChange('fat', parseInt(e.target.value) || 0)}
                className="h-10 border-blue-200 focus:border-blue-400"
                placeholder="es. 80"
              />
            </div>
            <div className="pt-3 border-t border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">Calorie Totali</span>
                <span className="text-2xl font-bold text-blue-600">{offMacros.kcal} kcal</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Differenza */}
      {(onMacros.kcal > 0 || offMacros.kcal > 0) && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-4">
              <Zap className="w-5 h-5 text-amber-600" />
              <div className="text-center">
                <span className="text-sm text-amber-700">Differenza On vs Off:</span>
                <span className={`ml-2 text-lg font-bold ${kcalDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kcalDiff >= 0 ? '+' : ''}{kcalDiff} kcal
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Info */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p className="font-medium mb-2">💡 Come funziona:</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Configura i macro per giorni On (allenamento) e Off (riposo)</li>
          <li>Salva il piano con il pulsante qui sotto</li>
          <li>Nella vista Settimana, seleziona On o Off per ogni giorno</li>
          <li>I macro si aggiorneranno automaticamente in base alla selezione</li>
        </ol>
      </div>
      
      {/* Pulsante salva */}
      <Button 
        onClick={handleSave}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        size="lg"
      >
        <Save className="w-4 h-4 mr-2" />
        Salva Piano On/Off
      </Button>
    </div>
  );
}

