import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Plus, Copy, Check } from 'lucide-react';

export function WeekSelector() {
  const { currentWeek, getCurrentWeeks, setCurrentWeek, addWeek, duplicateWeek, loggedSessions, currentProgramId } = useApp();
  const weeks = getCurrentWeeks();
  const weekNumbers = Object.keys(weeks).map(Number).sort((a, b) => a - b);

  const getWeekColor = (weekNum: number): string => {
    const colors = [
      'bg-emerald-700 text-white',  // W1 - Emerald
      'bg-teal-700 text-white',     // W2 - Teal
      'bg-cyan-700 text-white',     // W3 - Cyan
      'bg-sky-700 text-white',      // W4 - Sky
      'bg-blue-700 text-white',     // W5 - Blue
      'bg-indigo-700 text-white',   // W6 - Indigo
      'bg-violet-700 text-white',   // W7 - Violet
      'bg-purple-700 text-white',   // W8 - Purple
    ];
    return colors[(weekNum - 1) % colors.length];
  };

  const hasLoggedSessions = (weekNum: number) => {
    return loggedSessions.some((s) => s.weekNum === weekNum && s.programId === currentProgramId);
  };

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
            const weekColorClass = getWeekColor(weekNum);
            // Estrai solo il colore di sfondo (es. "bg-emerald-700") senza "text-white"
            const bgColor = weekColorClass.split(' ')[0];
            const borderColor = bgColor.replace('bg-', 'border-').replace('-700', '-300');
            
            return (
              <Button
                key={weekNum}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentWeek(weekNum)}
                className={`relative ${
                  isActive 
                    ? weekColorClass 
                    : `${bgColor.replace('-700', '-100')} border-2 ${borderColor} text-gray-900 hover:${bgColor.replace('-700', '-200')}`
                }`}
              >
                W{weekNum}
                {hasLoggedSessions(weekNum) && (
                  <Check className="w-3 h-3 ml-1 text-green-500" />
                )}
              </Button>
            );
          })}
          <Button variant="secondary" size="sm" onClick={handleAddWeek}>
            <Plus className="w-4 h-4 mr-1" />
            Nuova
          </Button>
          {weeks[currentWeek] && (
            <Button variant="outline" size="sm" onClick={() => duplicateWeek(currentWeek)}>
              <Copy className="w-4 h-4 mr-1" />
              Duplica
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
