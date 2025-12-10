import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { WeekSelector } from './program/WeekSelector';
import { VolumeSummary } from './program/VolumeSummary';
import { DaysTabs } from './program/DaysTabs';
import { ProgramTableView } from './program/ProgramTableView';
import { Folder, LayoutGrid, Table } from 'lucide-react';

export function ProgramTab() {
  const { getCurrentProgram, programs } = useApp();
  const currentProgram = getCurrentProgram();
  const hasPrograms = Object.keys(programs).length > 0;
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  if (!hasPrograms || !currentProgram) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading">Scheda Allenamento</h2>
          <p className="text-muted-foreground">Pianifica le tue settimane di training</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle Vista */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Card</span>
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="gap-2"
            >
              <Table className="w-4 h-4" />
              <span className="hidden sm:inline">Tabella</span>
            </Button>
          </div>
          
        {currentProgram && (
          <Badge variant="secondary" className="gap-2 px-3 py-1.5">
            <Folder className="w-4 h-4" />
            <span>{currentProgram.name}</span>
          </Badge>
        )}
        </div>
      </div>

      {viewMode === 'cards' ? (
        <>
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
        </>
      ) : (
        /* Vista Tabellare */
        <ProgramTableView />
      )}
    </div>
  );
}
