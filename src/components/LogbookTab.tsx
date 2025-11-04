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

  const weeks = getCurrentWeeks();
  const macros = getCurrentMacros();
  const currentProgram = getCurrentProgram();

  // Get sessions for current program first
  const currentProgramSessions = loggedSessions.filter(s => s.programId === currentProgramId);

  // Extract available weeks and days from current program sessions
  const availableWeeks = Array.from(new Set(currentProgramSessions.map(s => s.weekNum))).sort((a, b) => a - b);
  const availableDays = Array.from(new Set(currentProgramSessions.map(s => s.dayName).filter(Boolean))).sort() as string[];

  // Calculate default filters: last week and last day of that week
  const lastWeek = availableWeeks.length > 0 ? availableWeeks[availableWeeks.length - 1] : null;
  const lastWeekSessions = lastWeek ? currentProgramSessions.filter(s => s.weekNum === lastWeek) : [];
  const lastWeekDays = Array.from(new Set(lastWeekSessions.map(s => s.dayName).filter(Boolean))) as string[];
  const lastDay = lastWeekDays.length > 0 ? lastWeekDays[lastWeekDays.length - 1] : null;

  const [filters, setFilters] = useState({
    exercise: '',
    repRange: '',
    technique: '',
    weekNum: lastWeek ? lastWeek.toString() : '',
    dayName: lastDay || '',
  });

  const handleExport = () => {
    exportToCSV({ exercises, weeks, loggedSessions, macros });
  };

  // Filter sessions by current program
  const filteredSessions = currentProgramSessions.filter((session) => {
    // Apply user filters
    if (filters.exercise && session.exercise !== filters.exercise) return false;
    // Rep Range solo per tecniche normali
    if (filters.repRange && session.technique === 'Normale' && session.repRange !== filters.repRange) return false;
    if (filters.technique && session.technique !== filters.technique) return false;
    if (filters.weekNum && session.weekNum !== parseInt(filters.weekNum)) return false;
    if (filters.dayName && session.dayName !== filters.dayName) return false;
    return true;
  });

  return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Logbook e Progressioni</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Analizza i tuoi allenamenti e le tue progressioni</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {currentProgram && (
              <Badge variant="secondary" className="gap-2 px-3 py-1.5 justify-center sm:justify-start">
                <Folder className="w-4 h-4" />
                <span className="truncate">{currentProgram.name}</span>
              </Badge>
            )}
            <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto">
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
          availableWeeks={availableWeeks}
          availableDays={availableDays}
        />

        {/* Table */}
        <LogbookTable sessions={filteredSessions} />

        {/* Charts */}
        <ChartsSection />
      </div>
    );
}
