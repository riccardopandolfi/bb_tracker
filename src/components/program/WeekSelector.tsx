import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Plus, Copy, Check } from 'lucide-react';

export function WeekSelector() {
  const { currentWeek, getCurrentWeeks, setCurrentWeek, addWeek, duplicateWeek, loggedSessions, currentProgramId } = useApp();
  const weeks = getCurrentWeeks();
  const weekNumbers = Object.keys(weeks).map(Number).sort((a, b) => a - b);

  const hasLoggedSessions = (weekNum: number) =>
    loggedSessions.some((s) => s.weekNum === weekNum && s.programId === currentProgramId);

  const handleAddWeek = () => {
    const newWeekNum = Math.max(...weekNumbers, 0) + 1;
    addWeek(newWeekNum);
    setCurrentWeek(newWeekNum);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium mr-2">Settimana:</span>
          {weekNumbers.map((weekNum) => {
            const isActive = currentWeek === weekNum;
            const activeClasses = 'bg-black text-white';
            const inactiveClasses = 'bg-black/5 border border-black/40 text-black hover:bg-black/15';

            return (
              <Button
                key={weekNum}
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(weekNum)}
                className={`relative ${isActive ? activeClasses : inactiveClasses}`}
              >
                W{weekNum}
                {hasLoggedSessions(weekNum) && (
                  <Check className={`w-3 h-3 ml-1 ${isActive ? 'text-white' : 'text-black'}`} />
                )}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddWeek}
            className="border border-black/40 text-black hover:bg-black/10"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nuova
          </Button>
          {weeks[currentWeek] && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => duplicateWeek(currentWeek)}
              className="border border-black/40 text-black hover:bg-black/10"
            >
              <Copy className="w-4 h-4 mr-1" />
              Duplica
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
