import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Copy, Trash2 } from 'lucide-react';
import { WeekMacrosPlan } from '@/types';

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const MONTH_NAMES = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

// Formatta una data come "6-12 Gen"
const formatWeekShort = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = MONTH_NAMES[start.getMonth()];
  const endMonth = MONTH_NAMES[end.getMonth()];
  
  if (startMonth === endMonth) {
    return `${startDay}-${endDay} ${startMonth}`;
  } else {
    return `${startDay} ${startMonth}-${endDay} ${endMonth}`;
  }
};

// Verifica se una data è nella settimana corrente
const isCurrentWeek = (startDate: string, endDate: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return today >= startDate && today <= endDate;
};

interface MacrosOverviewProps {
  onNavigateToWeek?: (weekId: string) => void;
}

export function MacrosOverview({ onNavigateToWeek }: MacrosOverviewProps) {
  const { 
    getAllMacrosWeeks,
    getWeekPlanById,
    copyWeekPlanById,
    resetWeekPlanById,
    deleteWeekPlan,
  } = useApp();

  const allWeeks = getAllMacrosWeeks();

  // Calcola totali settimanali
  const getWeeklyTotals = (week: WeekMacrosPlan) => {
    if (!week) return null;

    let totalKcal = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let filledDays = 0;
    let checkedDays = 0;

    week.days.forEach((day, idx) => {
      if (day.protein > 0 || day.carbs > 0 || day.fat > 0) {
        totalKcal += day.kcal;
        totalProtein += day.protein;
        totalCarbs += day.carbs;
        totalFat += day.fat;
        filledDays++;
      }
      if (week.checked[idx]) checkedDays++;
    });

    return { 
      totalKcal, 
      avgKcal: filledDays > 0 ? Math.round(totalKcal / filledDays) : 0,
      avgProtein: filledDays > 0 ? Math.round(totalProtein / filledDays) : 0,
      avgCarbs: filledDays > 0 ? Math.round(totalCarbs / filledDays) : 0,
      avgFat: filledDays > 0 ? Math.round(totalFat / filledDays) : 0,
      filledDays,
      checkedDays,
      fromCycling: week.fromCycling,
      fromOnOff: week.fromOnOff,
    };
  };

  // Rendering cella
  const renderCell = (week: WeekMacrosPlan, dayIdx: number) => {
    const day = week?.days?.[dayIdx];
    const isChecked = week?.checked?.[dayIdx];

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
        onClick={() => onNavigateToWeek?.(week.id)}
      >
        <div className={`font-medium ${isChecked ? 'text-green-600' : ''}`}>{day.kcal}</div>
        <div className="text-muted-foreground opacity-70">
          P{day.protein} C{day.carbs} G{day.fat}
        </div>
      </div>
    );
  };

  // Handle copy week
  const handleCopyWeek = (fromWeekId: string) => {
    const fromWeek = getWeekPlanById(fromWeekId);
    if (!fromWeek) return;
    
    // Mostra le altre settimane disponibili
    const otherWeeks = allWeeks.filter(w => w.id !== fromWeekId);
    if (otherWeeks.length === 0) {
      alert('Non ci sono altre settimane in cui copiare');
      return;
    }
    
    const targetWeekLabel = formatWeekShort(fromWeek.startDate, fromWeek.endDate);
    const options = otherWeeks.map((w, i) => `${i + 1}. ${formatWeekShort(w.startDate, w.endDate)}`).join('\n');
    const choice = prompt(`Copiare ${targetWeekLabel} in quale settimana?\n${options}`, '1');
    
    if (choice && !isNaN(parseInt(choice))) {
      const idx = parseInt(choice) - 1;
      if (idx >= 0 && idx < otherWeeks.length) {
        copyWeekPlanById(fromWeekId, otherWeeks[idx].id);
      }
    }
  };

  // Handle reset week
  const handleResetWeek = (weekId: string) => {
    const week = getWeekPlanById(weekId);
    if (!week) return;
    
    const label = formatWeekShort(week.startDate, week.endDate);
    if (confirm(`Svuotare i macro della settimana ${label}?`)) {
      resetWeekPlanById(weekId);
    }
  };

  // Handle delete week
  const handleDeleteWeek = (weekId: string) => {
    const week = getWeekPlanById(weekId);
    if (!week) return;
    
    const label = formatWeekShort(week.startDate, week.endDate);
    if (confirm(`Eliminare la settimana ${label}? I dati andranno persi.`)) {
      deleteWeekPlan(weekId);
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
          {allWeeks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-2 px-3 font-medium sticky left-0 bg-muted/50">Giorno</th>
                    {allWeeks.map(week => {
                      const stats = getWeeklyTotals(week);
                      const isCurrent = isCurrentWeek(week.startDate, week.endDate);
                      return (
                        <th 
                          key={week.id} 
                          className={`text-center py-2 px-2 font-medium ${
                            isCurrent ? 'bg-primary/10' : ''
                          }`}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[10px]">
                              {formatWeekShort(week.startDate, week.endDate)}
                            </span>
                            {(stats?.fromCycling || stats?.fromOnOff) && (
                              <div className="flex items-center gap-0.5">
                                {stats?.fromCycling && (
                                  <RefreshCw className="w-2.5 h-2.5 text-primary" />
                                )}
                                {stats?.fromOnOff && (
                                  <span className="text-[8px]">⚡</span>
                                )}
                              </div>
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
                      {allWeeks.map(week => {
                        const isCurrent = isCurrentWeek(week.startDate, week.endDate);
                        return (
                          <td 
                            key={week.id} 
                            className={`text-center ${isCurrent ? 'bg-primary/5' : ''}`}
                          >
                            {renderCell(week, dayIdx)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {/* Totali / Media */}
                  <tr className="bg-muted/50 font-medium">
                    <td className="py-2 px-3 sticky left-0 bg-muted/50">Media</td>
                    {allWeeks.map(week => {
                      const stats = getWeeklyTotals(week);
                      const isCurrent = isCurrentWeek(week.startDate, week.endDate);
                      
                      return (
                        <td key={week.id} className={`text-center py-2 ${isCurrent ? 'bg-primary/10' : ''}`}>
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
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p>Nessuna settimana configurata.</p>
              <p className="text-sm mt-1">Aggiungi una settimana nella tab "Settimana" per iniziare.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Azioni per settimana */}
      {allWeeks.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Azioni</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {allWeeks.map(week => {
                const stats = getWeeklyTotals(week);
                const hasData = stats && stats.filledDays > 0;
                const isCurrent = isCurrentWeek(week.startDate, week.endDate);
                
                return (
                  <div key={week.id} className="flex items-center gap-1 p-2 rounded-lg bg-muted/30">
                    <Badge variant={isCurrent ? 'default' : 'outline'} className="text-[10px]">
                      {formatWeekShort(week.startDate, week.endDate)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleCopyWeek(week.id)}
                      disabled={!hasData}
                      title="Copia in altra settimana"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-orange-500 hover:text-orange-600"
                      onClick={() => handleResetWeek(week.id)}
                      disabled={!hasData}
                      title="Reset settimana"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteWeek(week.id)}
                      title="Elimina settimana"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
