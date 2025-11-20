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
    <Card className="card-monetra">
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium mr-2 font-heading">Settimana:</span>
          {weekNumbers.map((weekNum) => {
            const isActive = currentWeek === weekNum;
            const activeClasses = 'lime-gradient text-black shadow-md';
            const inactiveClasses = 'bg-muted/50 border border-border text-foreground hover:bg-muted';

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
            className="bg-black text-white border-black hover:bg-black/90"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nuova
          </Button>
          {weeks[currentWeek] && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => duplicateWeek(currentWeek)}
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
