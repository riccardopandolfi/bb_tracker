import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Copy, Trash2 } from 'lucide-react';

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

interface MacrosOverviewProps {
  onNavigateToWeek?: (weekNum: number) => void;
}

export function MacrosOverview({ onNavigateToWeek }: MacrosOverviewProps) {
  const { 
    getCurrentProgram, 
    getMacrosPlanForWeek,
    copyWeekPlan,
    resetWeekPlan,
    currentWeek,
  } = useApp();

  const program = getCurrentProgram();
  const weekNumbers = program ? Object.keys(program.weeks).map(Number).sort((a, b) => a - b) : [];

  // Calcola totali settimanali
  const getWeeklyTotals = (weekNum: number) => {
    const plan = getMacrosPlanForWeek(weekNum);
    if (!plan) return null;

    let totalKcal = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let filledDays = 0;
    let checkedDays = 0;

    plan.days.forEach((day, idx) => {
      if (day.protein > 0 || day.carbs > 0 || day.fat > 0) {
        totalKcal += day.kcal;
        totalProtein += day.protein;
        totalCarbs += day.carbs;
        totalFat += day.fat;
        filledDays++;
      }
      if (plan.checked[idx]) checkedDays++;
    });

    return { 
      totalKcal, 
      avgKcal: filledDays > 0 ? Math.round(totalKcal / filledDays) : 0,
      avgProtein: filledDays > 0 ? Math.round(totalProtein / filledDays) : 0,
      avgCarbs: filledDays > 0 ? Math.round(totalCarbs / filledDays) : 0,
      avgFat: filledDays > 0 ? Math.round(totalFat / filledDays) : 0,
      filledDays,
      checkedDays,
      fromCycling: plan.fromCycling,
    };
  };

  // Rendering cella
  const renderCell = (weekNum: number, dayIdx: number) => {
    const plan = getMacrosPlanForWeek(weekNum);
    const day = plan?.days?.[dayIdx];
    const isChecked = plan?.checked?.[dayIdx];

    if (!day || (day.protein === 0 && day.carbs === 0 && day.fat === 0)) {
      return (
        <div className="text-[10px] text-muted-foreground text-center py-2">
          -
        </div>
      );
    }

    return (
      <div 
        className={`text-[10px] py-1 cursor-pointer hover:bg-muted/50 rounded ${isChecked ? 'bg-green-50' : ''}`}
        onClick={() => onNavigateToWeek?.(weekNum)}
      >
        <div className={`font-medium ${isChecked ? 'text-green-600' : ''}`}>{day.kcal}</div>
        <div className="text-muted-foreground opacity-70">
          P{day.protein} C{day.carbs} G{day.fat}
        </div>
      </div>
    );
  };

  // Handle copy week
  const handleCopyWeek = (fromWeek: number) => {
    const toWeek = prompt(`Copiare Week ${fromWeek} in quale settimana?`, String(fromWeek + 1));
    if (toWeek && !isNaN(parseInt(toWeek))) {
      copyWeekPlan(fromWeek, parseInt(toWeek));
    }
  };

  // Handle reset week
  const handleResetWeek = (weekNum: number) => {
    if (confirm(`Svuotare i macro della Week ${weekNum}?`)) {
      resetWeekPlan(weekNum);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabella principale */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Riepilogo Piano Nutrizionale</CardTitle>
          <CardDescription className="text-xs">
            Clicca su una cella per andare a quella settimana
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-2 px-3 font-medium sticky left-0 bg-muted/50">Giorno</th>
                  {weekNumbers.map(weekNum => {
                    const stats = getWeeklyTotals(weekNum);
                    return (
                      <th 
                        key={weekNum} 
                        className={`text-center py-2 px-2 font-medium ${
                          weekNum === currentWeek ? 'bg-primary/10' : ''
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          W{weekNum}
                          {stats?.fromCycling && (
                            <RefreshCw className="w-3 h-3 text-primary" />
                          )}
                        </div>
                      </th>
                    );
                  })}
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
                {/* Totali / Media */}
                <tr className="bg-muted/50 font-medium">
                  <td className="py-2 px-3 sticky left-0 bg-muted/50">Media</td>
                  {weekNumbers.map(weekNum => {
                    const stats = getWeeklyTotals(weekNum);
                    
                    return (
                      <td key={weekNum} className={`text-center py-2 ${weekNum === currentWeek ? 'bg-primary/10' : ''}`}>
                        {stats && stats.filledDays > 0 ? (
                          <div className="text-[10px]">
                            <div className="font-bold">{stats.avgKcal}</div>
                            <div className="text-muted-foreground">
                              {stats.checkedDays}/{stats.filledDays}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[10px]">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Azioni per settimana */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Azioni</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {weekNumbers.map(weekNum => {
              const stats = getWeeklyTotals(weekNum);
              const hasData = stats && stats.filledDays > 0;
              
              return (
                <div key={weekNum} className="flex items-center gap-1 p-2 rounded-lg bg-muted/30">
                  <Badge variant={weekNum === currentWeek ? 'default' : 'outline'} className="text-xs">
                    W{weekNum}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleCopyWeek(weekNum)}
                    disabled={!hasData}
                    title="Copia in altra settimana"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                    onClick={() => handleResetWeek(weekNum)}
                    disabled={!hasData}
                    title="Reset settimana"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
