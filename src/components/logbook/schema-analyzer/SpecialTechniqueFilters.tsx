import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { WorkoutSchemaFilters } from '../WorkoutSchemaAnalyzer';
import { Checkbox } from '../../ui/checkbox';
import { DEFAULT_TECHNIQUES } from '@/types';

interface SpecialTechniqueFiltersProps {
  filters: WorkoutSchemaFilters;
  setFilters: (filters: WorkoutSchemaFilters) => void;
}

export function SpecialTechniqueFilters({ filters, setFilters }: SpecialTechniqueFiltersProps) {
  const { loggedSessions, customTechniques, currentProgramId } = useApp();

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

  // Get all techniques (excluding 'Normale')
  const allTechniques = [
    ...DEFAULT_TECHNIQUES.filter(t => t !== 'Normale'),
    ...customTechniques.map(t => t.name),
  ];

  // Get suggested schemas for selected exercise and technique (solo del programma attivo)
  const suggestedSchemas = filters.exercise && filters.specialConfig?.technique
    ? Array.from(
        new Set(
          programSessions
            .filter(s =>
              s.exercise === filters.exercise &&
              s.technique === filters.specialConfig?.technique &&
              s.techniqueSchema
            )
            .map(s => {
              const sets = new Set(s.sets.map(set => set.setNum)).size;
              return `${sets} x ${s.techniqueSchema}`;
            })
        )
      ).sort()
    : [];

  const [repsInput, setRepsInput] = useState('');

  const handleExerciseChange = (exercise: string) => {
    setFilters({
      ...filters,
      exercise: exercise === 'all' ? '' : exercise,
      specialConfig: undefined,
    });
  };

  const handleTechniqueChange = (technique: string) => {
    setFilters({
      ...filters,
      specialConfig: {
        technique: technique === 'all' ? '' : technique,
        totalSets: filters.specialConfig?.totalSets || 3,
        intraSetsPerSet: filters.specialConfig?.intraSetsPerSet || 4,
        repsPerIntraSet: filters.specialConfig?.repsPerIntraSet || [],
        allowVariants: filters.specialConfig?.allowVariants || false,
      },
    });
  };

  const handleTotalSetsChange = (sets: string) => {
    setFilters({
      ...filters,
      specialConfig: {
        ...filters.specialConfig!,
        totalSets: parseInt(sets, 10) || 1,
      },
    });
  };

  const handleIntraSetsChange = (intraSets: string) => {
    setFilters({
      ...filters,
      specialConfig: {
        ...filters.specialConfig!,
        intraSetsPerSet: parseInt(intraSets, 10) || 1,
      },
    });
  };

  const handleRepsPerIntraSetChange = (reps: string) => {
    setRepsInput(reps);

    // Parse comma-separated values
    const repsArray = reps
      .split(',')
      .map(r => parseInt(r.trim(), 10))
      .filter(r => !isNaN(r));

    setFilters({
      ...filters,
      specialConfig: {
        ...filters.specialConfig!,
        repsPerIntraSet: repsArray,
      },
    });
  };

  const handleAllowVariantsToggle = () => {
    setFilters({
      ...filters,
      specialConfig: {
        ...filters.specialConfig!,
        allowVariants: !filters.specialConfig?.allowVariants,
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
      mode: 'special',
      exercise: '',
      weeks: [],
      groupByWeek: true,
    });
    setRepsInput('');
  };

  // Generate pattern description
  const patternDescription = filters.specialConfig?.repsPerIntraSet?.length
    ? `${filters.specialConfig.technique} ${filters.specialConfig.totalSets}x(${filters.specialConfig.intraSetsPerSet}x${filters.specialConfig.repsPerIntraSet[0]})`
    : '';

  const schemaPattern = filters.specialConfig?.repsPerIntraSet?.join('+') || '';

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Filtri Tecniche Speciali</h4>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          ↻ Reset
        </Button>
      </div>

      {/* Exercise and Technique Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        </div>

        <div className="space-y-2">
          <Label className="text-xs sm:text-sm">Tecnica</Label>
          <Select
            value={filters.specialConfig?.technique || 'all'}
            onValueChange={handleTechniqueChange}
            disabled={!filters.exercise}
          >
            <SelectTrigger className="text-xs sm:text-sm">
              <SelectValue placeholder="Seleziona tecnica" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Seleziona...</SelectItem>
              {allTechniques.map(tech => (
                <SelectItem key={tech} value={tech}>
                  {tech}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Suggested schemas */}
      {suggestedSchemas.length > 0 && (
        <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded p-2">
          💡 Schemi usati: {suggestedSchemas.join(', ')}
        </div>
      )}

      {/* Technique Parameters */}
      {filters.exercise && filters.specialConfig?.technique && (
        <>
          <div className="border-t pt-4 space-y-4">
            <h5 className="text-xs font-semibold text-muted-foreground uppercase">
              Parametri Tecnica
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Set Globali</Label>
                <Input
                  type="number"
                  value={filters.specialConfig.totalSets}
                  onChange={e => handleTotalSetsChange(e.target.value)}
                  placeholder="es. 3"
                  className="text-xs sm:text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Numero totale di serie
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Intra-set per Set</Label>
                <Input
                  type="number"
                  value={filters.specialConfig.intraSetsPerSet}
                  onChange={e => handleIntraSetsChange(e.target.value)}
                  placeholder="es. 4"
                  className="text-xs sm:text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Mini-set all'interno di ogni serie
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Ripetizioni per Intra-set</Label>
              <Input
                type="text"
                value={repsInput}
                onChange={e => handleRepsPerIntraSetChange(e.target.value)}
                placeholder="es. 10, 10, 10, 10"
                className="text-xs sm:text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Separati da virgola, uno per ogni intra-set
              </p>
            </div>

            {/* Pattern detected */}
            {patternDescription && schemaPattern && (
              <div className="bg-green-50 border border-green-200 rounded p-3 space-y-1">
                <p className="text-xs font-semibold text-green-900">
                  💡 Pattern rilevato: {patternDescription}
                </p>
                <p className="text-xs text-green-700">
                  Schema: {schemaPattern}
                </p>
              </div>
            )}

            {/* Options */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allow-variants"
                checked={filters.specialConfig.allowVariants}
                onCheckedChange={handleAllowVariantsToggle}
              />
              <label
                htmlFor="allow-variants"
                className="text-xs cursor-pointer select-none"
              >
                Mostra varianti simili (±1 rep per intra-set)
              </label>
            </div>
          </div>

          {/* Week Selection */}
          <div className="space-y-2 border-t pt-4">
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
