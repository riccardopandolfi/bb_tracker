import { useApp } from '@/contexts/AppContext';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { WorkoutSchemaFilters } from '../WorkoutSchemaAnalyzer';
import { Checkbox } from '../../ui/checkbox';

interface NormalSetsFiltersProps {
  filters: WorkoutSchemaFilters;
  setFilters: (filters: WorkoutSchemaFilters) => void;
  hideConfig?: boolean; // Per Ad Hoc: nascondi configurazione set/reps
}

export function NormalSetsFilters({ filters, setFilters, hideConfig }: NormalSetsFiltersProps) {
  const { loggedSessions, currentProgramId } = useApp();

  // Filtra le sessioni per il programma attivo
  const programSessions = loggedSessions.filter(s => s.programId === currentProgramId);

  // Get unique exercises (solo del programma attivo)
  const uniqueExercises = Array.from(
    new Set(programSessions.map(s => s.exercise))
  ).sort();

  // Get available weeks (solo del programma attivo)
  const availableWeeks = Array.from(
    new Set(programSessions.map(s => s.weekNum))
  ).sort((a, b) => a - b);

  // Get suggested schemas for selected exercise (solo del programma attivo)
  const suggestedSchemas = filters.exercise
    ? Array.from(
        new Set(
          programSessions
            .filter(s => s.exercise === filters.exercise && s.technique === 'Normale')
            .map(s => {
              const sets = new Set(s.sets.map(set => set.setNum)).size;
              const avgReps = Math.round(s.totalReps / sets);
              return `${sets}x${avgReps}`;
            })
        )
      ).sort()
    : [];

  const handleExerciseChange = (exercise: string) => {
    setFilters({
      ...filters,
      exercise: exercise === 'all' ? '' : exercise,
      normalConfig: undefined,
    });
  };

  const handleSetsChange = (sets: string) => {
    setFilters({
      ...filters,
      normalConfig: {
        ...filters.normalConfig,
        sets: parseInt(sets, 10) || 1,
        reps: filters.normalConfig?.reps || 10,
      },
    });
  };

  const handleRepsChange = (reps: string) => {
    setFilters({
      ...filters,
      normalConfig: {
        ...filters.normalConfig,
        sets: filters.normalConfig?.sets || 3,
        reps: parseInt(reps, 10) || 10,
      },
    });
  };

  const handleWeekToggle = (week: number) => {
    const isSelected = filters.weeks.includes(week);
    setFilters({
      ...filters,
      weeks: isSelected
        ? filters.weeks.filter(w => w !== week)
        : [...filters.weeks, week].sort((a, b) => a - b),
    });
  };

  const handleReset = () => {
    setFilters({
      mode: 'normal',
      exercise: '',
      weeks: [],
      groupByWeek: true,
    });
  };

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Filtri Set Normali</h4>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          ↻ Reset
        </Button>
      </div>

      {/* Exercise Selection */}
      <div className="space-y-2">
        <Label className="text-xs sm:text-sm">Esercizio</Label>
        <Select value={filters.exercise || 'all'} onValueChange={handleExerciseChange}>
          <SelectTrigger className="text-xs sm:text-sm">
            <SelectValue placeholder="Seleziona esercizio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Seleziona...</SelectItem>
            {uniqueExercises.map(exercise => (
              <SelectItem key={exercise} value={exercise}>
                {exercise}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Suggested schemas */}
        {suggestedSchemas.length > 0 && (
          <div className="text-xs text-muted-foreground">
            💡 Schemi usati: {suggestedSchemas.join(', ')}
          </div>
        )}
      </div>

      {/* Set and Reps Configuration - nascosto per Ad Hoc */}
      {filters.exercise && !hideConfig && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Numero di Set</Label>
              <Input
                type="number"
                value={filters.normalConfig?.sets || ''}
                onChange={e => handleSetsChange(e.target.value)}
                placeholder="es. 3"
                className="text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Ripetizioni per Set</Label>
              <Input
                type="number"
                value={filters.normalConfig?.reps || ''}
                onChange={e => handleRepsChange(e.target.value)}
                placeholder="es. 10"
                className="text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Week Selection */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Settimane (Multi-select)</Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {availableWeeks.map(week => (
                <div key={week} className="flex items-center space-x-2">
                  <Checkbox
                    id={`week-${week}`}
                    checked={filters.weeks.includes(week)}
                    onCheckedChange={() => handleWeekToggle(week)}
                  />
                  <label
                    htmlFor={`week-${week}`}
                    className="text-xs cursor-pointer select-none"
                  >
                    W{week}
                  </label>
                </div>
              ))}
            </div>
            {filters.weeks.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Selezionate: Week {filters.weeks.join(', ')}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
