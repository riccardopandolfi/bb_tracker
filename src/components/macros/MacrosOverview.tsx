import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, TrendingUp, TrendingDown } from 'lucide-react';

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

type ViewMode = 'both' | 'planned' | 'tracked';

export function MacrosOverview() {
  const { 
    getCurrentProgram, 
    getMacrosPlanForWeek, 
    getTrackedMacros,
    currentWeek 
  } = useApp();

  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const program = getCurrentProgram();
  const weekNumbers = program ? Object.keys(program.weeks).map(Number).sort((a, b) => a - b) : [];

  // Calcola totali settimanali
  const getWeeklyTotals = (weekNum: number) => {
    const plan = getMacrosPlanForWeek(weekNum);
    let plannedTotal = { protein: 0, carbs: 0, fat: 0, kcal: 0 };
    let trackedTotal = { protein: 0, carbs: 0, fat: 0, kcal: 0 };
    let trackedDays = 0;

    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      if (plan?.days?.[dayIdx]) {
        plannedTotal.protein += plan.days[dayIdx].protein;
        plannedTotal.carbs += plan.days[dayIdx].carbs;
        plannedTotal.fat += plan.days[dayIdx].fat;
        plannedTotal.kcal += plan.days[dayIdx].kcal;
      }

      const tracked = getTrackedMacros(weekNum, dayIdx);
      if (tracked) {
        trackedTotal.protein += tracked.protein;
        trackedTotal.carbs += tracked.carbs;
        trackedTotal.fat += tracked.fat;
        trackedTotal.kcal += tracked.kcal;
        if (tracked.checked) trackedDays++;
      }
    }

    return { plannedTotal, trackedTotal, trackedDays };
  };

  // Calcola differenza percentuale
  const getDiff = (planned: number, tracked: number) => {
    if (planned === 0) return 0;
    return Math.round(((tracked - planned) / planned) * 100);
  };

  // Colore in base alla differenza
  const getDiffColor = (diff: number) => {
    if (Math.abs(diff) <= 5) return 'text-green-600';
    if (Math.abs(diff) <= 15) return 'text-amber-600';
    return 'text-red-600';
  };

  // Rendering cella
  const renderCell = (weekNum: number, dayIdx: number) => {
    const plan = getMacrosPlanForWeek(weekNum);
    const planned = plan?.days?.[dayIdx];
    const tracked = getTrackedMacros(weekNum, dayIdx);

    const showPlanned = viewMode === 'both' || viewMode === 'planned';
    const showTracked = viewMode === 'both' || viewMode === 'tracked';

    if (!planned && !tracked) {
      return (
        <div className="text-[10px] text-muted-foreground text-center py-2">
          -
        </div>
      );
    }

    return (
      <div className="text-[10px] space-y-0.5 py-1">
        {/* Pianificato */}
        {showPlanned && planned && (
          <div className="text-muted-foreground">
            <div className="font-medium">{planned.kcal}</div>
            <div className="opacity-70">P{planned.protein} C{planned.carbs} G{planned.fat}</div>
          </div>
        )}
        
        {/* Tracciato */}
        {showTracked && tracked && (
          <div className={tracked.checked ? 'text-green-600' : 'text-foreground'}>
            <div className="font-medium flex items-center justify-center gap-0.5">
              {tracked.kcal}
              {tracked.checked && <Check className="w-2.5 h-2.5" />}
            </div>
            <div className="opacity-70">P{tracked.protein} C{tracked.carbs} G{tracked.fat}</div>
          </div>
        )}

        {/* Differenza */}
        {viewMode === 'both' && planned && tracked && (
          <div className={`text-[9px] ${getDiffColor(getDiff(planned.kcal, tracked.kcal))}`}>
            {getDiff(planned.kcal, tracked.kcal) > 0 ? '+' : ''}{getDiff(planned.kcal, tracked.kcal)}%
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controlli */}
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList className="h-8">
            <TabsTrigger value="both" className="text-xs">Confronto</TabsTrigger>
            <TabsTrigger value="planned" className="text-xs">Solo Piano</TabsTrigger>
            <TabsTrigger value="tracked" className="text-xs">Solo Tracciato</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tabella principale */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Riepilogo Settimanale</CardTitle>
          <CardDescription className="text-xs">
            {viewMode === 'both' && 'Piano (grigio) vs Tracciato (colorato)'}
            {viewMode === 'planned' && 'Macro pianificati per ogni giorno'}
            {viewMode === 'tracked' && 'Macro effettivamente consumati'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-2 px-3 font-medium sticky left-0 bg-muted/50">Giorno</th>
                  {weekNumbers.map(weekNum => (
                    <th 
                      key={weekNum} 
                      className={`text-center py-2 px-2 font-medium cursor-pointer hover:bg-muted transition-colors ${
                        weekNum === currentWeek ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => setSelectedWeek(selectedWeek === weekNum ? null : weekNum)}
                    >
                      W{weekNum}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAY_NAMES.map((day, dayIdx) => (
                  <tr key={dayIdx} className="border-b hover:bg-muted/30">
                    <td className="py-1 px-3 font-medium sticky left-0 bg-background">{day}</td>
                    {weekNumbers.map(weekNum => (
                      <td 
                        key={weekNum} 
                        className={`text-center ${weekNum === currentWeek ? 'bg-primary/5' : ''}`}
                      >
                        {renderCell(weekNum, dayIdx)}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Totali */}
                <tr className="bg-muted/50 font-medium">
                  <td className="py-2 px-3 sticky left-0 bg-muted/50">Totale</td>
                  {weekNumbers.map(weekNum => {
                    const { plannedTotal, trackedTotal, trackedDays } = getWeeklyTotals(weekNum);
                    const showPlanned = viewMode === 'both' || viewMode === 'planned';
                    const showTracked = viewMode === 'both' || viewMode === 'tracked';
                    
                    return (
                      <td key={weekNum} className={`text-center py-2 ${weekNum === currentWeek ? 'bg-primary/10' : ''}`}>
                        <div className="text-[10px] space-y-0.5">
                          {showPlanned && (
                            <div className="text-muted-foreground">
                              {plannedTotal.kcal.toLocaleString()}
                            </div>
                          )}
                          {showTracked && trackedDays > 0 && (
                            <div className="text-foreground">
                              {trackedTotal.kcal.toLocaleString()}
                              <span className="text-[9px] text-muted-foreground ml-1">
                                ({trackedDays}/7)
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dettaglio settimana selezionata */}
      {selectedWeek && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              Dettaglio Week {selectedWeek}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => setSelectedWeek(null)}
              >
                <X className="w-3 h-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {DAY_NAMES.map((day, dayIdx) => {
                const plan = getMacrosPlanForWeek(selectedWeek);
                const planned = plan?.days?.[dayIdx];
                const tracked = getTrackedMacros(selectedWeek, dayIdx);

                return (
                  <div 
                    key={dayIdx} 
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                  >
                    <span className="font-medium text-sm w-12">{day}</span>
                    
                    {/* Pianificato */}
                    <div className="flex-1 text-center">
                      {planned ? (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">{planned.kcal}</span> kcal
                          <span className="hidden sm:inline ml-2">
                            P{planned.protein} C{planned.carbs} G{planned.fat}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>

                    {/* Freccia */}
                    <div className="px-2">
                      {planned && tracked ? (
                        getDiff(planned.kcal, tracked.kcal) >= 0 ? (
                          <TrendingUp className={`w-4 h-4 ${getDiffColor(getDiff(planned.kcal, tracked.kcal))}`} />
                        ) : (
                          <TrendingDown className={`w-4 h-4 ${getDiffColor(getDiff(planned.kcal, tracked.kcal))}`} />
                        )
                      ) : (
                        <span className="w-4" />
                      )}
                    </div>

                    {/* Tracciato */}
                    <div className="flex-1 text-center">
                      {tracked ? (
                        <div className={`text-xs ${tracked.checked ? 'text-green-600' : 'text-foreground'}`}>
                          <span className="font-medium">{tracked.kcal}</span> kcal
                          <span className="hidden sm:inline ml-2">
                            P{tracked.protein} C{tracked.carbs} G{tracked.fat}
                          </span>
                          {tracked.checked && <Check className="w-3 h-3 inline ml-1" />}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Non tracciato</span>
                      )}
                    </div>

                    {/* Differenza */}
                    {planned && tracked && (
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] w-14 justify-center ${getDiffColor(getDiff(planned.kcal, tracked.kcal))}`}
                      >
                        {getDiff(planned.kcal, tracked.kcal) > 0 ? '+' : ''}{getDiff(planned.kcal, tracked.kcal)}%
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            {(() => {
              const { plannedTotal, trackedTotal, trackedDays } = getWeeklyTotals(selectedWeek);
              if (trackedDays === 0) return null;

              return (
                <div className="mt-4 p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="text-sm font-medium">Riepilogo Settimana</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-muted-foreground">Calorie Piano</div>
                      <div className="font-medium">{plannedTotal.kcal.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Calorie Effettive</div>
                      <div className="font-medium">{trackedTotal.kcal.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Differenza</div>
                      <div className={`font-medium ${getDiffColor(getDiff(plannedTotal.kcal, trackedTotal.kcal))}`}>
                        {getDiff(plannedTotal.kcal, trackedTotal.kcal) > 0 ? '+' : ''}
                        {getDiff(plannedTotal.kcal, trackedTotal.kcal)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Giorni Tracciati</div>
                      <div className="font-medium">{trackedDays}/7</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Messaggio se non ci sono dati */}
      {weekNumbers.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Nessun programma attivo.</p>
            <p className="text-sm">Crea un programma per iniziare a pianificare i macro.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

