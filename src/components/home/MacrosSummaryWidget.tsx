import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowRight, Dumbbell, Moon, Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';
import { DayType } from '@/types';

const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

export function MacrosSummaryWidget() {
  const { 
    getCurrentMacrosWeek, 
    setDayTypeById,
    supplements, 
    setCurrentTab,
    macroMode = 'fixed',
    onOffPlan,
    addWeight,
    getWeightHistory,
    getTodayWeight,
  } = useApp();

  const [weightInput, setWeightInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Ottieni il giorno corrente (0 = Lunedì, 6 = Domenica)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const currentDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  // Usa getCurrentMacrosWeek per trovare automaticamente la settimana corrente basata sulla data
  const weekPlan = getCurrentMacrosWeek();
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

  // Weight data
  const todayWeight = getTodayWeight();
  const weightHistory = getWeightHistory(30); // Ultimi 30 giorni
  
  // Inizializza l'input con il peso di oggi se esiste
  useEffect(() => {
    if (todayWeight !== null) {
      setWeightInput(todayWeight.toString());
    }
  }, [todayWeight]);

  // Calcola trend (differenza tra ultimo e primo peso nel periodo)
  const calculateTrend = () => {
    if (weightHistory.length < 2) return null;
    const sorted = [...weightHistory].sort((a, b) => a.date.localeCompare(b.date));
    const oldest = sorted[0].weight;
    const newest = sorted[sorted.length - 1].weight;
    return newest - oldest;
  };

  const trend = calculateTrend();

  // Prepara i dati per il grafico (ultimi 14 giorni, ordinati per data)
  const chartData = [...weightHistory]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map(entry => ({
      date: new Date(entry.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
      peso: entry.weight,
    }));

  // Calcola min/max per il grafico
  const weights = chartData.map(d => d.peso);
  const minWeight = weights.length > 0 ? Math.floor(Math.min(...weights) - 1) : 70;
  const maxWeight = weights.length > 0 ? Math.ceil(Math.max(...weights) + 1) : 80;
  const avgWeight = weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0;

  const handleSaveWeight = () => {
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) return;
    
    setIsSaving(true);
    addWeight(weight);
    
    setTimeout(() => {
      setIsSaving(false);
    }, 500);
  };

  return (
    <Card className="h-full card-monetra">
      <CardContent className="space-y-5 pt-6">
        {/* Sezione Macro (condizionale) */}
        {hasMacros ? (
          <div className="space-y-4">
            {/* Title with separator */}
            <div className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base sm:text-lg font-bold font-heading">Macro di Oggi</div>
                  <p className="text-sm text-gray-500 mt-1">{DAY_NAMES[currentDayIndex]}</p>
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
                      onClick={() => weekPlan?.id && setDayTypeById(weekPlan.id, currentDayIndex, 'on')}
                      className="flex-1 px-3 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors flex items-center justify-center gap-1.5 text-sm font-medium"
                      disabled={!weekPlan?.id}
                    >
                      <Dumbbell className="w-4 h-4" />
                      On (Allenamento)
                    </button>
                    <button
                      onClick={() => weekPlan?.id && setDayTypeById(weekPlan.id, currentDayIndex, 'off')}
                      className="flex-1 px-3 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors flex items-center justify-center gap-1.5 text-sm font-medium"
                      disabled={!weekPlan?.id}
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
          </div>
        ) : (
          /* Messaggio se non ci sono macro */
          <div className="text-center py-4 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-xl">🍎</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Nessun macro configurato per oggi
            </p>
            <Button
              onClick={() => setCurrentTab('macros')}
              variant="outline"
              size="sm"
            >
              Configura Macros
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Peso Corporeo Section - SEMPRE VISIBILE */}
        <div className={hasMacros ? "border-t border-gray-100 pt-4" : "pt-2"}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-muted-foreground font-heading">Peso Corporeo</div>
            {trend !== null && (
              <div className={`flex items-center gap-1 text-xs font-medium ${
                trend < 0 ? 'text-green-600' : trend > 0 ? 'text-red-500' : 'text-gray-500'
              }`}>
                {trend < 0 ? <TrendingDown className="w-3 h-3" /> : 
                 trend > 0 ? <TrendingUp className="w-3 h-3" /> : 
                 <Minus className="w-3 h-3" />}
                <span>{trend > 0 ? '+' : ''}{trend.toFixed(1)} kg</span>
              </div>
            )}
          </div>
          
          {/* Input peso */}
          <div className="flex gap-2 mb-3">
            <Input
              type="number"
              step="0.1"
              placeholder="es. 75.5"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="flex-1 h-9 text-sm"
            />
            <Button
              size="sm"
              onClick={handleSaveWeight}
              disabled={!weightInput || isSaving}
              className="h-9 px-4"
            >
              {isSaving ? '...' : todayWeight ? 'Aggiorna' : 'Salva'}
            </Button>
          </div>
          
          {/* Mini grafico peso - esteso ai bordi */}
          {chartData.length > 1 ? (
            <div className="-mx-6 -mb-6">
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 9 }} 
                    stroke="#9ca3af"
                    interval="preserveStartEnd"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    domain={[minWeight, maxWeight]} 
                    tick={{ fontSize: 9 }} 
                    stroke="#9ca3af"
                    width={35}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Peso']}
                  />
                  <ReferenceLine y={avgWeight} stroke="#e5e7eb" strokeDasharray="3 3" />
                  <Line 
                    type="monotone" 
                    dataKey="peso" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    dot={{ fill: '#6366f1', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: '#6366f1' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : chartData.length === 1 ? (
            <div className="text-center py-4">
              <span className="block text-base font-bold text-foreground font-heading">{chartData[0].peso} kg</span>
              <p className="text-xs mt-1 text-gray-500">Aggiungi altri dati per vedere il grafico</p>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-gray-400">
              Inserisci il tuo peso per iniziare il tracking
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
