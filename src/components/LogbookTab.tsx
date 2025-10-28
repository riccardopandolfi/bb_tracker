import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from './ui/button';
import { Download } from 'lucide-react';
import { exportToCSV } from '@/lib/calculations';
import { LogbookFilters } from './logbook/LogbookFilters';
import { LogbookTable } from './logbook/LogbookTable';
import { ChartsSection } from './logbook/ChartsSection';

export function LogbookTab() {
  const { exercises, weeks, loggedSessions, macros } = useApp();

  const [filters, setFilters] = useState({
    exercise: '',
    repRange: '',
    technique: '',
  });

  const handleExport = () => {
    exportToCSV({ exercises, weeks, loggedSessions, macros });
  };

  const filteredSessions = loggedSessions.filter((session) => {
    if (filters.exercise && session.exercise !== filters.exercise) return false;
    if (filters.repRange && session.repRange !== filters.repRange) return false;
    if (filters.technique && session.technique !== filters.technique) return false;
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
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Esporta CSV
          </Button>
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
        <ChartsSection filteredSessions={filteredSessions} />
      </div>
    );
}
