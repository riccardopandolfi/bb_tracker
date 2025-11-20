import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { WeekSelector } from './program/WeekSelector';
import { VolumeSummary } from './program/VolumeSummary';
import { DaysTabs } from './program/DaysTabs';
import { Folder } from 'lucide-react';

export function ProgramTab() {
  const { getCurrentProgram, setCurrentTab, programs } = useApp();
  const currentProgram = getCurrentProgram();
  const hasPrograms = Object.keys(programs).length > 0;

  if (!currentProgram) {
    return (
      <div className="space-y-6">
        <Card className="card-monetra">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-bold font-heading">Nessun programma selezionato</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Crea o seleziona un programma per iniziare a costruire la tua scheda di allenamento.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm sm:text-base text-muted-foreground">
              {hasPrograms
                ? 'Seleziona un programma esistente oppure crea un nuovo programma dalla sezione Programmi.'
                : 'Non hai ancora creato nessun programma. Premi il pulsante qui sotto per iniziare.'}
            </p>
            <Button onClick={() => setCurrentTab('programs')} size="sm" className="w-full sm:w-auto">
              Vai alla gestione programmi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-heading">Scheda Allenamento</h2>
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
      <Card className="card-monetra">
        <CardHeader>
          <CardTitle className="font-heading">Giorni e Esercizi</CardTitle>
          <CardDescription>Organizza i tuoi allenamenti per giorno</CardDescription>
        </CardHeader>
        <CardContent>
          <DaysTabs />
        </CardContent>
      </Card>
    </div>
  );
}
