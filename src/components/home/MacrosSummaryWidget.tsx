import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Apple, ArrowRight } from 'lucide-react';

const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

export function MacrosSummaryWidget() {
  const { dailyMacros, getCurrentDayIndex, setCurrentTab } = useApp();

  const currentDayIndex = getCurrentDayIndex();
  const currentDay = dailyMacros?.days[currentDayIndex];
  const currentDayChecked = dailyMacros?.checked[currentDayIndex];

  const hasMacros = currentDay && (
    currentDay.kcal || currentDay.protein || currentDay.carbs || currentDay.fat
  );

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
                    {currentDay.kcal || '-'}
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
