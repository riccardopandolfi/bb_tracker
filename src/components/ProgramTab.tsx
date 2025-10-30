import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { WeekSelector } from './program/WeekSelector';
import { VolumeSummary } from './program/VolumeSummary';
import { DaysTabs } from './program/DaysTabs';
import { Folder } from 'lucide-react';

export function ProgramTab() {
  const { getCurrentProgram } = useApp();
  const currentProgram = getCurrentProgram();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Scheda Allenamento</h2>
          <p className="text-muted-foreground">Pianifica le tue settimane di training</p>
        </div>
        {currentProgram && (
          <Badge variant="secondary" className="gap-2 px-3 py-1.5">
            <Folder className="w-4 h-4" />
            <span>{currentProgram.name}</span>
          </Badge>
        )}
      </div>

      {/* Week Selector */}
      <WeekSelector />

      {/* Volume Summary */}
      <VolumeSummary />

      {/* Days & Exercises */}
      <Card>
        <CardHeader>
          <CardTitle>Giorni e Esercizi</CardTitle>
          <CardDescription>Organizza i tuoi allenamenti per giorno</CardDescription>
        </CardHeader>
        <CardContent>
          <DaysTabs />
        </CardContent>
      </Card>
    </div>
  );
}
