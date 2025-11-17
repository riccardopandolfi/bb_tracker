import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { DayMacros } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Calendar, Settings, CheckCircle2, Circle } from 'lucide-react';

const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

export function MacrosTab() {
  const { dailyMacros, initializeDailyMacros, updateDailyMacros, checkDay, getCurrentDayIndex } = useApp();
  const [tempMacros, setTempMacros] = useState<DayMacros[]>([]);
  const [editMode, setEditMode] = useState(false);

  // Inizializza tempMacros quando si apre la tab o quando cambiano i dailyMacros
  useEffect(() => {
    if (dailyMacros) {
      setTempMacros([...dailyMacros.days]);
    } else {
      const emptyDays: DayMacros[] = Array(7).fill(null).map(() => ({
        kcal: '',
        protein: '',
        carbs: '',
        fat: '',
      }));
      setTempMacros(emptyDays);
    }
  }, [dailyMacros]);

  const currentDayIndex = getCurrentDayIndex();

  const handleUpdateDay = (dayIndex: number, field: keyof DayMacros, value: string) => {
    const updated = [...tempMacros];
    updated[dayIndex] = {
      ...updated[dayIndex],
      [field]: value,
    };
    setTempMacros(updated);
  };

  const handleCopyToAll = (dayIndex: number) => {
    const sourceMacros = tempMacros[dayIndex];
    const updated = tempMacros.map(() => ({ ...sourceMacros }));
    setTempMacros(updated);
  };

  const handleSave = () => {
    // Se dailyMacros non esiste, inizializzalo prima
    if (!dailyMacros) {
      initializeDailyMacros();
      setTimeout(() => {
        tempMacros.forEach((macros, idx) => {
          updateDailyMacros(idx, macros);
        });
      }, 100);
    } else {
      tempMacros.forEach((macros, idx) => {
        updateDailyMacros(idx, macros);
      });
    }
    setEditMode(false);
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
      if (day.kcal || day.protein || day.carbs || day.fat) {
        totalKcal += parseFloat(day.kcal) || 0;
        totalProtein += parseFloat(day.protein) || 0;
        totalCarbs += parseFloat(day.carbs) || 0;
        totalFat += parseFloat(day.fat) || 0;
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
          </CardContent>
        </Card>
      )}

      {/* Card Configurazione Settimanale */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Settings className="w-5 h-5" />
                Configurazione Settimanale
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Imposta i macro per ogni giorno della settimana
              </CardDescription>
            </div>
            {!editMode ? (
              <Button onClick={() => setEditMode(true)} variant="outline">
                Modifica
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={() => { setEditMode(false); setTempMacros([...dailyMacros!.days]); }} variant="outline">
                  Annulla
                </Button>
                <Button onClick={handleSave}>
                  Salva
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DAY_NAMES.map((dayName, dayIndex) => (
              <Card key={dayIndex} className={`p-4 ${dayIndex === currentDayIndex && !editMode ? 'border-blue-500 border-2' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-sm font-medium ${
                      dayIndex === currentDayIndex
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {dayName}
                    </span>
                    {dayIndex === currentDayIndex && !editMode && (
                      <span className="text-xs text-blue-600">(Oggi)</span>
                    )}
                  </h4>
                  {editMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToAll(dayIndex)}
                      className="text-xs"
                    >
                      Copia a tutti
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Kcal</Label>
                    <Input
                      type="text"
                      value={tempMacros[dayIndex]?.kcal || ''}
                      onChange={(e) => handleUpdateDay(dayIndex, 'kcal', e.target.value)}
                      placeholder="es. 2500"
                      disabled={!editMode}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Proteine (g)</Label>
                    <Input
                      type="text"
                      value={tempMacros[dayIndex]?.protein || ''}
                      onChange={(e) => handleUpdateDay(dayIndex, 'protein', e.target.value)}
                      placeholder="es. 180"
                      disabled={!editMode}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Carboidrati (g)</Label>
                    <Input
                      type="text"
                      value={tempMacros[dayIndex]?.carbs || ''}
                      onChange={(e) => handleUpdateDay(dayIndex, 'carbs', e.target.value)}
                      placeholder="es. 300"
                      disabled={!editMode}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Grassi (g)</Label>
                    <Input
                      type="text"
                      value={tempMacros[dayIndex]?.fat || ''}
                      onChange={(e) => handleUpdateDay(dayIndex, 'fat', e.target.value)}
                      placeholder="es. 70"
                      disabled={!editMode}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Card Tracker Giornaliero */}
      {dailyMacros && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="w-5 h-5" />
              Tracker Giornaliero
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Spunta i giorni quando completi i tuoi macro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {DAY_NAMES.map((dayName, dayIndex) => {
                const day = dailyMacros.days[dayIndex];
                const isChecked = dailyMacros.checked[dayIndex];
                const isToday = dayIndex === currentDayIndex;
                const hasMacros = day && (day.kcal || day.protein || day.carbs || day.fat);

                return (
                  <div
                    key={dayIndex}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isChecked
                        ? 'border-green-200 bg-green-50'
                        : isToday
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => handleCheckDay(dayIndex)}
                        className="focus:outline-none"
                        disabled={!hasMacros}
                      >
                        {isChecked ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : (
                          <Circle className={`w-6 h-6 ${hasMacros ? 'text-gray-400 hover:text-blue-600' : 'text-gray-300'}`} />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {dayName}
                          {isToday && <span className="ml-2 text-xs text-blue-600">(Oggi)</span>}
                        </div>
                        {hasMacros ? (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {day.kcal || '-'} kcal • {day.protein || '-'}g P • {day.carbs || '-'}g C • {day.fat || '-'}g F
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Nessun macro configurato
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
    </div>
  );
}
