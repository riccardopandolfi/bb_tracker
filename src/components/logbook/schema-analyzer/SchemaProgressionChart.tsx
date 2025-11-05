import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { LoggedSession } from '@/types';
import { WorkoutSchemaFilters } from '../WorkoutSchemaAnalyzer';
import { Label } from '../../ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getExerciseBlocks } from '@/lib/exerciseUtils';

interface SchemaProgressionChartProps {
  sessions: LoggedSession[];
  filters: WorkoutSchemaFilters;
  mode: 'normal' | 'special';
}

type MetricType = 'load' | 'reps';

export function SchemaProgressionChart({ sessions, filters, mode }: SchemaProgressionChartProps) {
  const { getCurrentWeeks } = useApp();
  const weeks = getCurrentWeeks();

  const [metricType, setMetricType] = useState<MetricType>('load');

  // Get original block for session
  const getOriginalBlock = (session: LoggedSession) => {
    // Mappa weekNum al week index del programma
    // Programma 999 (PPL): weekNum 1-8 → weeks[1-8]
    // Programma 998 (Upper/Lower): weekNum 9-16 → weeks[1-8]
    let weekIndex = session.weekNum;
    if (session.programId === 998 && session.weekNum > 8) {
      weekIndex = ((session.weekNum - 9) % 8) + 1; // 9→1, 10→2, ..., 16→8
    }

    const week = weeks[weekIndex];
    if (!week) return null;

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

  // Prepare chart data - Per set (detailed view)
  const chartData = useMemo(() => {
    return sessions.flatMap(session => {
      const originalBlock = getOriginalBlock(session);

      return session.sets.map(set => {
        // Target load
        let targetLoad = 0;
        if (originalBlock) {
          if (originalBlock.targetLoadsByCluster && originalBlock.targetLoadsByCluster.length > 0) {
            const setLoads = originalBlock.targetLoadsByCluster[set.setNum - 1] ||
              originalBlock.targetLoadsByCluster[originalBlock.targetLoadsByCluster.length - 1] ||
              [];
            if (set.clusterNum && setLoads.length >= set.clusterNum) {
              targetLoad = parseFloat(setLoads[set.clusterNum - 1] || '0');
            } else if (setLoads.length > 0) {
              targetLoad = parseFloat(setLoads[0] || '0');
            }
          } else if (originalBlock.targetLoads && originalBlock.targetLoads.length > 0) {
            targetLoad = parseFloat(originalBlock.targetLoads[set.setNum - 1] || originalBlock.targetLoads[0] || '0');
          }
        }

        // Target reps
        let targetReps = 0;
        if (originalBlock) {
          if (originalBlock.technique === 'Normale') {
            targetReps = parseFloat(originalBlock.repsBase || '0');
          } else if (originalBlock.techniqueSchema) {
            const clusters = originalBlock.techniqueSchema.split('+').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
            if (set.clusterNum && clusters.length >= set.clusterNum) {
              targetReps = clusters[set.clusterNum - 1] || 0;
            } else if (clusters.length > 0) {
              targetReps = clusters[0] || 0;
            }
          }
        }

        const setLabel = mode === 'normal'
          ? `${session.date}\nS${set.setNum}`
          : `${session.date}\nS${set.setNum}.${set.clusterNum}`;

        return {
          name: setLabel,
          targetLoad: Math.round(targetLoad * 10) / 10,
          actualLoad: Math.round(parseFloat(set.load || '0') * 10) / 10,
          targetReps: Math.round(targetReps),
          actualReps: Math.round(parseFloat(set.reps || '0') * 10) / 10,
          rpe: set.rpe ? Math.round(parseFloat(set.rpe) * 10) / 10 : 0,
        };
      });
    });
  }, [sessions, mode, weeks]);

  const metricLabels = {
    load: 'Carico (kg)',
    reps: 'Ripetizioni',
  };

  const yAxisLabel = metricLabels[metricType];

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h4 className="text-sm font-semibold">Grafico Progressione (Set per Set)</h4>

        {/* Metric Toggle */}
        <div className="flex gap-1 bg-secondary rounded-md p-1">
          <button
            onClick={() => setMetricType('load')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              metricType === 'load'
                ? 'bg-primary text-primary-foreground'
                : 'text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Carico
          </button>
          <button
            onClick={() => setMetricType('reps')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              metricType === 'reps'
                ? 'bg-primary text-primary-foreground'
                : 'text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Reps
          </button>
        </div>
      </div>

      <div className="h-[300px] sm:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fontSize: 9 }}
            />
            <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
            <Tooltip
              content={({ payload }) => {
                if (!payload || payload.length === 0) return null;
                const data = payload[0].payload;

                const targetValue = metricType === 'load' ? data.targetLoad : data.targetReps;
                const actualValue = metricType === 'load' ? data.actualLoad : data.actualReps;
                const unit = metricType === 'load' ? 'kg' : '';

                const diff = actualValue - targetValue;
                const diffPercent = targetValue > 0 ? ((diff / targetValue) * 100).toFixed(1) : '0';
                const diffColor = diff >= 0 ? 'text-green-600' : 'text-red-600';
                const diffSign = diff >= 0 ? '+' : '';

                return (
                  <div className="bg-background border-2 rounded-lg p-3 shadow-xl min-w-[200px]">
                    <p className="font-bold text-sm mb-2">{data.name}</p>

                    <div className="space-y-1">
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
                if (value === 'Programma') return '📋 Programma';
                if (value === 'Eseguito') return '✓ Eseguito';
                return value;
              }}
            />

            <Bar
              dataKey={metricType === 'load' ? 'targetLoad' : 'targetReps'}
              name="Programma"
              fill="hsl(221.2 83.2% 53.3%)"
              stroke="hsl(221.2 83.2% 43.3%)"
              strokeWidth={1.5}
              radius={[4, 4, 0, 0]}
              opacity={0.85}
            />

            <Bar
              dataKey={metricType === 'load' ? 'actualLoad' : 'actualReps'}
              name="Eseguito"
              fill="hsl(142.1 76.2% 36.3%)"
              stroke="hsl(142.1 76.2% 26.3%)"
              strokeWidth={1.5}
              radius={[4, 4, 0, 0]}
              opacity={0.85}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
