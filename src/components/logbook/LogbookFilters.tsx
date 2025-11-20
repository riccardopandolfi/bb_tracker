import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { REP_RANGES, DEFAULT_TECHNIQUES } from '@/types';

interface LogbookFiltersProps {
  filters: {
    exercise: string;
    repRange: string;
    technique: string;
    weekNum: string;
    dayName: string;
  };
  setFilters: (filters: any) => void;
  totalSessions: number;
  availableWeeks: number[];
  availableDays: string[];
}

export function LogbookFilters({ filters, setFilters, totalSessions, availableWeeks, availableDays }: LogbookFiltersProps) {
  const { exercises, customTechniques } = useApp();

  const uniqueExercises = Array.from(new Set(exercises.map((e) => e.name)));
  const allTechniques = [...DEFAULT_TECHNIQUES, ...customTechniques.map(t => t.name)];

  return (
    <Card className="card-monetra">
      <CardContent className="pt-4 sm:pt-6">
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Esercizio</Label>
            <Select
              value={filters.exercise || 'all'}
              onValueChange={(v) => setFilters({ ...filters, exercise: v === 'all' ? '' : v })}
            >
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue placeholder="Tutti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                {uniqueExercises.map((exercise) => (
                  <SelectItem key={exercise} value={exercise}>
                    {exercise}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Week</Label>
            <Select
              value={filters.weekNum || 'all'}
              onValueChange={(v) => setFilters({ ...filters, weekNum: v === 'all' ? '' : v })}
            >
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue placeholder="Tutte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte</SelectItem>
                {availableWeeks.map((week) => (
                  <SelectItem key={week} value={week.toString()}>
                    Week {week}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Giorno</Label>
            <Select
              value={filters.dayName || 'all'}
              onValueChange={(v) => setFilters({ ...filters, dayName: v === 'all' ? '' : v })}
            >
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue placeholder="Tutti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                {availableDays.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Rep Range</Label>
            <Select
              value={filters.repRange || 'all'}
              onValueChange={(v) => setFilters({ ...filters, repRange: v === 'all' ? '' : v })}
            >
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue placeholder="Tutti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                {Object.keys(REP_RANGES).map((range) => (
                  <SelectItem key={range} value={range}>
                    {range}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Tecnica</Label>
            <Select
              value={filters.technique || 'all'}
              onValueChange={(v) => setFilters({ ...filters, technique: v === 'all' ? '' : v })}
            >
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue placeholder="Tutte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte</SelectItem>
                {allTechniques.map((tech) => (
                  <SelectItem key={tech} value={tech}>
                    {tech}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <span className="text-xs sm:text-sm font-medium">
            {totalSessions} sessioni trovate
          </span>
          <button
            onClick={() => setFilters({ exercise: '', repRange: '', technique: '', weekNum: '', dayName: '' })}
            className="text-xs sm:text-sm text-muted-foreground hover:text-foreground underline"
          >
            Resetta filtri
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
