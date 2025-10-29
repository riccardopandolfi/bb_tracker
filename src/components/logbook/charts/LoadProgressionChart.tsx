import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { DatePicker } from '../../ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

type MetricType = 'load' | 'reps';

export function LoadProgressionChart() {
  const { loggedSessions } = useApp();

  // Filters
  const [selectedExercise, setSelectedExercise] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Toggle
  const [metricType, setMetricType] = useState<MetricType>('load');

  // Get unique values for filters
  const uniqueExercises = Array.from(new Set(loggedSessions.map((s) => s.exercise)));

  // Get unique targets (formato: "3x10" o "3 x 15+15+15")
  const uniqueTargets = Array.from(
    new Set(
      loggedSessions
        .filter((s) => {
          if (selectedExercise && s.exercise !== selectedExercise) return false;
          return true;
        })
        .map((s) => {
          const numSets = new Set(s.sets.map(set => set.setNum)).size;
          if (s.technique === 'Normale') {
            return `${numSets}x${s.targetReps / numSets}`;
          } else {
            return `${numSets} x ${s.techniqueSchema}`;
          }
        })
        .filter((target) => target)
    )
  );

  // Apply filters
  const filteredSessions = loggedSessions.filter((s) => {
    if (selectedExercise && s.exercise !== selectedExercise) return false;
    if (selectedTarget) {
      const numSets = new Set(s.sets.map(set => set.setNum)).size;
      const sessionTarget = s.technique === 'Normale'
        ? `${numSets}x${s.targetReps / numSets}`
        : `${numSets} x ${s.techniqueSchema}`;
      if (sessionTarget !== selectedTarget) return false;
    }
    if (dateFrom && s.date < dateFrom) return false;
    if (dateTo && s.date > dateTo) return false;
    return true;
  });

  const sortedSessions = [...filteredSessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Expand sessions into individual sets/mini-sets
  const data = sortedSessions.flatMap((session) => {
    return session.sets.map((set) => {
      // Get target values for this set
      const targetLoad = session.targetLoads?.[set.setNum - 1] ? parseFloat(session.targetLoads[set.setNum - 1]) : 0;

      // For normal technique, calculate target reps per set
      // For special techniques, we don't have a specific target per mini-set, so use actual
      const targetReps = session.technique === 'Normale'
        ? session.targetReps / new Set(session.sets.map(s => s.setNum)).size
        : parseFloat(set.reps || '0');

      const setLabel = session.technique === 'Normale'
        ? `${session.date} - Set ${set.setNum}`
        : `${session.date} - Set ${set.setNum}.${set.clusterNum}`;

      return {
        name: setLabel,
        date: session.date,
        setNum: set.setNum,
        clusterNum: set.clusterNum,
        exercise: session.exercise,
        technique: session.technique,
        actualLoad: Math.round(parseFloat(set.load || '0') * 10) / 10,
        targetLoad: Math.round(targetLoad * 10) / 10,
        actualReps: parseFloat(set.reps || '0'),
        targetReps: Math.round(targetReps),
        rpe: set.rpe ? Math.round(parseFloat(set.rpe) * 10) / 10 : 0,
      };
    });
  });

  const hasFilters = selectedExercise || selectedTarget || dateFrom || dateTo;

  // Labels for metric types
  const metricLabels = {
    load: 'Carico (kg)',
    reps: 'Ripetizioni',
  };

  const yAxisLabel = metricLabels[metricType];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progressione Set per Set</CardTitle>
        <CardDescription>Visualizza ogni singolo set con carico e ripetizioni effettive</CardDescription>

        {/* Toggle */}
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Metrica</Label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setMetricType('load')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  metricType === 'load'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Carico
              </button>
              <button
                onClick={() => setMetricType('reps')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  metricType === 'reps'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Reps
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
          <div className="space-y-2">
            <Label>Esercizio</Label>
            <Select value={selectedExercise || 'all'} onValueChange={(v) => setSelectedExercise(v === 'all' ? '' : v)}>
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
            <Label>Target (Set x Reps)</Label>
            <Select value={selectedTarget || 'all'} onValueChange={(v) => setSelectedTarget(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Tutti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                {uniqueTargets.map((target) => (
                  <SelectItem key={target} value={target}>
                    {target}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data Da</Label>
            <DatePicker
              date={dateFrom ? new Date(dateFrom) : undefined}
              onSelect={(date) => setDateFrom(date ? format(date, 'yyyy-MM-dd') : '')}
              placeholder="Seleziona data inizio"
            />
          </div>

          <div className="space-y-2">
            <Label>Data A</Label>
            <DatePicker
              date={dateTo ? new Date(dateTo) : undefined}
              onSelect={(date) => setDateTo(date ? format(date, 'yyyy-MM-dd') : '')}
              placeholder="Seleziona data fine"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!hasFilters || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-center">
              {!hasFilters
                ? 'Seleziona almeno un filtro per vedere la progressione'
                : 'Nessun dato disponibile con questi filtri'}
            </p>
          </div>
        ) : (
          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fontSize: 10 }}
                />
                <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const data = payload[0].payload;
                    const setLabel = data.technique === 'Normale'
                      ? `Set ${data.setNum}`
                      : `Set ${data.setNum}.${data.clusterNum}`;
                    return (
                      <div className="bg-background border rounded p-3 shadow-lg">
                        <p className="font-bold">{data.date} - {setLabel}</p>
                        <p className="text-sm">{data.exercise}</p>
                        <p className="text-sm">Tecnica: {data.technique}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-blue-600">
                            Target {metricType === 'load' ? 'Carico' : 'Reps'}: {metricType === 'load' ? data.targetLoad : data.targetReps} {metricType === 'load' ? 'kg' : ''}
                          </p>
                          <p className="text-sm text-green-600">
                            Effettivo {metricType === 'load' ? 'Carico' : 'Reps'}: {metricType === 'load' ? data.actualLoad : data.actualReps} {metricType === 'load' ? 'kg' : ''}
                          </p>
                          {data.rpe > 0 && (
                            <p className="text-sm text-orange-600">
                              RPE: {data.rpe}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend />

                <Bar
                  dataKey={metricType === 'load' ? 'targetLoad' : 'targetReps'}
                  name="Target"
                  fill="hsl(221.2 83.2% 53.3%)"
                  radius={[8, 8, 0, 0]}
                />

                <Bar
                  dataKey={metricType === 'load' ? 'actualLoad' : 'actualReps'}
                  name="Effettivo"
                  fill="hsl(142.1 76.2% 36.3%)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
