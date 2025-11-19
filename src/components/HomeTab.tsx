import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dumbbell, CheckCircle2, Filter } from 'lucide-react';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from './ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { useState } from 'react';
import { MacrosSummaryWidget } from './home/MacrosSummaryWidget';
import { adjustColor } from '@/lib/colorUtils';

export function HomeTab() {
  const {
    programs,
    currentProgramId,
    loggedSessions,
    loadDemoData,
    clearDemoData,
    hasDemoData,
    exercises,
    setCurrentTab,
    getMuscleColor: resolveMuscleColor,
  } = useApp();
  const [weekRange, setWeekRange] = useState<'all' | 'last2' | 'last4'>('all');

  // Default muscle groups to show
  const [selectedMuscles, setSelectedMuscles] = useState<Set<string>>(new Set([
    'Petto',
    'Dorso - Lats',
    'Dorso - Upper Back',
    'Dorso - Trapezi',
    'Bicipiti',
    'Tricipiti',
    'Quadricipiti',
  ]));

  // Get current program
  const currentProgram = currentProgramId != null ? programs[currentProgramId] : undefined;

  // Filter sessions by current program
  const currentProgramSessions =
    currentProgramId != null
      ? loggedSessions.filter((session) => session.programId === currentProgramId)
      : [];

  // Get total programs count
  const totalPrograms = Object.keys(programs).length;

  const getMuscleColorHex = (muscle: string) => resolveMuscleColor(muscle) || '#6b7280';
  const getMuscleGradientColor = (muscle: string, modifier: number) =>
    adjustColor(getMuscleColorHex(muscle), modifier);

  // Empty state when no programs exist
  if (totalPrograms === 0) {
    return (
      <div className="space-y-6">
        {/* Empty State */}
        <Card className="border-dashed shadow-premium">
          <CardContent className="flex flex-col items-center justify-center py-16 px-4">
            <div className="self-end mb-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="demo-mode"
                  checked={hasDemoData()}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      loadDemoData();
                    } else {
                      clearDemoData();
                    }
                  }}
                />
                <Label htmlFor="demo-mode">Dati Demo</Label>
              </div>
            </div>
            <div className="rounded-full bg-muted p-4 mb-4">
              <Dumbbell className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-2 font-heading">Nessun Programma Trovato</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Inizia creando il tuo primo programma di allenamento per sbloccare tutte le funzionalità dell'app.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button onClick={() => setCurrentTab('programs')} size="lg" className="w-full sm:w-auto">
                <Dumbbell className="mr-2 h-5 w-5" />
                Crea il Primo Programma
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  loadDemoData();
                  setCurrentTab('program');
                }}
                className="w-full sm:w-auto"
              >
                Carica Dati Demo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate last logged week - only from current program
  const lastLoggedSession = currentProgramSessions.length > 0
    ? [...currentProgramSessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  const lastWeekNum = lastLoggedSession?.weekNum || 1;

  // Get current week structure
  const currentWeek = currentProgram?.weeks?.[lastWeekNum];
  const daysInWeek = currentWeek?.days || [];

  // Calculate status for each day
  const dayStatus = daysInWeek.map((day, dayIndex) => {
    // Find all exercises for this day
    const dayExercises = day.exercises.map(ex => ex.exerciseName);

    // Check which exercises have been logged for this day in this week
    const loggedExercisesForDay = currentProgramSessions.filter(
      session => session.weekNum === lastWeekNum && session.dayIndex === dayIndex
    );

    // Get unique dates for this day
    const dates = [...new Set(loggedExercisesForDay.map(s => s.date))];
    const latestDate = dates.length > 0
      ? dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
      : null;

    // Count occurrences of each exercise in the program
    const exerciseOccurrences = new Map<string, number>();
    dayExercises.forEach(ex => {
      exerciseOccurrences.set(ex, (exerciseOccurrences.get(ex) || 0) + 1);
    });

    // Count occurrences of each logged exercise
    const loggedOccurrences = new Map<string, number>();
    loggedExercisesForDay.forEach(session => {
      loggedOccurrences.set(session.exercise, (loggedOccurrences.get(session.exercise) || 0) + 1);
    });

    // Count how many exercises are fully logged (all occurrences)
    let loggedCount = 0;
    exerciseOccurrences.forEach((requiredCount, exerciseName) => {
      const actualCount = loggedOccurrences.get(exerciseName) || 0;
      loggedCount += Math.min(actualCount, requiredCount);
    });

    // Check if all exercises have been logged (all occurrences)
    const isComplete = Array.from(exerciseOccurrences.entries()).every(
      ([exerciseName, requiredCount]) => (loggedOccurrences.get(exerciseName) || 0) >= requiredCount
    );

    return {
      dayIndex: dayIndex + 1,
      name: day.name,
      isComplete,
      date: latestDate,
      exercisesCount: dayExercises.length,
      loggedCount: loggedCount,
    };
  });

  // Calculate volume by muscle group per week - across ALL programs in chronological order
  // First, create a mapping of (programId, weekNum) to chronological week number
  const weekMapping: Record<string, number> = {};
  const programWeeks: Array<{ programId: number; weekNum: number; minDate: string }> = [];

  // Group sessions by program and week, find earliest date for each
  const programWeekGroups = new Map<string, string>();
  loggedSessions.forEach((session) => {
    const key = `${session.programId}-${session.weekNum}`;
    const currentMin = programWeekGroups.get(key);
    if (!currentMin || session.date < currentMin) {
      programWeekGroups.set(key, session.date);
    }
  });

  // Convert to array and sort by date
  programWeekGroups.forEach((minDate, key) => {
    const [programId, weekNum] = key.split('-').map(Number);
    programWeeks.push({ programId, weekNum, minDate });
  });
  programWeeks.sort((a, b) => a.minDate.localeCompare(b.minDate));

  // Assign chronological week numbers
  programWeeks.forEach((item, index) => {
    const key = `${item.programId}-${item.weekNum}`;
    weekMapping[key] = index + 1;
  });

  // Calculate volume using chronological week numbers
  const volumeByWeekAndMuscle: Record<number, Record<string, number>> = {};

  loggedSessions.forEach((session) => {
    const chronologicalWeek = weekMapping[`${session.programId}-${session.weekNum}`];
    if (!chronologicalWeek) return;

    if (!volumeByWeekAndMuscle[chronologicalWeek]) {
      volumeByWeekAndMuscle[chronologicalWeek] = {};
    }

    // Find exercise in library to get muscle distribution
    const exercise = exercises.find((e) => e.name === session.exercise);
    if (!exercise || !exercise.muscles) return;

    // Calculate session volume using normalized method (sets × coefficient)
    const sessionVolume = session.sets.length * session.coefficient;

    // Distribute volume across muscles
    exercise.muscles.forEach(({ muscle, percent }) => {
      const muscleVolume = sessionVolume * (percent / 100);
      if (!volumeByWeekAndMuscle[chronologicalWeek][muscle]) {
        volumeByWeekAndMuscle[chronologicalWeek][muscle] = 0;
      }
      volumeByWeekAndMuscle[chronologicalWeek][muscle] += muscleVolume;
    });
  });

  // Get unique muscles and sort weeks
  const allMuscles = new Set<string>();
  Object.values(volumeByWeekAndMuscle).forEach((muscles) => {
    Object.keys(muscles).forEach((muscle) => allMuscles.add(muscle));
  });
  const allMusclesList = Array.from(allMuscles).sort();

  // Filter muscles based on selection
  const muscleList = allMusclesList.filter(muscle => selectedMuscles.has(muscle));
  const allWeeks = Object.keys(volumeByWeekAndMuscle).map(Number).sort((a, b) => a - b);

  // Toggle muscle selection
  const toggleMuscle = (muscle: string) => {
    const newSelected = new Set(selectedMuscles);
    if (newSelected.has(muscle)) {
      newSelected.delete(muscle);
    } else {
      newSelected.add(muscle);
    }
    setSelectedMuscles(newSelected);
  };

  // Filter weeks based on selection
  const weekList = (() => {
    if (weekRange === 'last2' && allWeeks.length > 0) {
      return allWeeks.slice(-2);
    } else if (weekRange === 'last4' && allWeeks.length > 0) {
      return allWeeks.slice(-4);
    }
    return allWeeks;
  })();

  // Prepare chart data
  const chartData = weekList.map((week) => {
    const dataPoint: any = { week: `Sett. ${week}`, weekNum: week };
    muscleList.forEach((muscle) => {
      dataPoint[muscle] = parseFloat((volumeByWeekAndMuscle[week][muscle] || 0).toFixed(1));
    });
    return dataPoint;
  });

  // Prepare chart config
  const chartConfig: ChartConfig = muscleList.reduce((config, muscle) => {
    config[muscle] = {
      label: muscle,
      color: getMuscleColorHex(muscle),
    };
    return config;
  }, {} as ChartConfig);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-end">
        <div className="flex items-center space-x-2">
          <Switch
            id="demo-mode"
            checked={hasDemoData()}
            onCheckedChange={(checked) => {
              if (checked) {
                loadDemoData();
              } else {
                clearDemoData();
              }
            }}
          />
          <Label htmlFor="demo-mode" className="text-sm">Dati Demo</Label>
        </div>
      </div>

      {/* Top Grid */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 w-full lg:h-[600px]">
        {/* Programma Attivo e Sessioni Recenti Completate */}
        <Card className="min-w-0 w-full h-full shadow-premium hover:shadow-premium-hover transition-all duration-300 border-none">
          <CardContent className="flex flex-col pt-6 h-full">
            {/* Programma Attivo */}
            <div>
              <div className="text-2xl font-bold font-heading">{currentProgram?.name || 'Nessuno'}</div>
              <p className="text-sm text-gray-500 mt-1">
                {totalPrograms} {totalPrograms === 1 ? 'programma totale' : 'programmi totali'}
              </p>
            </div>

            {/* Divider */}
            <div className="border-t pt-4 mt-4 flex flex-col flex-1 min-h-0">
              <div className="mb-3">
                <h4 className="text-xs font-semibold mb-2 text-gray-400">Sessioni Completate - Week {lastWeekNum}</h4>
              </div>
              {dayStatus.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessun giorno configurato</p>
              ) : (
                <div className="space-y-2 flex-1 overflow-y-auto pr-2">
                  {dayStatus
                    .filter((day) => day.isComplete)
                    .map((day) => (
                      <div
                        key={day.dayIndex}
                        className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{day.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {day.date
                                ? new Date(day.date).toLocaleDateString('it-IT', {
                                  day: 'numeric',
                                  month: 'short',
                                })
                                : 'Completato'} • Day {day.dayIndex}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-medium">
                            {day.loggedCount}/{day.exercisesCount}
                          </p>
                          <p className="text-xs text-muted-foreground">esercizi</p>
                        </div>
                      </div>
                    ))}
                  {dayStatus.filter((day) => day.isComplete).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nessuna sessione completata questa settimana
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Macro Summary Widget */}
        <MacrosSummaryWidget />
      </div>

      {/* Volume Chart */}
      <Card className="min-w-0 w-full shadow-premium hover:shadow-premium-hover transition-all duration-300 border-none">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-2 space-y-0 border-b py-4 sm:py-5">
          <div className="grid flex-1 gap-1 w-full sm:w-auto">
            <CardTitle className="text-base sm:text-lg font-heading">Volume per Gruppo Muscolare</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Progressione del volume nelle settimane (tutti i programmi)
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1 rounded-lg">
                  <Filter className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Muscoli ({selectedMuscles.size})
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-4" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Filtra Gruppi Muscolari</h4>
                    <p className="text-xs text-muted-foreground">
                      Seleziona i muscoli da mostrare nel grafico
                    </p>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {allMusclesList.map((muscle) => (
                      <div key={muscle} className="flex items-center space-x-2">
                        <Checkbox
                          id={muscle}
                          checked={selectedMuscles.has(muscle)}
                          onCheckedChange={() => toggleMuscle(muscle)}
                        />
                        <label
                          htmlFor={muscle}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          <span
                            className="inline-block w-3 h-3 rounded-sm mr-2"
                            style={{ backgroundColor: getMuscleColorHex(muscle) }}
                          />
                          {muscle}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Select value={weekRange} onValueChange={(value: any) => setWeekRange(value)}>
              <SelectTrigger
                className="w-[160px] rounded-lg"
                aria-label="Seleziona periodo"
              >
                <SelectValue placeholder="Tutte le settimane" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="rounded-lg">
                  Tutte le settimane
                </SelectItem>
                <SelectItem value="last4" className="rounded-lg">
                  Ultime 4 settimane
                </SelectItem>
                <SelectItem value="last2" className="rounded-lg">
                  Ultime 2 settimane
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {chartData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              Nessun dato disponibile
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
              <AreaChart data={chartData}>
                <defs>
                  {muscleList.map((muscle) => (
                    <linearGradient key={muscle} id={`fill${muscle.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={getMuscleGradientColor(muscle, 0.18)}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor={getMuscleGradientColor(muscle, -0.12)}
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="week"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => value.toString()}
                      indicator="dot"
                    />
                  }
                />
                {muscleList.map((muscle) => (
                  <Area
                    key={muscle}
                    dataKey={muscle}
                    type="natural"
                    fill={`url(#fill${muscle.replace(/\s+/g, '')})`}
                    stroke={getMuscleColorHex(muscle)}
                    stackId="a"
                  />
                ))}
                <ChartLegend
                  content={
                    <ChartLegendContent className="hidden sm:flex sm:flex-wrap sm:gap-3" />
                  }
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
