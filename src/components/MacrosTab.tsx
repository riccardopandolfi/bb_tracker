import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { DayMacros, Supplement } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { CheckCircle2, Circle, Copy, Plus, X, ChevronLeft, ChevronRight, Calendar, BarChart3, Settings2 } from 'lucide-react';
import { CarbCyclingEditor } from './macros/CarbCyclingEditor';
import { MacrosOverview } from './macros/MacrosOverview';

const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const DAY_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

// Calcola calorie automaticamente
const calculateKcal = (protein: string | number, carbs: string | number, fat: string | number): number => {
  const p = typeof protein === 'string' ? parseFloat(protein) || 0 : protein;
  const c = typeof carbs === 'string' ? parseFloat(carbs) || 0 : carbs;
  const f = typeof fat === 'string' ? parseFloat(fat) || 0 : fat;
  return Math.round(p * 4 + c * 4 + f * 9);
};

type MacrosTabView = 'today' | 'week' | 'overview' | 'carb-cycling';

export function MacrosTab() {
  const { 
    dailyMacros, 
    initializeDailyMacros, 
    updateDailyMacros, 
    checkDay, 
    getCurrentDayIndex, 
    updateSupplements,
    // Nuovo sistema multi-settimana
    getCurrentProgram,
    currentWeek,
    setCurrentWeek,
    getMacrosPlanForWeek,
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<MacrosTabView>('today');
  const [localMacros, setLocalMacros] = useState<DayMacros[]>([]);
  const [localSupplements, setLocalSupplements] = useState<Supplement[]>([]);

  const program = getCurrentProgram();
  const weekNumbers = program ? Object.keys(program.weeks).map(Number).sort((a, b) => a - b) : [];
  const maxWeek = weekNumbers.length > 0 ? Math.max(...weekNumbers) : 1;

  // Inizializza dailyMacros se non esiste (legacy)
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

  // Navigazione settimane
  const goToPrevWeek = () => {
    if (currentWeek > 1) setCurrentWeek(currentWeek - 1);
  };

  const goToNextWeek = () => {
    if (currentWeek < maxWeek) setCurrentWeek(currentWeek + 1);
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

  // Dati piano per la settimana corrente
  const weekPlan = getMacrosPlanForWeek(currentWeek);

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
    <div className="space-y-4">
      {/* Header con Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading">Nutrizione</h2>
          <p className="text-muted-foreground text-sm">Pianifica e traccia i tuoi macro</p>
        </div>

        {/* Week Selector (solo se c'è un programma) */}
        {program && weekNumbers.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={goToPrevWeek}
              disabled={currentWeek <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Badge variant="secondary" className="px-3 py-1">
              Week {currentWeek}
            </Badge>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={goToNextWeek}
              disabled={currentWeek >= maxWeek}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MacrosTabView)}>
        <TabsList className="grid grid-cols-4 h-9">
          <TabsTrigger value="today" className="text-xs gap-1">
            <Calendar className="w-3 h-3 hidden sm:inline" />
            Oggi
          </TabsTrigger>
          <TabsTrigger value="week" className="text-xs gap-1">
            <BarChart3 className="w-3 h-3 hidden sm:inline" />
            Settimana
          </TabsTrigger>
          <TabsTrigger value="overview" className="text-xs gap-1">
            Piano
          </TabsTrigger>
          <TabsTrigger value="carb-cycling" className="text-xs gap-1">
            <Settings2 className="w-3 h-3 hidden sm:inline" />
            Cycling
          </TabsTrigger>
        </TabsList>

        {/* TAB: Oggi */}
        <TabsContent value="today" className="mt-4 space-y-4">
          {/* Card del giorno corrente */}
          {(() => {
            const day = localMacros[currentDayIndex];
            const isChecked = dailyMacros.checked[currentDayIndex];
            const hasMacros = day && (day.protein || day.carbs || day.fat);
            const calculatedKcal = day ? calculateKcal(day.protein, day.carbs, day.fat) : 0;
            const planned = weekPlan?.days?.[currentDayIndex];

            return (
              <Card className="border-primary border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {DAY_NAMES[currentDayIndex]}
                      <Badge variant="secondary" className="text-xs">Oggi</Badge>
                    </CardTitle>
                    <button
                      onClick={() => handleCheckDay(currentDayIndex)}
                      disabled={!hasMacros}
                      className="focus:outline-none"
                    >
                      {isChecked ? (
                        <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                      ) : (
                        <Circle className={`w-7 h-7 ${hasMacros ? 'text-gray-400 hover:text-primary cursor-pointer' : 'text-gray-300'}`} />
                      )}
                    </button>
                  </div>
                  {planned && (
                    <CardDescription className="text-xs">
                      Obiettivo: {planned.kcal} kcal | P{planned.protein}g C{planned.carbs}g G{planned.fat}g
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs">Proteine (g)</Label>
                      <Input
                        type="number"
                        value={day?.protein || ''}
                        onChange={(e) => handleUpdateDay(currentDayIndex, 'protein', e.target.value)}
                        placeholder="es. 180"
                        min="0"
                        step="1"
                        className="h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Carboidrati (g)</Label>
                      <Input
                        type="number"
                        value={day?.carbs || ''}
                        onChange={(e) => handleUpdateDay(currentDayIndex, 'carbs', e.target.value)}
                        placeholder="es. 300"
                        min="0"
                        step="1"
                        className="h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Grassi (g)</Label>
                      <Input
                        type="number"
                        value={day?.fat || ''}
                        onChange={(e) => handleUpdateDay(currentDayIndex, 'fat', e.target.value)}
                        placeholder="es. 70"
                        min="0"
                        step="1"
                        className="h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Calorie</Label>
                      <div className="h-10 px-3 py-2 rounded-md border bg-muted flex items-center justify-center">
                        <span className="text-lg font-bold">
                          {calculatedKcal > 0 ? calculatedKcal : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Confronto con piano */}
                  {planned && calculatedKcal > 0 && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        {(['kcal', 'protein', 'carbs', 'fat'] as const).map((key) => {
                          const actual = key === 'kcal' ? calculatedKcal : parseFloat(day?.[key] || '0');
                          const target = planned[key];
                          const diff = target > 0 ? Math.round(((actual - target) / target) * 100) : 0;
                          const isGood = Math.abs(diff) <= 10;
                          return (
                            <div key={key} className="text-center">
                              <div className="text-muted-foreground capitalize">{key === 'kcal' ? 'Cal' : key.charAt(0).toUpperCase()}</div>
                              <div className={`font-medium ${isGood ? 'text-green-600' : Math.abs(diff) <= 20 ? 'text-amber-600' : 'text-red-600'}`}>
                                {diff > 0 ? '+' : ''}{diff}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Integratori */}
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Integratori</CardTitle>
                <Button variant="ghost" size="sm" onClick={handleAddSupplement} className="h-7">
                  <Plus className="w-3 h-3 mr-1" /> Aggiungi
                </Button>
              </div>
            </CardHeader>
            {localSupplements.length > 0 && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {localSupplements.map((supp, suppIndex) => (
                    <div key={suppIndex} className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={supp.name}
                        onChange={(e) => handleUpdateSupplement(suppIndex, 'name', e.target.value)}
                        placeholder="Nome"
                        className="flex-1 h-8 text-sm"
                      />
                      <Input
                        type="number"
                        value={supp.grams}
                        onChange={(e) => handleUpdateSupplement(suppIndex, 'grams', e.target.value)}
                        placeholder="g"
                        className="w-16 h-8 text-sm"
                      />
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveSupplement(suppIndex)} className="h-8 w-8 p-0">
                        <X className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* TAB: Settimana */}
        <TabsContent value="week" className="mt-4 space-y-4">
          {/* Riepilogo */}
          {weeklyAverage && (
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="py-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div>
                    <div className="text-xs text-muted-foreground">Completati</div>
                    <div className="text-xl font-bold">{completedDays}/7</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Media Kcal</div>
                    <div className="text-xl font-bold">{weeklyAverage.kcal}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Proteine</div>
                    <div className="text-xl font-bold">{weeklyAverage.protein}g</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Carbo</div>
                    <div className="text-xl font-bold">{weeklyAverage.carbs}g</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Grassi</div>
                    <div className="text-xl font-bold">{weeklyAverage.fat}g</div>
                  </div>
                </div>
                {/* Progress */}
                <div className="flex items-center gap-1 mt-3">
                  {dailyMacros.checked.map((checked, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 flex-1 rounded-full ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
                      title={DAY_NAMES[idx]}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Giorni della settimana */}
          <div className="space-y-2">
            {DAY_NAMES.map((_, dayIndex) => {
              const day = localMacros[dayIndex];
              const isChecked = dailyMacros.checked[dayIndex];
              const isToday = dayIndex === currentDayIndex;
              const hasMacros = day && (day.protein || day.carbs || day.fat);
              const calculatedKcal = day ? calculateKcal(day.protein, day.carbs, day.fat) : 0;
              const planned = weekPlan?.days?.[dayIndex];

              return (
                <Card
                  key={dayIndex}
                  className={`p-3 ${isChecked ? 'border-emerald-200 bg-emerald-50' : isToday ? 'border-primary border-2 bg-primary/5' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleCheckDay(dayIndex)}
                      disabled={!hasMacros}
                      className="focus:outline-none shrink-0"
                    >
                      {isChecked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className={`w-5 h-5 ${hasMacros ? 'text-gray-400 hover:text-primary' : 'text-gray-300'}`} />
                      )}
                    </button>

                    {/* Nome */}
                    <div className="w-12 shrink-0">
                      <span className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
                        {DAY_SHORT[dayIndex]}
                      </span>
                      {isToday && <span className="text-[10px] text-muted-foreground block">oggi</span>}
                    </div>

                    {/* Input */}
                    <div className="flex-1 grid grid-cols-4 gap-2">
                      <Input
                        type="number"
                        value={day?.protein || ''}
                        onChange={(e) => handleUpdateDay(dayIndex, 'protein', e.target.value)}
                        placeholder="P"
                        className="h-8 text-xs"
                      />
                      <Input
                        type="number"
                        value={day?.carbs || ''}
                        onChange={(e) => handleUpdateDay(dayIndex, 'carbs', e.target.value)}
                        placeholder="C"
                        className="h-8 text-xs"
                      />
                      <Input
                        type="number"
                        value={day?.fat || ''}
                        onChange={(e) => handleUpdateDay(dayIndex, 'fat', e.target.value)}
                        placeholder="G"
                        className="h-8 text-xs"
                      />
                      <div className="h-8 px-2 bg-muted rounded flex items-center justify-center text-xs font-medium">
                        {calculatedKcal || '-'}
                      </div>
                    </div>

                    {/* Target */}
                    {planned && (
                      <div className="hidden sm:block text-[10px] text-muted-foreground text-right w-20">
                        <div>Target: {planned.kcal}</div>
                      </div>
                    )}

                    {/* Copia */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToAll(dayIndex)}
                      disabled={!hasMacros}
                      className="h-8 w-8 p-0 shrink-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB: Piano Completo */}
        <TabsContent value="overview" className="mt-4">
          <MacrosOverview />
        </TabsContent>

        {/* TAB: Carb Cycling */}
        <TabsContent value="carb-cycling" className="mt-4">
          <CarbCyclingEditor onApply={() => setActiveTab('overview')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
