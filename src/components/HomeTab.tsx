import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dumbbell, CheckCircle2, Filter, Clock } from 'lucide-react';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
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
import { Vortex } from './ui/vortex';
import { TextGenerateEffect } from './ui/text-generate-effect';

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
      <div className="w-full h-[100dvh] overflow-hidden fixed inset-0 bg-black m-0 p-0" style={{ height: '100dvh', width: '100vw' }}>
        <Vortex
          backgroundColor="black"
          baseHue={76}
          rangeHue={20}
          className="flex items-center flex-col justify-center px-4 md:px-10 py-4 w-full h-full"
        >
          <div className="text-4xl md:text-6xl lg:text-7xl font-bold text-center font-brand tracking-widest mb-6">
            <TextGenerateEffect 
              words="NOBODY CARES WORK HARDER" 
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-center font-brand tracking-widest"
              duration={3}
              filter={true}
              textColor="#C4FF39"
            />
              </div>
          
          <p className="text-white text-base md:text-xl max-w-2xl mt-6 text-center mb-8 font-heading">
              Inizia creando il tuo primo programma di allenamento per sbloccare tutte le funzionalità dell'app.
            </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
            <Button 
              onClick={() => setCurrentTab('programs')} 
              size="lg"
              className="lime-gradient text-black font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/50"
            >
                <Dumbbell className="mr-2 h-5 w-5" />
              Inizia Ora
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  loadDemoData();
                  setCurrentTab('program');
                }}
              className="bg-white text-black border-white hover:bg-gray-100"
              >
                Carica Dati Demo
              </Button>
            </div>
        </Vortex>
      </div>
    );
  }

  // Group logged sessions by week and day to show last 4 logged days across weeks
  const dayGroups = new Map<string, {
    weekNum: number;
    dayIndex: number;
    dayName: string;
    date: string;
    sessions: typeof currentProgramSessions;
  }>();

  currentProgramSessions.forEach(session => {
    if (session.dayName && session.dayIndex !== undefined) {
      const key = `${session.weekNum}-${session.dayIndex}-${session.date}`;
      if (!dayGroups.has(key)) {
        dayGroups.set(key, {
          weekNum: session.weekNum,
          dayIndex: session.dayIndex,
          dayName: session.dayName,
          date: session.date,
          sessions: [],
        });
      }
      dayGroups.get(key)!.sessions.push(session);
    }
  });

  // Convert to array and calculate status for each logged day
  const allLoggedDays = Array.from(dayGroups.values()).map(dayGroup => {
    const week = currentProgram?.weeks?.[dayGroup.weekNum];
    const day = week?.days?.[dayGroup.dayIndex];

    if (!day) {
      return null;
    }

    // Find all exercises for this day
    const dayExercises = day.exercises.map(ex => ex.exerciseName);

    // Count occurrences of each exercise in the program
    const exerciseOccurrences = new Map<string, number>();
    dayExercises.forEach(ex => {
      exerciseOccurrences.set(ex, (exerciseOccurrences.get(ex) || 0) + 1);
    });

    // Count occurrences of each logged exercise
    const loggedOccurrences = new Map<string, number>();
    dayGroup.sessions.forEach(session => {
      loggedOccurrences.set(session.exercise, (loggedOccurrences.get(session.exercise) || 0) + 1);
    });

    // Count how many exercises are fully logged
    let loggedCount = 0;
    exerciseOccurrences.forEach((requiredCount, exerciseName) => {
      const actualCount = loggedOccurrences.get(exerciseName) || 0;
      loggedCount += Math.min(actualCount, requiredCount);
    });

    // Check if all exercises have been logged
    const isComplete = Array.from(exerciseOccurrences.entries()).every(
      ([exerciseName, requiredCount]) => (loggedOccurrences.get(exerciseName) || 0) >= requiredCount
    );

    // Calculate total sets
    const totalSets = dayGroup.sessions.reduce((sum, s) => sum + (s.sets?.length || 0), 0);

    return {
      weekNum: dayGroup.weekNum,
      dayIndex: dayGroup.dayIndex + 1,
      name: dayGroup.dayName,
      isComplete,
      date: dayGroup.date,
      exercisesCount: dayExercises.length,
      loggedCount: loggedCount,
      totalSets: totalSets,
    };
  }).filter((day): day is NonNullable<typeof day> => day !== null)
    .sort((a, b) => {
      // Sort by date descending
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  // Find the next day to log (first incomplete or next unlogged day in the latest week)
  let nextDayToLog: typeof allLoggedDays[0] | null = null;
  if (currentProgram && allLoggedDays.length > 0) {
    // Get the latest week number that has logged days
    const latestWeekNum = Math.max(...allLoggedDays.map(d => d.weekNum));
    const latestWeek = currentProgram.weeks?.[latestWeekNum];
    
    if (latestWeek) {
      // Check each day in the latest week
      for (let dayIndex = 0; dayIndex < latestWeek.days.length; dayIndex++) {
        const day = latestWeek.days[dayIndex];
        const dayExercises = day.exercises.map(ex => ex.exerciseName);
        
        // Find logged sessions for this specific day
        const dayLoggedSessions = currentProgramSessions.filter(
          s => s.weekNum === latestWeekNum && s.dayIndex === dayIndex
        );
        
        // Count logged exercises
        const loggedExercises = new Set(dayLoggedSessions.map(s => s.exercise));
        const isFullyLogged = dayExercises.every(ex => loggedExercises.has(ex));
        
        if (!isFullyLogged) {
          // This day is not fully logged, it's the next one
          const totalSets = latestWeek.days[dayIndex].exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
          
          nextDayToLog = {
            weekNum: latestWeekNum,
            dayIndex: dayIndex + 1,
            name: day.name,
            isComplete: false,
            date: new Date().toISOString().split('T')[0], // Today's date as placeholder
            exercisesCount: dayExercises.length,
            loggedCount: loggedExercises.size,
            totalSets: totalSets,
          };
          break;
        }
      }
    }
  }

  // Limit visible days to a maximum
  const MAX_VISIBLE_DAYS = 6;
  let visibleDays = [...allLoggedDays].slice(0, MAX_VISIBLE_DAYS);
  if (nextDayToLog) {
    const alreadyIncluded = visibleDays.some(
      (day) => day.weekNum === nextDayToLog!.weekNum && day.dayIndex === nextDayToLog!.dayIndex
    );
    if (!alreadyIncluded) {
      visibleDays = [nextDayToLog, ...visibleDays].slice(0, MAX_VISIBLE_DAYS);
    }
  }

  // Group the visible days by week for display
  const daysByWeek = new Map<number, typeof visibleDays>();
  visibleDays.forEach(day => {
    if (!daysByWeek.has(day.weekNum)) {
      daysByWeek.set(day.weekNum, []);
    }
    daysByWeek.get(day.weekNum)!.push(day);
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
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 w-full">
        {/* Programma Attivo e Sessioni Recenti Completate */}
        <Card className="min-w-0 w-full h-full lg:h-[600px] lg:max-h-[600px] card-monetra overflow-hidden">
          <CardContent className="flex flex-col pt-6 h-full overflow-hidden">
            {/* Programma Attivo */}
            <div>
              <div className="text-base sm:text-lg font-bold font-heading">{currentProgram?.name || 'Nessuno'}</div>
              <p className="text-sm text-gray-500 mt-1">
                {totalPrograms} {totalPrograms === 1 ? 'programma totale' : 'programmi totali'}
              </p>
            </div>

            {/* Divider */}
            <div className="border-t pt-4 mt-4 flex flex-col flex-1 min-h-0">
              {visibleDays.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessuna sessione loggata</p>
              ) : (
                <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                  {Array.from(daysByWeek.entries())
                    .sort((a, b) => b[0] - a[0])
                    .map(([weekNum, days]) => (
                      <div key={weekNum} className="space-y-2">
                        <h4 className="text-xs font-semibold text-gray-400">Sessioni Completate - Week {weekNum}</h4>
                        <div className="space-y-2">
                          {days.map((day, idx) => {
                            // Check if this is the next day to log
                            const isNextDay = nextDayToLog && 
                              day.weekNum === nextDayToLog.weekNum && 
                              day.dayIndex === nextDayToLog.dayIndex &&
                              day.loggedCount === 0;
                            
                            return (
                      <div
                                key={`${day.date}-${day.dayIndex}-${idx}`}
                                className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                                  isNextDay ? 'bg-primary/5 border-primary/30' : 'bg-card hover:bg-accent/50'
                                }`}
                      >
                        <div className="flex items-center gap-3">
                                  {isNextDay ? (
                                    <Clock className="h-5 w-5 flex-shrink-0 text-primary animate-pulse" />
                                  ) : (
                                    <CheckCircle2 className={`h-5 w-5 flex-shrink-0 ${day.isComplete ? 'text-green-500' : 'text-orange-500'}`} />
                                  )}
                          <div className="min-w-0">
                            <p className="text-sm text-gray-600 truncate">{day.name}</p>
                            <p className="text-xs text-muted-foreground">
                                      {isNextDay ? (
                                        <>Prossimo • {day.totalSets} set • Day {day.dayIndex}</>
                                      ) : (
                                        <>
                              {day.date
                                ? new Date(day.date).toLocaleDateString('it-IT', {
                                  day: 'numeric',
                                  month: 'short',
                                })
                                            : 'Completato'} • {day.totalSets} set • Day {day.dayIndex}
                                        </>
                                      )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {day.loggedCount}/{day.exercisesCount}
                          </p>
                          <p className="text-xs text-muted-foreground">esercizi</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Macro Summary Widget */}
        <MacrosSummaryWidget />
      </div>

      {/* Volume Chart */}
      <Card className="min-w-0 w-full card-monetra">
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
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              Nessun dato disponibile
            </div>
          ) : (
            <div className="rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
              <ChartContainer
                config={chartConfig}
                className="h-[300px] w-full"
              >
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
                >
                <defs>
                  {muscleList.map((muscle) => (
                      <linearGradient
                        key={muscle}
                        id={`fill${muscle.replace(/\s+/g, '')}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                      <stop
                          offset="0%"
                          stopColor={getMuscleGradientColor(muscle, 0.2)}
                          stopOpacity={0.9}
                      />
                      <stop
                          offset="100%"
                          stopColor={getMuscleGradientColor(muscle, -0.15)}
                          stopOpacity={0.05}
                      />
                    </linearGradient>
                  ))}
                </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                <XAxis
                  dataKey="week"
                  tickLine={false}
                  axisLine={false}
                  interval={chartData.length > 12 ? Math.ceil(chartData.length / 8) : 0}
                  minTickGap={24}
                  tickMargin={10}
                  tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'var(--font-heading)' }}
                />
                <ChartTooltip
                    cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                  content={
                    <ChartTooltipContent
                        className="bg-white/95 border-gray-200 text-gray-900 backdrop-blur-sm"
                        labelClassName="text-gray-700"
                        indicator="line"
                      labelFormatter={(value) => value.toString()}
                    />
                  }
                />
                {muscleList.map((muscle) => (
                  <Area
                    key={muscle}
                    dataKey={muscle}
                      type="monotone"
                      stroke={getMuscleColorHex(muscle)}
                      strokeWidth={2.2}
                    fill={`url(#fill${muscle.replace(/\s+/g, '')})`}
                    stackId="a"
                      dot={false}
                      activeDot={{ r: 4 }}
                  />
                ))}
              </AreaChart>
            </ChartContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
