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
  const { dailyMacros, initializeDailyMacros, updateDailyMacros, checkDay, getCurrentDayIndex, updateSupplements } = useApp();
  const [localMacros, setLocalMacros] = useState<DayMacros[]>([]);
  const [localSupplements, setLocalSupplements] = useState<Supplement[]>([]);

  // Inizializza dailyMacros se non esiste
  useEffect(() => {
    if (!dailyMacros) {
      initializeDailyMacros();
    }
  }, [dailyMacros, initializeDailyMacros]);

  // Sincronizza localMacros e localSupplements con dailyMacros
  useEffect(() => {
    if (dailyMacros) {
      setLocalMacros([...dailyMacros.days]);
      setLocalSupplements(dailyMacros.supplements || []);
    }
  }, [dailyMacros]);

  const currentDayIndex = getCurrentDayIndex();

  // Aggiorna un campo e salva automaticamente
  const handleUpdateDay = (dayIndex: number, field: keyof DayMacros, value: string) => {
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
  const handleAddSupplement = () => {
    const newSupplement: Supplement = { name: '', grams: '' };
    const updated = [...localSupplements, newSupplement];
    setLocalSupplements(updated);
    updateSupplements(updated);
  };

  // Rimuovi integratore
  const handleRemoveSupplement = (suppIndex: number) => {
    const updated = [...localSupplements];
    updated.splice(suppIndex, 1);
    setLocalSupplements(updated);
    updateSupplements(updated);
  };

  // Aggiorna integratore
  const handleUpdateSupplement = (suppIndex: number, field: keyof Supplement, value: string) => {
    const updated = [...localSupplements];
    updated[suppIndex] = {
      ...updated[suppIndex],
      [field]: value
    };
    setLocalSupplements(updated);
    updateSupplements(updated);
  };

  const handleCopyToAll = (dayIndex: number) => {
    if (!confirm('Copiare i macro di questo giorno a tutti gli altri giorni?')) return;

    const sourceMacros = localMacros[dayIndex];
    const updated = localMacros.map(() => ({ ...sourceMacros }));
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
          <h2 className="text-2xl font-bold font-heading">Macronutrienti Giornalieri</h2>
          <p className="text-muted-foreground">Configura e traccia i tuoi macro giorno per giorno</p>
        </div>
      </div>

      {/* Card Riepilogo */}
      {weeklyAverage && (
        <Card className="shadow-premium hover:shadow-premium-hover transition-all duration-300 border-none">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-heading">Riepilogo Settimanale</CardTitle>
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
                    className={`h-2 flex-1 rounded-full ${checked ? 'bg-green-500' : 'bg-gray-200'
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

      {/* Card Integratori Settimanali */}
      <Card className="shadow-premium hover:shadow-premium-hover transition-all duration-300 border-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg font-heading">Integratori Settimanali</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Integratori comuni per tutti i giorni della settimana
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddSupplement}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              Aggiungi
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {localSupplements.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nessun integratore configurato. Clicca "Aggiungi" per iniziare.
            </p>
          ) : (
            <div className="space-y-2">
              {localSupplements.map((supp, suppIndex) => (
                <div key={suppIndex} className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={supp.name}
                    onChange={(e) => handleUpdateSupplement(suppIndex, 'name', e.target.value)}
                    placeholder="Nome integratore (es. Creatina)"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={supp.grams}
                    onChange={(e) => handleUpdateSupplement(suppIndex, 'grams', e.target.value)}
                    placeholder="grammi"
                    className="w-24"
                    min="0"
                    step="0.1"
                  />
                  <span className="text-sm text-muted-foreground">g</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSupplement(suppIndex)}
                    className="h-9 w-9 p-0"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card Macro Settimanali */}
      <Card className="shadow-premium hover:shadow-premium-hover transition-all duration-300 border-none">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg font-heading">Macro Settimanali</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Configura i macro e spunta i giorni completati. Le calorie vengono calcolate automaticamente.
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

              return (
                <Card
                  key={dayIndex}
                  className={`p-4 ${isChecked
                      ? 'border-emerald-200 bg-emerald-50'
                      : isToday
                        ? 'border-black border-2'
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
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        ) : (
                          <Circle className={`w-6 h-6 ${hasMacros ? 'text-gray-400 hover:text-sky-600 cursor-pointer' : 'text-gray-300'}`} />
                        )}
                      </button>

                      {/* Nome giorno */}
                      <h4 className="font-bold flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-sm font-medium bg-gray-100 text-gray-700">
                          {dayName}
                        </span>
                        {isToday && (
                          <span className="text-xs text-gray-700">(Oggi)</span>
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
