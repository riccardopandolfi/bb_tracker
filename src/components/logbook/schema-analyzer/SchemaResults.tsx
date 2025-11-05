import { useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { LoggedSession } from '@/types';
import { WorkoutSchemaFilters } from '../WorkoutSchemaAnalyzer';
import { format } from 'date-fns';
import { getExerciseBlocks } from '@/lib/exerciseUtils';

interface SchemaResultsProps {
  sessions: LoggedSession[];
  filters: WorkoutSchemaFilters;
  mode: 'normal' | 'special';
}

export function SchemaResults({ sessions, filters, mode }: SchemaResultsProps) {
  const { getCurrentWeeks } = useApp();
  const weeks = getCurrentWeeks();

  // Calculate statistics
  const stats = useMemo(() => {
    if (sessions.length === 0) return null;

    // Get program data for each session
    const getOriginalBlock = (session: LoggedSession) => {
      const week = weeks[session.weekNum];
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

    let totalTargetLoad = 0;
    let totalActualLoad = 0;
    let totalTargetReps = 0;
    let totalActualReps = 0;
    let totalSets = 0;

    const firstSession = sessions[0];
    const lastSession = sessions[sessions.length - 1];

    sessions.forEach(session => {
      const originalBlock = getOriginalBlock(session);

      session.sets.forEach(set => {
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

        totalTargetLoad += targetLoad;
        totalActualLoad += parseFloat(set.load || '0');
        totalTargetReps += targetReps;
        totalActualReps += parseFloat(set.reps || '0');
        totalSets++;
      });
    });

    const avgTargetLoad = totalSets > 0 ? totalTargetLoad / totalSets : 0;
    const avgActualLoad = totalSets > 0 ? totalActualLoad / totalSets : 0;
    const avgTargetReps = totalSets > 0 ? totalTargetReps / totalSets : 0;
    const avgActualReps = totalSets > 0 ? totalActualReps / totalSets : 0;

    const loadProgress = avgTargetLoad > 0 ? ((avgActualLoad - avgTargetLoad) / avgTargetLoad) * 100 : 0;
    const repsProgress = avgTargetReps > 0 ? ((avgActualReps - avgTargetReps) / avgTargetReps) * 100 : 0;

    // Progression from first to last
    const firstAvgLoad = firstSession.sets.reduce((sum, set) => sum + parseFloat(set.load || '0'), 0) / firstSession.sets.length;
    const lastAvgLoad = lastSession.sets.reduce((sum, set) => sum + parseFloat(set.load || '0'), 0) / lastSession.sets.length;
    const overallLoadProgress = firstAvgLoad > 0 ? ((lastAvgLoad - firstAvgLoad) / firstAvgLoad) * 100 : 0;

    return {
      totalSessions: sessions.length,
      firstDate: firstSession.date,
      lastDate: lastSession.date,
      weeks: Array.from(new Set(sessions.map(s => s.weekNum))).sort((a, b) => a - b),
      avgTargetLoad: Math.round(avgTargetLoad * 10) / 10,
      avgActualLoad: Math.round(avgActualLoad * 10) / 10,
      avgTargetReps: Math.round(avgTargetReps),
      avgActualReps: Math.round(avgActualReps * 10) / 10,
      loadProgress: Math.round(loadProgress * 10) / 10,
      repsProgress: Math.round(repsProgress * 10) / 10,
      firstAvgLoad: Math.round(firstAvgLoad * 10) / 10,
      lastAvgLoad: Math.round(lastAvgLoad * 10) / 10,
      overallLoadProgress: Math.round(overallLoadProgress * 10) / 10,
    };
  }, [sessions, weeks]);

  if (!stats) return null;

  // Format schema description
  const schemaDescription = mode === 'normal' && filters.normalConfig
    ? `${filters.normalConfig.sets}x${filters.normalConfig.reps}`
    : mode === 'special' && filters.specialConfig
    ? `${filters.specialConfig.technique} ${filters.specialConfig.totalSets}x(${filters.specialConfig.repsPerIntraSet.join('+')})`
    : '';

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="space-y-2">
        <h4 className="text-sm sm:text-base font-bold text-blue-900">
          🎯 {stats.totalSessions} sessioni trovate per: {filters.exercise} {schemaDescription}
        </h4>
        <p className="text-xs sm:text-sm text-muted-foreground">
          📅 Periodo: {format(new Date(stats.firstDate), 'dd MMM yyyy')} → {format(new Date(stats.lastDate), 'dd MMM yyyy')} ({stats.weeks.length} settimane)
        </p>
        {stats.weeks.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Week {stats.weeks.join(', ')}
          </p>
        )}
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Load Statistics */}
        <div className="bg-white rounded-lg border p-3 space-y-2">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase">
            📊 Statistiche Carico
          </h5>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-blue-600">Medio Programmato:</span>
              <span className="font-bold">{stats.avgTargetLoad} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600">Medio Eseguito:</span>
              <span className="font-bold">{stats.avgActualLoad} kg</span>
            </div>
            <div className="flex justify-between pt-1 border-t">
              <span>Differenza:</span>
              <span className={`font-bold ${stats.loadProgress >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.loadProgress >= 0 ? '+' : ''}{stats.loadProgress}%
              </span>
            </div>
          </div>
        </div>

        {/* Reps Statistics */}
        <div className="bg-white rounded-lg border p-3 space-y-2">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase">
            📊 Statistiche Ripetizioni
          </h5>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-blue-600">Medie Programmate:</span>
              <span className="font-bold">{stats.avgTargetReps}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600">Medie Eseguite:</span>
              <span className="font-bold">{stats.avgActualReps}</span>
            </div>
            <div className="flex justify-between pt-1 border-t">
              <span>Differenza:</span>
              <span className={`font-bold ${stats.repsProgress >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.repsProgress >= 0 ? '+' : ''}{stats.repsProgress}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progression */}
      <div className="bg-white rounded-lg border p-3">
        <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
          📈 Progressione Complessiva
        </h5>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between items-center">
            <span>Week {stats.weeks[0]}: <span className="font-bold">{stats.firstAvgLoad} kg</span></span>
            <span className="text-muted-foreground">→</span>
            <span>Week {stats.weeks[stats.weeks.length - 1]}: <span className="font-bold">{stats.lastAvgLoad} kg</span></span>
          </div>
          <div className="flex justify-between pt-1 border-t">
            <span>Incremento:</span>
            <span className={`font-bold ${stats.overallLoadProgress >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.overallLoadProgress >= 0 ? '+' : ''}{stats.lastAvgLoad - stats.firstAvgLoad} kg ({stats.overallLoadProgress >= 0 ? '+' : ''}{stats.overallLoadProgress}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
