import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { DayMacros, Supplement } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { CheckCircle2, Circle, Copy, Plus, X } from 'lucide-react';

const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

// Calcola calorie automaticamente
const calculateKcal = (protein: string, carbs: string, fat: string): number => {
  const p = parseFloat(protein) || 0;
  const c = parseFloat(carbs) || 0;
  const f = parseFloat(fat) || 0;
  return Math.round(p * 4 + c * 4 + f * 9);
};

export function MacrosTab() {
  const { dailyMacros, initializeDailyMacros, updateDailyMacros, checkDay, getCurrentDayIndex } = useApp();
  const [localMacros, setLocalMacros] = useState<DayMacros[]>([]);

  // Inizializza dailyMacros se non esiste
  useEffect(() => {
    if (!dailyMacros) {
      initializeDailyMacros();
    }
  }, [dailyMacros, initializeDailyMacros]);

  // Sincronizza localMacros con dailyMacros
  useEffect(() => {
    if (dailyMacros) {
      // Assicura che ogni giorno abbia supplements anche se è undefined (per retrocompatibilità)
      const migratedDays = dailyMacros.days.map(day => ({
        ...day,
        supplements: day.supplements || []
      }));
      setLocalMacros(migratedDays);
    }
  }, [dailyMacros]);

  const currentDayIndex = getCurrentDayIndex();

  // Aggiorna un campo e salva automaticamente
  const handleUpdateDay = (dayIndex: number, field: keyof Omit<DayMacros, 'kcal' | 'supplements'>, value: string) => {
    const updated = [...localMacros];
    const currentDay = updated[dayIndex];

    // Aggiorna il campo
    updated[dayIndex] = {
      ...currentDay,
      [field]: value,
    };

    // Calcola calorie automaticamente
    const kcal = calculateKcal(
      field === 'protein' ? value : currentDay.protein,
      field === 'carbs' ? value : currentDay.carbs,
      field === 'fat' ? value : currentDay.fat
    ).toString();

    updated[dayIndex].kcal = kcal;

    setLocalMacros(updated);

    // Salva immediatamente
    updateDailyMacros(dayIndex, updated[dayIndex]);
  };

  // Aggiungi integratore
  const handleAddSupplement = (dayIndex: number) => {
    const updated = [...localMacros];
    const newSupplement: Supplement = { name: '', grams: '' };
    updated[dayIndex] = {
      ...updated[dayIndex],
      supplements: [...(updated[dayIndex].supplements || []), newSupplement]
    };
    setLocalMacros(updated);
    updateDailyMacros(dayIndex, updated[dayIndex]);
  };

  // Rimuovi integratore
  const handleRemoveSupplement = (dayIndex: number, suppIndex: number) => {
    const updated = [...localMacros];
    const supplements = [...(updated[dayIndex].supplements || [])];
    supplements.splice(suppIndex, 1);
    updated[dayIndex] = {
      ...updated[dayIndex],
      supplements
    };
    setLocalMacros(updated);
    updateDailyMacros(dayIndex, updated[dayIndex]);
  };

  // Aggiorna integratore
  const handleUpdateSupplement = (dayIndex: number, suppIndex: number, field: keyof Supplement, value: string) => {
    const updated = [...localMacros];
    const supplements = [...(updated[dayIndex].supplements || [])];
    supplements[suppIndex] = {
      ...supplements[suppIndex],
      [field]: value
    };
    updated[dayIndex] = {
      ...updated[dayIndex],
      supplements
    };
    setLocalMacros(updated);
    updateDailyMacros(dayIndex, updated[dayIndex]);
  };

  const handleCopyToAll = (dayIndex: number) => {
    if (!confirm('Copiare i macro di questo giorno a tutti gli altri giorni?')) return;

    const sourceMacros = localMacros[dayIndex];
    const updated = localMacros.map(() => ({ ...sourceMacros, supplements: [...(sourceMacros.supplements || [])] }));
    setLocalMacros(updated);

    // Salva tutti i giorni
    updated.forEach((macros, idx) => {
      updateDailyMacros(idx, macros);
    });
  };

  const handleCheckDay = (dayIndex: number) => {
    checkDay(dayIndex);
  };

  // Calcola media settimanale
  const calculateWeeklyAverage = () => {
    if (!dailyMacros) return null;

    let totalKcal = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let count = 0;

    dailyMacros.days.forEach((day) => {
      const protein = parseFloat(day.protein) || 0;
      const carbs = parseFloat(day.carbs) || 0;
      const fat = parseFloat(day.fat) || 0;

      if (protein > 0 || carbs > 0 || fat > 0) {
        totalKcal += calculateKcal(day.protein, day.carbs, day.fat);
        totalProtein += protein;
        totalCarbs += carbs;
        totalFat += fat;
        count++;
      }
    });

    if (count === 0) return null;

    return {
      kcal: (totalKcal / count).toFixed(0),
      protein: (totalProtein / count).toFixed(0),
      carbs: (totalCarbs / count).toFixed(0),
      fat: (totalFat / count).toFixed(0),
    };
  };

  const weeklyAverage = calculateWeeklyAverage();
  const completedDays = dailyMacros?.checked.filter(c => c).length || 0;

  if (!dailyMacros) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Inizializzazione...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Macronutrienti Giornalieri</h2>
          <p className="text-muted-foreground">Configura e traccia i tuoi macro giorno per giorno</p>
        </div>
      </div>

      {/* Card Riepilogo */}
      {weeklyAverage && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Riepilogo Settimanale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Completati</div>
                <div className="text-2xl font-bold">{completedDays}/7</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Media Kcal</div>
                <div className="text-2xl font-bold">{weeklyAverage.kcal}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Media Proteine</div>
                <div className="text-2xl font-bold">{weeklyAverage.protein}g</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Media Carbo</div>
                <div className="text-2xl font-bold">{weeklyAverage.carbs}g</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Media Grassi</div>
                <div className="text-2xl font-bold">{weeklyAverage.fat}g</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Progressione settimanale</span>
                <span className="text-xs font-medium">{completedDays}/7 giorni</span>
              </div>
              <div className="flex items-center gap-1">
                {dailyMacros.checked.map((checked, idx) => (
                  <div
                    key={idx}
                    className={`h-2 flex-1 rounded-full ${
                      checked ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                    title={`${DAY_NAMES[idx]}${checked ? ' - Completato' : ''}`}
                  />
                ))}
              </div>
              {completedDays === 7 && (
                <p className="text-xs text-green-600 mt-2 text-center font-medium">
                  ✓ Settimana completata! I progressi verranno resettati al prossimo completamento.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card Macro Settimanali - Unificata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Macro Settimanali</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Configura i macro, gli integratori e spunta i giorni completati. Le calorie vengono calcolate automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DAY_NAMES.map((dayName, dayIndex) => {
              const day = localMacros[dayIndex];
              const isChecked = dailyMacros.checked[dayIndex];
              const isToday = dayIndex === currentDayIndex;
              const hasMacros = day && (day.protein || day.carbs || day.fat);
              const calculatedKcal = day ? calculateKcal(day.protein, day.carbs, day.fat) : 0;
              const supplements = day?.supplements || [];

              return (
                <Card
                  key={dayIndex}
                  className={`p-4 ${
                    isChecked
                      ? 'border-green-500 bg-green-50/50'
                      : isToday
                      ? 'border-blue-500 border-2 bg-blue-50/50'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleCheckDay(dayIndex)}
                        className="focus:outline-none"
                        disabled={!hasMacros}
                        title={hasMacros ? "Segna come completato" : "Configura prima i macro"}
                      >
                        {isChecked ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : (
                          <Circle className={`w-6 h-6 ${hasMacros ? 'text-gray-400 hover:text-blue-600 cursor-pointer' : 'text-gray-300'}`} />
                        )}
                      </button>

                      {/* Nome giorno */}
                      <h4 className="font-bold flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-sm font-medium ${
                          isToday
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {dayName}
                        </span>
                        {isToday && (
                          <span className="text-xs text-blue-600">(Oggi)</span>
                        )}
                      </h4>
                    </div>

                    {/* Pulsante copia */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToAll(dayIndex)}
                      className="text-xs gap-1"
                      disabled={!hasMacros}
                    >
                      <Copy className="w-3 h-3" />
                      Copia a tutti
                    </Button>
                  </div>

                  {/* Input macro + calorie calcolate */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    <div>
                      <Label className="text-xs">Proteine (g)</Label>
                      <Input
                        type="number"
                        value={day?.protein || ''}
                        onChange={(e) => handleUpdateDay(dayIndex, 'protein', e.target.value)}
                        placeholder="es. 180"
                        min="0"
                        step="1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Carboidrati (g)</Label>
                      <Input
                        type="number"
                        value={day?.carbs || ''}
                        onChange={(e) => handleUpdateDay(dayIndex, 'carbs', e.target.value)}
                        placeholder="es. 300"
                        min="0"
                        step="1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Grassi (g)</Label>
                      <Input
                        type="number"
                        value={day?.fat || ''}
                        onChange={(e) => handleUpdateDay(dayIndex, 'fat', e.target.value)}
                        placeholder="es. 70"
                        min="0"
                        step="1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Kcal (calcolate)</Label>
                      <div className="h-10 px-3 py-2 rounded-md border border-input bg-gray-50 flex items-center">
                        <span className="text-sm font-semibold text-gray-700">
                          {calculatedKcal > 0 ? calculatedKcal : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Integratori */}
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-semibold">Integratori</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddSupplement(dayIndex)}
                        className="h-7 text-xs gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Aggiungi
                      </Button>
                    </div>

                    {supplements.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Nessun integratore configurato
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {supplements.map((supp, suppIndex) => (
                          <div key={suppIndex} className="flex items-center gap-2">
                            <Input
                              type="text"
                              value={supp.name}
                              onChange={(e) => handleUpdateSupplement(dayIndex, suppIndex, 'name', e.target.value)}
                              placeholder="Nome integratore"
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              value={supp.grams}
                              onChange={(e) => handleUpdateSupplement(dayIndex, suppIndex, 'grams', e.target.value)}
                              placeholder="g"
                              className="w-20"
                              min="0"
                              step="0.1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSupplement(dayIndex, suppIndex)}
                              className="h-8 w-8 p-0"
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
