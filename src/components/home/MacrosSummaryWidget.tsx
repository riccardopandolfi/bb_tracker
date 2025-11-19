import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

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

  const data = [
    { name: 'Proteine', value: p, color: '#3b82f6' }, // blue-500
    { name: 'Carbo', value: c, color: '#10b981' }, // emerald-500
    { name: 'Grassi', value: f, color: '#f59e0b' }, // amber-500
  ];

  return (
    <Card className="h-full border-none shadow-premium hover:shadow-premium-hover transition-all duration-300">
      <CardContent className="space-y-4 pt-6">
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
              <div className="text-2xl font-bold font-heading">Macro di Oggi</div>
              <p className="text-sm text-gray-500 mt-1">{DAY_NAMES[currentDayIndex]}</p>
            </div>

            <div className="flex items-center justify-end">
              <div className="text-2xl font-bold font-heading">
                {calculatedKcal > 0 ? calculatedKcal : '-'} <span className="text-sm font-normal text-gray-500">kcal</span>
              </div>
            </div>

            <div className="h-[180px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <span className="text-xs text-gray-400">Totale</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-blue-50 p-2 rounded-lg text-center">
                <span className="block text-xs text-blue-600 font-medium">Proteine</span>
                <span className="block text-lg font-bold text-blue-700">{p}g</span>
              </div>
              <div className="bg-emerald-50 p-2 rounded-lg text-center">
                <span className="block text-xs text-emerald-600 font-medium">Carbo</span>
                <span className="block text-lg font-bold text-emerald-700">{c}g</span>
              </div>
              <div className="bg-amber-50 p-2 rounded-lg text-center">
                <span className="block text-xs text-amber-600 font-medium">Grassi</span>
                <span className="block text-lg font-bold text-amber-700">{f}g</span>
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
                      <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">{supp.grams}g</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => setCurrentTab('macros')}
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-gray-500 hover:text-gray-900"
            >
              Gestisci Macros
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
