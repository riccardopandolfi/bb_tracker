import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { DatePicker } from '../ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { REP_RANGES, TECHNIQUES } from '@/types';
import { format } from 'date-fns';

interface LogbookFiltersProps {
  filters: {
    exercise: string;
    repRange: string;
    technique: string;
    dateFrom: string;
    dateTo: string;
  };
  setFilters: (filters: any) => void;
  totalSessions: number;
}

export function LogbookFilters({ filters, setFilters, totalSessions }: LogbookFiltersProps) {
  const { exercises } = useApp();

  const uniqueExercises = Array.from(new Set(exercises.map((e) => e.name)));

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>Esercizio</Label>
            <Select
              value={filters.exercise || 'all'}
              onValueChange={(v) => setFilters({ ...filters, exercise: v === 'all' ? '' : v })}
            >
              <SelectTrigger>
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

          <div className="space-y-2">
            <Label>Rep Range</Label>
            <Select
              value={filters.repRange || 'all'}
              onValueChange={(v) => setFilters({ ...filters, repRange: v === 'all' ? '' : v })}
            >
              <SelectTrigger>
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

          <div className="space-y-2">
            <Label>Tecnica</Label>
            <Select
              value={filters.technique || 'all'}
              onValueChange={(v) => setFilters({ ...filters, technique: v === 'all' ? '' : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tutte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte</SelectItem>
                {TECHNIQUES.map((tech) => (
                  <SelectItem key={tech} value={tech}>
                    {tech}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data Da</Label>
            <DatePicker
              date={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
              onSelect={(date) => setFilters({ ...filters, dateFrom: date ? format(date, 'yyyy-MM-dd') : '' })}
              placeholder="Seleziona data inizio"
            />
          </div>

          <div className="space-y-2">
            <Label>Data A</Label>
            <DatePicker
              date={filters.dateTo ? new Date(filters.dateTo) : undefined}
              onSelect={(date) => setFilters({ ...filters, dateTo: date ? format(date, 'yyyy-MM-dd') : '' })}
              placeholder="Seleziona data fine"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-medium">
            {totalSessions} sessioni trovate
          </span>
          <button
            onClick={() => setFilters({ exercise: '', repRange: '', technique: '', dateFrom: '', dateTo: '' })}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Resetta filtri
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
