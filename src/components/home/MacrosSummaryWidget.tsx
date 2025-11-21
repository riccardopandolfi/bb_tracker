import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

// Calcola calorie automaticamente
const calculateKcal = (protein: string, carbs: string, fat: string): number => {
  const p = parseFloat(protein) || 0;
  const c = parseFloat(carbs) || 0;
  const f = parseFloat(fat) || 0;
  return Math.round(p * 4 + c * 4 + f * 9);
};

export function MacrosSummaryWidget() {
  const { dailyMacros, getCurrentDayIndex, setCurrentTab } = useApp();

  const currentDayIndex = getCurrentDayIndex();
  const currentDay = dailyMacros?.days[currentDayIndex];

  const hasMacros = currentDay && (
    currentDay.protein || currentDay.carbs || currentDay.fat
  );

  const calculatedKcal = currentDay ? calculateKcal(currentDay.protein, currentDay.carbs, currentDay.fat) : 0;

  const p = parseFloat(currentDay?.protein || '0');
  const c = parseFloat(currentDay?.carbs || '0');
  const f = parseFloat(currentDay?.fat || '0');

  return (
    <Card className="h-full card-monetra">
      <CardContent className="space-y-5 pt-6">
        {!dailyMacros || !hasMacros ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-2xl">🍎</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Nessun macro configurato per oggi
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
              <div className="text-base sm:text-lg font-bold font-heading">Macro di Oggi</div>
              <p className="text-sm text-gray-500 mt-1">{DAY_NAMES[currentDayIndex]}</p>
            </div>

            {/* Calorie */}
            <div className="flex items-center justify-end">
              <div className="text-sm font-bold font-heading text-gray-900">
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

            {/* Integratori */}
            {dailyMacros.supplements && dailyMacros.supplements.length > 0 && (
              <div className="border-t border-gray-100 pt-4">
                <div className="text-xs font-semibold mb-2 text-gray-400">Integratori</div>
                <div className="space-y-2">
                  {dailyMacros.supplements.map((supp, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{supp.name || 'Integratore'}</span>
                      <span className="font-semibold text-gray-900">{supp.grams}g</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Macros Bar Chart */}
            <div className="border-t border-gray-100 pt-4">
              <div className="text-xs font-semibold mb-3 text-gray-400">Macros Settimanali</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={dailyMacros.days.map((day, idx) => ({
                  day: DAY_NAMES[idx].slice(0, 3),
                  proteine: parseFloat(day.protein || '0'),
                  carbo: parseFloat(day.carbs || '0'),
                  grassi: parseFloat(day.fat || '0'),
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
