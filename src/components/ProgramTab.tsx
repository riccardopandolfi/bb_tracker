import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { WeekSelector } from './program/WeekSelector';
import { VolumeSummary } from './program/VolumeSummary';
import { DaysTabs } from './program/DaysTabs';
import { MacrosSection } from './program/MacrosSection';

export function ProgramTab() {

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Scheda Allenamento</h2>
          <p className="text-muted-foreground">Pianifica le tue settimane di training</p>
        </div>
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

      {/* Macros */}
      <MacrosSection />
    </div>
  );
}
