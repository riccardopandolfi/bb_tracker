import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle2, Calendar, Settings } from 'lucide-react';

const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

interface DailyMacrosCardProps {
  onOpenSettings: () => void;
}

export function DailyMacrosCard({ onOpenSettings }: DailyMacrosCardProps) {
  const { dailyMacros, checkDay, getCurrentDayIndex, getLastCheckedDayIndex } = useApp();

  const currentDayIndex = getCurrentDayIndex();
  const lastCheckedDayIndex = getLastCheckedDayIndex();

  // Se non ci sono macro giornalieri configurati
  if (!dailyMacros) {
    return (
      <Card className="h-full shadow-premium hover:shadow-premium-hover transition-all duration-300 border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-heading">
            <Calendar className="w-5 h-5" />
            Macro Giornalieri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <p className="text-sm text-muted-foreground">
              Configura i macro per ogni giorno della settimana
            </p>
            <Button onClick={onOpenSettings} className="w-full sm:w-auto">
              <Settings className="w-4 h-4 mr-2" />
              Configura Macro Settimanali
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentDay = dailyMacros.days[currentDayIndex];
  const currentDayChecked = dailyMacros.checked[currentDayIndex];
  const lastCheckedDay = lastCheckedDayIndex !== null ? dailyMacros.days[lastCheckedDayIndex] : null;

  const hasCurrentDayMacros = currentDay && (
    currentDay.kcal || currentDay.protein || currentDay.carbs || currentDay.fat
  );

  const handleCheckDay = () => {
    checkDay(currentDayIndex);
  };

  return (
    <Card className="h-full shadow-premium hover:shadow-premium-hover transition-all duration-300 border-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-heading">
            <Calendar className="w-5 h-5" />
            Macro Giornalieri
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            title="Configura macro"
          >
            <Settings className="w-4 h-4 text-gray-500" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ultimo giorno spuntato */}
        {lastCheckedDay && lastCheckedDayIndex !== null && (
          <div className="p-3 rounded-lg border border-green-200 bg-green-50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-green-900 uppercase tracking-wide">
                Ultimo completato: {DAY_NAMES[lastCheckedDayIndex]}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Kcal:</span>
                <span className="ml-1 font-semibold text-gray-900">
                  {lastCheckedDay.kcal || '-'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Proteine:</span>
                <span className="ml-1 font-semibold text-gray-900">
                  {lastCheckedDay.protein || '-'}g
                </span>
              </div>
              <div>
                <span className="text-gray-600">Carbo:</span>
                <span className="ml-1 font-semibold text-gray-900">
                  {lastCheckedDay.carbs || '-'}g
                </span>
              </div>
              <div>
                <span className="text-gray-600">Grassi:</span>
                <span className="ml-1 font-semibold text-gray-900">
                  {lastCheckedDay.fat || '-'}g
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Giorno corrente */}
        <div className={`p-3 rounded-lg border ${currentDayChecked
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-sky-200 bg-sky-50'
          }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold uppercase tracking-wide ${currentDayChecked ? 'text-emerald-900' : 'text-sky-900'
              }`}>
              Oggi: {DAY_NAMES[currentDayIndex]}
            </span>
            {currentDayChecked && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
          </div>

          {hasCurrentDayMacros ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm mb-3">
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

              {!currentDayChecked && (
                <Button
                  onClick={handleCheckDay}
                  className="w-full"
                  size="sm"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Segna come Completato
                </Button>
              )}
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-gray-600 mb-2">
                Nessun macro configurato per oggi
              </p>
              <Button
                onClick={onOpenSettings}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Configura
              </Button>
            </div>
          )}
        </div>

        {/* Progress indicator */}
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
      </CardContent>
    </Card>
  );
}
