import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { DatePicker } from '../../ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { getExerciseBlocks } from '@/lib/exerciseUtils';

type MetricType = 'load' | 'reps';

export function LoadProgressionChart() {
  const { loggedSessions, getCurrentWeeks } = useApp();
  const weeks = getCurrentWeeks();
  
  // Funzione per ottenere il blocco originale dalla scheda di allenamento
  const getOriginalBlock = (session: any) => {
    const week = weeks[session.weekNum];
    if (!week) return null;
    
    // Cerca l'esercizio nel programma
    for (const day of week.days) {
      const exercise = day.exercises.find((e: any) => e.exerciseName === session.exercise);
      if (exercise) {
        const blocks = getExerciseBlocks(exercise);
        const block = blocks[session.blockIndex];
        return block || null;
      }
    }
    return null;
  };

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
    // Recupera il blocco originale per ottenere i carichi corretti
    const originalBlock = getOriginalBlock(session);
    
    return session.sets.map((set) => {
      // Get target values for this set - allineato con la visualizzazione nella card
      let targetLoad = 0;
      
      if (originalBlock) {
        // Usa i carichi dal blocco originale della scheda
        if (originalBlock.targetLoadsByCluster && originalBlock.targetLoadsByCluster.length > 0) {
          // Carichi per cluster disponibili
          const setLoads = originalBlock.targetLoadsByCluster[set.setNum - 1] || 
                          originalBlock.targetLoadsByCluster[originalBlock.targetLoadsByCluster.length - 1] || 
                          [];
          // Per tecniche speciali, usa il carico del cluster corrispondente
          if (set.clusterNum && setLoads.length >= set.clusterNum) {
            targetLoad = parseFloat(setLoads[set.clusterNum - 1] || '0');
          } else if (setLoads.length > 0) {
            targetLoad = parseFloat(setLoads[0] || '0');
          }
        } else if (originalBlock.targetLoads && originalBlock.targetLoads.length > 0) {
          // Carichi normali (un carico per set)
          targetLoad = parseFloat(originalBlock.targetLoads[set.setNum - 1] || originalBlock.targetLoads[0] || '0');
        }
      } else {
        // Fallback: usa i carichi salvati nella sessione
        const loadFromSession = session.targetLoads?.[set.setNum - 1];
        if (loadFromSession) {
          // Se contiene '/', è un carico per cluster (formato "80/70/60")
          if (typeof loadFromSession === 'string' && loadFromSession.includes('/')) {
            const clusterLoads = loadFromSession.split('/');
            if (set.clusterNum && clusterLoads.length >= set.clusterNum) {
              targetLoad = parseFloat(clusterLoads[set.clusterNum - 1] || '0');
            } else {
              targetLoad = parseFloat(clusterLoads[0] || '0');
            }
          } else {
            targetLoad = parseFloat(loadFromSession || '0');
          }
        }
      }

      // Target reps: sempre dal programma originale
      let targetReps = 0;
      if (originalBlock) {
        if (originalBlock.technique === 'Normale') {
          // Tecnica normale: reps base per set
          const repsBase = parseFloat(originalBlock.repsBase || '0');
          targetReps = repsBase;
        } else if (originalBlock.techniqueSchema) {
          // Tecnica speciale: schema (es. "10+10+10")
          const clusters = originalBlock.techniqueSchema.split('+').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
          if (set.clusterNum && clusters.length >= set.clusterNum) {
            // Usa le reps del cluster corrispondente
            targetReps = clusters[set.clusterNum - 1] || 0;
          } else if (clusters.length > 0) {
            // Fallback: prima cluster
            targetReps = clusters[0] || 0;
          }
        }
      } else {
        // Fallback: usa i target dalla sessione
        targetReps = session.technique === 'Normale'
          ? session.targetReps / new Set(session.sets.map(s => s.setNum)).size
          : parseFloat(set.reps || '0');
      }
      
      // Actual reps: sempre dal logbook (dal set effettivo)
      const actualReps = parseFloat(set.reps || '0');

      // Label semplificata: solo data, blocco e set
      const blockNum = session.blockIndex !== undefined ? session.blockIndex + 1 : 1;
      
      let setLabel: string;
      if (session.technique === 'Normale') {
        setLabel = `${session.date}\nB${blockNum} - S${set.setNum}`;
      } else {
        setLabel = `${session.date}\nB${blockNum} - S${set.setNum}.${set.clusterNum}`;
      }

      return {
        name: setLabel,
        date: session.date,
        setNum: set.setNum,
        clusterNum: set.clusterNum,
        exercise: session.exercise,
        blockNum,
        technique: session.technique,
        // Target: dal programma (già calcolato sopra)
        targetLoad: Math.round(targetLoad * 10) / 10,
        targetReps: Math.round(targetReps),
        // Actual: dal logbook (dalla sessione loggata)
        actualLoad: Math.round(parseFloat(set.load || '0') * 10) / 10,
        actualReps: actualReps,
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
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-base sm:text-lg">Progressione Set per Set</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Confronto tra <span className="font-semibold text-blue-600">Programma (Target)</span> e <span className="font-semibold text-green-600">Eseguito (Actual)</span> per ogni blocco e sottoblocco
        </CardDescription>

        {/* Toggle */}
        <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm font-semibold">Metrica</Label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setMetricType('load')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  metricType === 'load'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                Carico
              </button>
              <button
                onClick={() => setMetricType('reps')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
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
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-3 sm:mt-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Esercizio</Label>
            <Select value={selectedExercise || 'all'} onValueChange={(v) => setSelectedExercise(v === 'all' ? '' : v)}>
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
            <Label className="text-xs sm:text-sm">Target (Set x Reps)</Label>
            <Select value={selectedTarget || 'all'} onValueChange={(v) => setSelectedTarget(v === 'all' ? '' : v)}>
              <SelectTrigger className="text-xs sm:text-sm">
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

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Data Da</Label>
            <DatePicker
              date={dateFrom ? new Date(dateFrom) : undefined}
              onSelect={(date) => setDateFrom(date ? format(date, 'yyyy-MM-dd') : '')}
              placeholder="Seleziona data inizio"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Data A</Label>
            <DatePicker
              date={dateTo ? new Date(dateTo) : undefined}
              onSelect={(date) => setDateTo(date ? format(date, 'yyyy-MM-dd') : '')}
              placeholder="Seleziona data fine"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:px-6">
        {!hasFilters || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-muted-foreground">
            <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4 opacity-50" />
            <p className="text-center text-xs sm:text-sm px-4">
              {!hasFilters
                ? 'Seleziona almeno un filtro per vedere la progressione'
                : 'Nessun dato disponibile con questi filtri'}
            </p>
          </div>
        ) : (
          <div className="h-[350px] sm:h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  interval={0}
                  tick={{ fontSize: 9 }}
                  allowDataOverflow={false}
                />
                <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const data = payload[0].payload;
                    const setLabel = data.technique === 'Normale'
                      ? `Set ${data.setNum}`
                      : `Set ${data.setNum}.${data.clusterNum}`;
                    
                    const targetValue = metricType === 'load' ? data.targetLoad : data.targetReps;
                    const actualValue = metricType === 'load' ? data.actualLoad : data.actualReps;
                    const unit = metricType === 'load' ? 'kg' : '';
                    
                    // Calcola differenza e colore
                    const diff = actualValue - targetValue;
                    const diffPercent = targetValue > 0 ? ((diff / targetValue) * 100).toFixed(1) : '0';
                    const diffColor = diff >= 0 ? 'text-green-600' : 'text-red-600';
                    const diffSign = diff >= 0 ? '+' : '';
                    
                    return (
                      <div className="bg-background border-2 rounded-lg p-4 shadow-xl min-w-[250px]">
                        <div className="mb-3 pb-2 border-b">
                          <p className="font-bold text-base">{data.exercise}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {data.date} • Blocco {data.blockNum} • {setLabel}
                          </p>
                          <p className="text-xs text-muted-foreground">Tecnica: {data.technique}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="bg-blue-50 border border-blue-200 rounded p-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-blue-800">📋 Programma:</span>
                              <span className="text-sm font-bold text-blue-900">
                                {targetValue.toFixed(metricType === 'load' ? 1 : 0)} {unit}
                              </span>
                            </div>
                          </div>
                          
                          <div className="bg-green-50 border border-green-200 rounded p-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-green-800">✓ Eseguito:</span>
                              <span className="text-sm font-bold text-green-900">
                                {actualValue.toFixed(metricType === 'load' ? 1 : 0)} {unit}
                              </span>
                            </div>
                          </div>
                          
                          {diff !== 0 && (
                            <div className={`bg-gray-50 border rounded p-2 ${diffColor}`}>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold">Differenza:</span>
                                <span className="text-sm font-bold">
                                  {diffSign}{diff.toFixed(metricType === 'load' ? 1 : 0)} {unit} ({diffSign}{diffPercent}%)
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {data.rpe > 0 && (
                            <div className="bg-orange-50 border border-orange-200 rounded p-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-orange-800">RPE:</span>
                                <span className="text-sm font-bold text-orange-900">{data.rpe}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="rect"
                  formatter={(value) => {
                    if (value === 'Programma (Target)') return '📋 Programma';
                    if (value === 'Eseguito (Actual)') return '✓ Eseguito';
                    return value;
                  }}
                />

                <Bar
                  dataKey={metricType === 'load' ? 'targetLoad' : 'targetReps'}
                  name="Programma (Target)"
                  fill="hsl(221.2 83.2% 53.3%)"
                  stroke="hsl(221.2 83.2% 43.3%)"
                  strokeWidth={1.5}
                  radius={[4, 4, 0, 0]}
                  opacity={0.85}
                />

                <Bar
                  dataKey={metricType === 'load' ? 'actualLoad' : 'actualReps'}
                  name="Eseguito (Actual)"
                  fill="hsl(142.1 76.2% 36.3%)"
                  stroke="hsl(142.1 76.2% 26.3%)"
                  strokeWidth={1.5}
                  radius={[4, 4, 0, 0]}
                  opacity={0.85}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
