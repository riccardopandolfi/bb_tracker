import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Download, Folder } from 'lucide-react';
import { exportToCSV } from '@/lib/calculations';
import { LogbookFilters } from './logbook/LogbookFilters';
import { LogbookTable } from './logbook/LogbookTable';
import { ChartsSection } from './logbook/ChartsSection';

export function LogbookTab() {
  const { exercises, getCurrentWeeks, getCurrentMacros, getCurrentProgram, loggedSessions, currentProgramId } = useApp();

  const [filters, setFilters] = useState({
    exercise: '',
    repRange: '',
    technique: '',
    dateFrom: '',
    dateTo: '',
  });

  const weeks = getCurrentWeeks();
  const macros = getCurrentMacros();
  const currentProgram = getCurrentProgram();

  const handleExport = () => {
    exportToCSV({ exercises, weeks, loggedSessions, macros });
  };

  // Filter sessions by current program
  const filteredSessions = loggedSessions.filter((session) => {
    // First filter by program
    if (session.programId !== currentProgramId) return false;
    // Then apply user filters
    if (filters.exercise && session.exercise !== filters.exercise) return false;
    // Rep Range solo per tecniche normali
    if (filters.repRange && session.technique === 'Normale' && session.repRange !== filters.repRange) return false;
    if (filters.technique && session.technique !== filters.technique) return false;
    if (filters.dateFrom && session.date < filters.dateFrom) return false;
    if (filters.dateTo && session.date > filters.dateTo) return false;
    return true;
  });

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Logbook e Progressioni</h2>
            <p className="text-muted-foreground">Analizza i tuoi allenamenti e le tue progressioni</p>
          </div>
          <div className="flex items-center gap-3">
            {currentProgram && (
              <Badge variant="secondary" className="gap-2 px-3 py-1.5">
                <Folder className="w-4 h-4" />
                <span>{currentProgram.name}</span>
              </Badge>
            )}
            <Button onClick={handleExport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Esporta CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <LogbookFilters
          filters={filters}
          setFilters={setFilters}
          totalSessions={filteredSessions.length}
        />

        {/* Table */}
        <LogbookTable sessions={filteredSessions} />

        {/* Charts */}
        <ChartsSection />
      </div>
    );
}
