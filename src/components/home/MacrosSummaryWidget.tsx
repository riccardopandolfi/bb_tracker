import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowRight, Dumbbell, Moon, Zap } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DayType } from '@/types';

const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

export function MacrosSummaryWidget() {
  const { 
    getMacrosPlanForWeek, 
    currentWeek, 
    supplements, 
    setCurrentTab,
    macroMode = 'fixed',
    onOffPlan,
    setDayType,
  } = useApp();

  // Ottieni il giorno corrente (0 = Lunedì, 6 = Domenica)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const currentDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  // Usa il nuovo sistema macrosPlans invece di dailyMacros legacy
  const weekPlan = getMacrosPlanForWeek(currentWeek);
  const currentDay = weekPlan?.days?.[currentDayIndex];
  const currentDayType = weekPlan?.dayTypes?.[currentDayIndex] as DayType;
  
  // Modalità On/Off attiva
  const isOnOffMode = macroMode === 'on_off' && onOffPlan;

  const hasMacros = currentDay && (
    currentDay.protein > 0 || currentDay.carbs > 0 || currentDay.fat > 0
  );

  const p = currentDay?.protein || 0;
  const c = currentDay?.carbs || 0;
  const f = currentDay?.fat || 0;
  const calculatedKcal = currentDay?.kcal || 0;

  return (
    <Card className="h-full card-monetra">
      <CardContent className="space-y-5 pt-6">
        {!hasMacros ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-2xl">🍎</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Nessun macro configurato per oggi (Week {currentWeek})
            </p>
            <Button
              onClick={() => setCurrentTab('macros')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Vai a Macros
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Title with separator */}
            <div className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base sm:text-lg font-bold font-heading">Macro di Oggi</div>
                  <p className="text-sm text-gray-500 mt-1">{DAY_NAMES[currentDayIndex]} - Week {currentWeek}</p>
                </div>
                {/* Indicatore tipo giorno in modalità On/Off */}
                {isOnOffMode && currentDayType && (
                  <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-medium ${
                    currentDayType === 'on' 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {currentDayType === 'on' ? (
                      <>
                        <Dumbbell className="w-3 h-3" />
                        <span>Giorno On</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-3 h-3" />
                        <span>Giorno Off</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* Quick toggle On/Off se la modalità è attiva ma il giorno non è ancora segnato */}
              {isOnOffMode && !currentDayType && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-700 mb-2">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-medium">Seleziona il tipo di giorno:</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDayType(currentWeek, currentDayIndex, 'on')}
                      className="flex-1 px-3 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors flex items-center justify-center gap-1.5 text-sm font-medium"
                    >
                      <Dumbbell className="w-4 h-4" />
                      On (Allenamento)
                    </button>
                    <button
                      onClick={() => setDayType(currentWeek, currentDayIndex, 'off')}
                      className="flex-1 px-3 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center justify-center gap-1.5 text-sm font-medium"
                    >
                      <Moon className="w-4 h-4" />
                      Off (Riposo)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Calorie */}
            <div className="flex items-center justify-end">
              <div className={`text-sm font-bold font-heading ${
                currentDayType === 'on' ? 'text-green-700' :
                currentDayType === 'off' ? 'text-blue-700' : 'text-gray-900'
              }`}>
                {calculatedKcal > 0 ? calculatedKcal : '-'} <span className="text-xs font-normal text-gray-500">kcal</span>
              </div>
            </div>

            {/* Nutrienti Section */}
            <div>
              <div className="text-xs font-semibold mb-3 text-muted-foreground font-heading">Nutrienti</div>
              <div className="grid grid-cols-3 gap-3">
                {/* Proteine Box - Lime Green (Monetra accent) */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/30 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-default">
                  <div className="text-center">
                    <span className="block text-sm text-black mb-1.5 font-medium">Proteine</span>
                    <span className="block text-base font-bold text-foreground font-heading">{p}g</span>
                  </div>
                </div>
                {/* Carbo Box - Emerald */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-default">
                  <div className="text-center">
                    <span className="block text-sm text-black mb-1.5 font-medium">Carbo</span>
                    <span className="block text-base font-bold text-foreground font-heading">{c}g</span>
                  </div>
                </div>
                {/* Grassi Box - Amber */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 border border-amber-500/30 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-default">
                  <div className="text-center">
                    <span className="block text-sm text-black mb-1.5 font-medium">Grassi</span>
                    <span className="block text-base font-bold text-foreground font-heading">{f}g</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Integratori (usa supplements globali) */}
            {supplements && supplements.length > 0 && supplements.some(s => s.name) && (
              <div className="border-t border-gray-100 pt-4">
                <div className="text-xs font-semibold mb-2 text-gray-400">Integratori</div>
                <div className="space-y-2">
                  {supplements.filter(s => s.name).map((supp, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{supp.name}</span>
                      <span className="font-semibold text-gray-900">{supp.grams}g</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Macros Bar Chart */}
            {weekPlan?.days && (
              <div className="border-t border-gray-100 pt-4">
                <div className="text-xs font-semibold mb-3 text-gray-400">Macros Week {currentWeek}</div>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={weekPlan.days.map((day, idx) => ({
                    day: DAY_NAMES[idx].slice(0, 3),
                    proteine: day.protein || 0,
                    carbo: day.carbs || 0,
                    grassi: day.fat || 0,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#6b7280" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="proteine" fill="rgb(196, 255, 57)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="carbo" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="grassi" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
