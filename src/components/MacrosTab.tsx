import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { PlannedDayMacros, Supplement, DayType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CheckCircle2, Circle, Copy, Plus, X, ChevronLeft, ChevronRight, Calendar, BarChart3, Dumbbell, Moon, Zap, Lock, Power, RefreshCw, Trash2 } from 'lucide-react';
import { CarbCyclingEditor } from './macros/CarbCyclingEditor';
import { MacrosOverview } from './macros/MacrosOverview';
import { OnOffEditor } from './macros/OnOffEditor';

const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const DAY_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const MONTH_NAMES = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

// Formatta una data come "6 - 12 Gen 2025"
const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = MONTH_NAMES[start.getMonth()];
  const endMonth = MONTH_NAMES[end.getMonth()];
  const year = start.getFullYear();
  
  if (startMonth === endMonth) {
    return `${startDay} - ${endDay} ${startMonth} ${year}`;
  } else {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
  }
};

// Ottiene il lunedì della settimana corrente
const getCurrentWeekMonday = (): string => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  return monday.toISOString().split('T')[0];
};

// Ottiene il lunedì della settimana successiva a una data
const getNextWeekMonday = (lastEndDate: string): string => {
  const end = new Date(lastEndDate);
  const nextMonday = new Date(end);
  nextMonday.setDate(end.getDate() + 1);
  return nextMonday.toISOString().split('T')[0];
};

// Calcola calorie automaticamente
const calculateKcal = (protein: number, carbs: number, fat: number): number => {
  return Math.round(protein * 4 + carbs * 4 + fat * 9);
};

type MacrosTabView = 'week' | 'onoff' | 'cycling' | 'overview';

export function MacrosTab() {
  const { 
    // Nuovo sistema macros basato su date
    getAllMacrosWeeks,
    getCurrentMacrosWeek,
    addMacrosWeek,
    deleteWeekPlan,
    updateWeekMacrosById,
    checkWeekDayById,
    getWeekPlanById,
    setDayTypeById,
    // Supplements
    supplements = [],
    updateGlobalSupplements,
    // Sistema On/Off
    macroMode = 'fixed',
    setMacroMode,
    onOffPlan,
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<MacrosTabView>('week');
  const [localSupplements, setLocalSupplements] = useState<Supplement[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);

  // Ottieni tutte le settimane ordinate per data
  const allWeeks = useMemo(() => getAllMacrosWeeks(), [getAllMacrosWeeks]);
  
  // Trova la settimana corrente automaticamente o usa quella selezionata
  const currentMacrosWeek = useMemo(() => {
    if (selectedWeekId) {
      return getWeekPlanById(selectedWeekId);
    }
    return getCurrentMacrosWeek();
  }, [selectedWeekId, getCurrentMacrosWeek, getWeekPlanById]);
  
  // Se non c'è settimana selezionata e ne esiste una corrente, selezionala
  useEffect(() => {
    if (!selectedWeekId && currentMacrosWeek?.id) {
      setSelectedWeekId(currentMacrosWeek.id);
    } else if (!selectedWeekId && allWeeks.length > 0) {
      // Seleziona l'ultima settimana se non c'è una corrente
      setSelectedWeekId(allWeeks[allWeeks.length - 1].id);
    }
  }, [selectedWeekId, currentMacrosWeek, allWeeks]);

  const weekPlan = selectedWeekId ? getWeekPlanById(selectedWeekId) : currentMacrosWeek;
  const days = weekPlan?.days || Array(7).fill(null).map(() => ({ protein: 0, carbs: 0, fat: 0, kcal: 0 }));
  const checked = weekPlan?.checked || Array(7).fill(false);

  // Sincronizza localSupplements
  useEffect(() => {
    setLocalSupplements(supplements || []);
  }, [supplements]);

  const currentDayIndex = (() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  })();

  // Aggiorna i macro di un giorno
  const handleUpdateDay = (dayIndex: number, field: keyof PlannedDayMacros, value: number) => {
    if (!weekPlan?.id) return;
    const currentDay = days[dayIndex] || { protein: 0, carbs: 0, fat: 0, kcal: 0 };
    const updated = { ...currentDay, [field]: value };
    updated.kcal = calculateKcal(updated.protein, updated.carbs, updated.fat);
    updateWeekMacrosById(weekPlan.id, dayIndex, updated);
  };

  // Copia i macro di un giorno a tutti gli altri
  const handleCopyToAll = (dayIndex: number) => {
    if (!weekPlan?.id) return;
    if (!confirm('Copiare i macro di questo giorno a tutti gli altri giorni?')) return;
    const sourceMacros = days[dayIndex];
    for (let i = 0; i < 7; i++) {
      if (i !== dayIndex) {
        updateWeekMacrosById(weekPlan.id, i, { ...sourceMacros });
      }
    }
  };

  // Segna giorno completato
  const handleCheckDay = (dayIndex: number) => {
    if (!weekPlan?.id) return;
    checkWeekDayById(weekPlan.id, dayIndex);
  };

  // Navigazione settimane
  const currentWeekIndex = allWeeks.findIndex(w => w.id === selectedWeekId);
  
  const goToPrevWeek = () => {
    if (currentWeekIndex > 0) {
      setSelectedWeekId(allWeeks[currentWeekIndex - 1].id);
    }
  };

  const goToNextWeek = () => {
    if (currentWeekIndex < allWeeks.length - 1) {
      setSelectedWeekId(allWeeks[currentWeekIndex + 1].id);
    }
  };
  
  // Aggiungi nuova settimana
  const handleAddWeek = () => {
    let startDate: string;
    if (allWeeks.length > 0) {
      // Usa la domenica dell'ultima settimana + 1 giorno
      const lastWeek = allWeeks[allWeeks.length - 1];
      startDate = getNextWeekMonday(lastWeek.endDate);
    } else {
      // Usa il lunedì della settimana corrente
      startDate = getCurrentWeekMonday();
    }
    const newWeek = addMacrosWeek(startDate);
    setSelectedWeekId(newWeek.id);
  };
  
  // Elimina settimana
  const handleDeleteWeek = () => {
    if (!weekPlan?.id) return;
    if (!confirm('Eliminare questa settimana? I dati andranno persi.')) return;
    
    deleteWeekPlan(weekPlan.id);
    
    // Seleziona la settimana precedente o successiva
    if (currentWeekIndex > 0) {
      setSelectedWeekId(allWeeks[currentWeekIndex - 1].id);
    } else if (allWeeks.length > 1) {
      setSelectedWeekId(allWeeks[1].id);
    } else {
      setSelectedWeekId(null);
    }
  };

  // Supplements
  const handleAddSupplement = () => {
    const newSupplement: Supplement = { name: '', grams: '' };
    const updated = [...localSupplements, newSupplement];
    setLocalSupplements(updated);
    updateGlobalSupplements(updated);
  };

  const handleRemoveSupplement = (suppIndex: number) => {
    const updated = [...localSupplements];
    updated.splice(suppIndex, 1);
    setLocalSupplements(updated);
    updateGlobalSupplements(updated);
  };

  const handleUpdateSupplement = (suppIndex: number, field: keyof Supplement, value: string) => {
    const updated = [...localSupplements];
    updated[suppIndex] = { ...updated[suppIndex], [field]: value };
    setLocalSupplements(updated);
    updateGlobalSupplements(updated);
  };

  // Calcola statistiche settimanali
  const calculateWeeklyStats = () => {
    let totalKcal = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let count = 0;

    days.forEach((day) => {
      if (day.protein > 0 || day.carbs > 0 || day.fat > 0) {
        totalKcal += day.kcal;
        totalProtein += day.protein;
        totalCarbs += day.carbs;
        totalFat += day.fat;
        count++;
      }
    });

    if (count === 0) return null;

    return {
      avgKcal: Math.round(totalKcal / count),
      avgProtein: Math.round(totalProtein / count),
      avgCarbs: Math.round(totalCarbs / count),
      avgFat: Math.round(totalFat / count),
      totalKcal,
    };
  };

  const stats = calculateWeeklyStats();
  const completedDays = checked.filter(c => c).length;

  return (
    <div className="space-y-4">
      {/* Header con Week Selector e Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading">Nutrizione</h2>
          <p className="text-muted-foreground text-sm">Pianifica e traccia i tuoi macro</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Toggle On/Off Mode */}
          <Button
            variant={macroMode === 'on_off' ? 'default' : 'outline'}
            size="sm"
            className={`h-8 text-xs gap-1.5 ${macroMode === 'on_off' ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
            onClick={() => setMacroMode(macroMode === 'on_off' ? 'fixed' : 'on_off')}
            title={macroMode === 'on_off' ? 'Disattiva modalità On/Off' : 'Attiva modalità On/Off'}
          >
            <Power className="w-3 h-3" />
            On/Off
          </Button>

          {/* Week Selector con Date */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={goToPrevWeek}
              disabled={currentWeekIndex <= 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {allWeeks.length > 0 ? (
              <Select value={selectedWeekId || ''} onValueChange={setSelectedWeekId}>
                <SelectTrigger className="h-8 w-auto min-w-[160px] text-xs">
                  <SelectValue placeholder="Seleziona settimana">
                    {weekPlan?.startDate && weekPlan?.endDate ? (
                      <span className="flex items-center gap-1">
                        {formatDateRange(weekPlan.startDate, weekPlan.endDate)}
                        {weekPlan.fromCycling && <span className="text-[10px]">🔄</span>}
                        {weekPlan.fromOnOff && <span className="text-[10px]">⚡</span>}
                      </span>
                    ) : 'Seleziona'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {allWeeks.map((week) => (
                    <SelectItem key={week.id} value={week.id}>
                      <span className="flex items-center gap-1">
                        {formatDateRange(week.startDate, week.endDate)}
                        {week.fromCycling && <span className="text-[10px]">🔄</span>}
                        {week.fromOnOff && <span className="text-[10px]">⚡</span>}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="secondary" className="px-3 py-1 text-xs">
                Nessuna settimana
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={goToNextWeek}
              disabled={currentWeekIndex >= allWeeks.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {/* Aggiungi settimana */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleAddWeek}
              title="Aggiungi nuova settimana"
            >
              <Plus className="h-4 w-4" />
            </Button>
            
            {/* Elimina settimana */}
            {weekPlan && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={handleDeleteWeek}
                title="Elimina settimana"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MacrosTabView)}>
        <TabsList className="grid grid-cols-4 h-9">
          <TabsTrigger value="week" className="text-xs gap-1">
            <Calendar className="w-3 h-3 hidden sm:inline" />
            Settimana
          </TabsTrigger>
          <TabsTrigger value="onoff" className="text-xs gap-1">
            <Zap className="w-3 h-3 hidden sm:inline" />
            On/Off
          </TabsTrigger>
          <TabsTrigger value="cycling" className="text-xs gap-1">
            <RefreshCw className="w-3 h-3 hidden sm:inline" />
            Cycling
          </TabsTrigger>
          <TabsTrigger value="overview" className="text-xs gap-1">
            <BarChart3 className="w-3 h-3 hidden sm:inline" />
            Piano
          </TabsTrigger>
        </TabsList>

        {/* TAB: Settimana */}
        <TabsContent value="week" className="mt-4 space-y-4" key={`week-${refreshKey}`}>
          {/* Riepilogo */}
          {stats && (
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="py-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div>
                    <div className="text-xs text-muted-foreground">Completati</div>
                    <div className="text-xl font-bold">{completedDays}/7</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Media Kcal</div>
                    <div className="text-xl font-bold">{stats.avgKcal}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Proteine</div>
                    <div className="text-xl font-bold">{stats.avgProtein}g</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Carbo</div>
                    <div className="text-xl font-bold">{stats.avgCarbs}g</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Grassi</div>
                    <div className="text-xl font-bold">{stats.avgFat}g</div>
                  </div>
                </div>
                {/* Progress */}
                <div className="flex items-center gap-1 mt-3">
                  {checked.map((isChecked, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 flex-1 rounded-full ${isChecked ? 'bg-green-500' : 'bg-gray-300'}`}
                      title={DAY_NAMES[idx]}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info modalità On/Off attiva */}
          {macroMode === 'on_off' && onOffPlan && (
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <CardContent className="py-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-amber-800">Modalità On/Off attiva</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-green-700">
                      <Dumbbell className="w-3 h-3" />
                      On: {onOffPlan.onDayMacros.kcal} kcal
                    </span>
                    <span className="flex items-center gap-1 text-blue-700">
                      <Moon className="w-3 h-3" />
                      Off: {onOffPlan.offDayMacros.kcal} kcal
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Giorni della settimana */}
          <div className="space-y-2">
            {days.map((day, dayIndex) => {
              const isChecked = checked[dayIndex];
              const isToday = dayIndex === currentDayIndex;
              const hasMacros = day.protein > 0 || day.carbs > 0 || day.fat > 0;
              const dayType = weekPlan?.dayTypes?.[dayIndex] as DayType;
              const isOnOffMode = macroMode === 'on_off' && onOffPlan;

              return (
                <Card
                  key={dayIndex}
                  className={`p-3 ${
                    isChecked ? 'border-emerald-200 bg-emerald-50' : 
                    dayType === 'on' ? 'border-green-300 bg-green-50/50' :
                    dayType === 'off' ? 'border-blue-300 bg-blue-50/50' :
                    isToday ? 'border-primary border-2 bg-primary/5' : ''
                  }`}
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

                    {/* Toggle On/Off (solo in modalità on_off) */}
                    {isOnOffMode && (
                      <div className="flex gap-1 shrink-0 items-center">
                        {isChecked ? (
                          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded" title="Giorno già completato - macro bloccati">
                            <Lock className="w-3 h-3 text-gray-400" />
                            <span className="text-[10px] text-gray-500">{dayType === 'on' ? 'ON' : dayType === 'off' ? 'OFF' : '-'}</span>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => weekPlan?.id && setDayTypeById(weekPlan.id, dayIndex, dayType === 'on' ? null : 'on')}
                              className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                                dayType === 'on' 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-600'
                              }`}
                              title="Giorno di allenamento"
                            >
                              <Dumbbell className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => weekPlan?.id && setDayTypeById(weekPlan.id, dayIndex, dayType === 'off' ? null : 'off')}
                              className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                                dayType === 'off' 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600'
                              }`}
                              title="Giorno di riposo"
                            >
                              <Moon className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Input (disabilitati in modalità on_off quando dayType è selezionato) */}
                    <div className="flex-1 grid grid-cols-4 gap-2">
                      <Input
                        type="number"
                        value={day.protein || ''}
                        onChange={(e) => handleUpdateDay(dayIndex, 'protein', parseInt(e.target.value) || 0)}
                        placeholder="P"
                        className="h-8 text-xs"
                        disabled={Boolean(isOnOffMode && dayType !== null)}
                      />
                      <Input
                        type="number"
                        value={day.carbs || ''}
                        onChange={(e) => handleUpdateDay(dayIndex, 'carbs', parseInt(e.target.value) || 0)}
                        placeholder="C"
                        className="h-8 text-xs"
                        disabled={Boolean(isOnOffMode && dayType !== null)}
                      />
                      <Input
                        type="number"
                        value={day.fat || ''}
                        onChange={(e) => handleUpdateDay(dayIndex, 'fat', parseInt(e.target.value) || 0)}
                        placeholder="G"
                        className="h-8 text-xs"
                        disabled={Boolean(isOnOffMode && dayType !== null)}
                      />
                      <div className={`h-8 px-2 rounded flex items-center justify-center text-xs font-medium ${
                        dayType === 'on' ? 'bg-green-100 text-green-700' :
                        dayType === 'off' ? 'bg-blue-100 text-blue-700' :
                        'bg-muted'
                      }`}>
                        {day.kcal || '-'}
                      </div>
                    </div>

                    {/* Copia (nascosto in modalità on_off) */}
                    {!isOnOffMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyToAll(dayIndex)}
                        disabled={!hasMacros}
                        className="h-8 w-8 p-0 shrink-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

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

        {/* TAB: On/Off */}
        <TabsContent value="onoff" className="mt-4">
          <OnOffEditor onApply={() => {
            // Imposta la modalità On/Off e vai alla vista settimanale
            setMacroMode('on_off');
            setRefreshKey(k => k + 1);
            setActiveTab('week');
          }} />
        </TabsContent>

        {/* TAB: Cycling */}
        <TabsContent value="cycling" className="mt-4">
          <CarbCyclingEditor onApply={() => {
            // Forza re-render incrementando la key e cambiando tab
            setMacroMode('cycling');
            setRefreshKey(k => k + 1);
            setActiveTab('week');
          }} />
        </TabsContent>

        {/* TAB: Piano */}
        <TabsContent value="overview" className="mt-4" key={`overview-${refreshKey}`}>
          <MacrosOverview onNavigateToWeek={(weekId) => {
            setSelectedWeekId(weekId);
            setActiveTab('week');
          }} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

