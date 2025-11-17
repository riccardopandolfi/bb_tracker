import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Apple, ArrowRight } from 'lucide-react';

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
  const currentDayChecked = dailyMacros?.checked[currentDayIndex];

  const hasMacros = currentDay && (
    currentDay.protein || currentDay.carbs || currentDay.fat
  );

  const calculatedKcal = currentDay ? calculateKcal(currentDay.protein, currentDay.carbs, currentDay.fat) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Apple className="w-5 h-5" />
          Macro di Oggi
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!dailyMacros || !hasMacros ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Nessun macro configurato
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
          <div className="space-y-3">
            <div className={`p-3 rounded-lg border ${
              currentDayChecked
                ? 'border-green-200 bg-green-50'
                : 'border-blue-200 bg-blue-50'
            }`}>
              <div className="text-xs font-semibold mb-2 uppercase tracking-wide text-gray-700">
                {DAY_NAMES[currentDayIndex]}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Kcal:</span>
                  <span className="ml-1 font-semibold text-gray-900">
                    {calculatedKcal > 0 ? calculatedKcal : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Proteine:</span>
                  <span className="ml-1 font-semibold text-gray-900">
                    {currentDay.protein || '-'}g
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Carbo:</span>
                  <span className="ml-1 font-semibold text-gray-900">
                    {currentDay.carbs || '-'}g
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Grassi:</span>
                  <span className="ml-1 font-semibold text-gray-900">
                    {currentDay.fat || '-'}g
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setCurrentTab('macros')}
              variant="outline"
              size="sm"
              className="w-full"
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
