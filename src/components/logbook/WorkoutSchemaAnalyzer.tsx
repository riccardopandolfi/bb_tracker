import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { NormalSetsFilters } from './schema-analyzer/NormalSetsFilters';
import { SpecialTechniqueFilters } from './schema-analyzer/SpecialTechniqueFilters';
import { SchemaProgressionChart } from './schema-analyzer/SchemaProgressionChart';
import { SchemaDetailTable } from './schema-analyzer/SchemaDetailTable';
import { getExerciseBlocks } from '@/lib/exerciseUtils';

type AnalysisMode = 'normal' | 'special';

export interface NormalSetsConfig {
  sets: number;
  reps: number;
}

export interface SpecialTechniqueConfig {
  technique: string;
  totalSets: number;
  intraSetsPerSet: number;
  repsPerIntraSet: number[];
  allowVariants: boolean;
}

export interface WorkoutSchemaFilters {
  mode: AnalysisMode;
  exercise: string;
  weeks: number[];
  normalConfig?: NormalSetsConfig;
  specialConfig?: SpecialTechniqueConfig;
  groupByWeek: boolean;
}

export function WorkoutSchemaAnalyzer() {
  const { loggedSessions, getCurrentWeeks, currentProgramId } = useApp();

  const [mode, setMode] = useState<AnalysisMode>('normal');
  const [filters, setFilters] = useState<WorkoutSchemaFilters>({
    mode: 'normal',
    exercise: '',
    weeks: [],
    groupByWeek: true,
  });

  // Filtra le sessioni in base ai filtri
  const filteredSessions = useMemo(() => {
    if (!filters.exercise || currentProgramId === null) return [];

    const weeks = getCurrentWeeks();

    // Helper per ottenere il blocco originale dal programma
    const getOriginalBlock = (session: any) => {
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

    // Filtra solo le sessioni del programma attivo
    let sessions = loggedSessions.filter(
      s => s.exercise === filters.exercise && s.programId === currentProgramId
    );

    // Filtra per settimane se specificate
    if (filters.weeks.length > 0) {
      sessions = sessions.filter(s => filters.weeks.includes(s.weekNum));
    }

    // Applica filtri specifici per modalità - BASATI SUL PROGRAMMA ORIGINALE
    if (mode === 'normal' && filters.normalConfig) {
      const { sets, reps } = filters.normalConfig;

      sessions = sessions.filter(s => {
        // Ottieni il blocco originale dal programma
        const originalBlock = getOriginalBlock(s);
        if (!originalBlock) return false;

        // Deve essere tecnica normale nel programma
        if (originalBlock.technique !== 'Normale') return false;

        // Verifica i set programmati
        const programSets = originalBlock.sets || 0;
        if (programSets !== sets) return false;

        // Verifica le rep programmate
        const programReps = parseFloat(originalBlock.repsBase || '0');
        return programReps === reps;
      });
    } else if (mode === 'special' && filters.specialConfig) {
      const { technique, totalSets, intraSetsPerSet, repsPerIntraSet, allowVariants } = filters.specialConfig;

      sessions = sessions.filter(s => {
        // Ottieni il blocco originale dal programma
        const originalBlock = getOriginalBlock(s);
        if (!originalBlock) return false;

        // Deve essere la tecnica corretta nel programma
        if (originalBlock.technique !== technique) return false;

        // Verifica i set programmati
        const programSets = originalBlock.sets || 0;
        if (programSets !== totalSets) return false;

        // Verifica lo schema delle rep programmato
        if (originalBlock.techniqueSchema) {
          const schemaReps = originalBlock.techniqueSchema.split('+').map(r => parseInt(r.trim(), 10));

          // Verifica che il numero di intra-set corrisponda
          if (schemaReps.length !== intraSetsPerSet) return false;

          if (allowVariants) {
            // Permetti varianti ±1 rep
            return schemaReps.every((r, i) =>
              Math.abs(r - (repsPerIntraSet[i] || 0)) <= 1
            );
          } else {
            // Match esatto
            return schemaReps.every((r, i) => r === (repsPerIntraSet[i] || 0));
          }
        }

        return false;
      });
    }

    return sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [loggedSessions, filters, mode, getCurrentWeeks, currentProgramId]);

  const handleModeChange = (newMode: AnalysisMode) => {
    setMode(newMode);
    setFilters(prev => ({
      ...prev,
      mode: newMode,
      normalConfig: undefined,
      specialConfig: undefined,
    }));
  };

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-base sm:text-lg">Analisi Schema di Lavoro</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Analizza le tue progressioni per schemi di lavoro specifici
        </CardDescription>

        {/* Mode Toggle */}
        <div className="flex gap-2 mt-3 sm:mt-4">
          <button
            onClick={() => handleModeChange('normal')}
            className={`flex-1 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${mode === 'normal'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
          >
            Set Normali
          </button>
          <button
            onClick={() => handleModeChange('special')}
            className={`flex-1 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${mode === 'special'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
          >
            Tecniche Speciali
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6">
        {/* Filtri specifici per modalità */}
        {mode === 'normal' ? (
          <NormalSetsFilters filters={filters} setFilters={setFilters} />
        ) : (
          <SpecialTechniqueFilters filters={filters} setFilters={setFilters} />
        )}

        {/* Risultati */}
        {filters.exercise &&
          ((mode === 'normal' && filters.normalConfig?.sets && filters.normalConfig?.reps) ||
            (mode === 'special' && filters.specialConfig?.technique && filters.specialConfig?.totalSets)) && (
            <>
              {filteredSessions.length > 0 ? (
                <>
                  <SchemaProgressionChart sessions={filteredSessions} filters={filters} mode={mode} />
                  <SchemaDetailTable sessions={filteredSessions} mode={mode} />
                </>
              ) : (
                <div className="text-center py-8 sm:py-12 text-muted-foreground">
                  <p className="text-sm sm:text-base">
                    Nessuna sessione trovata con questi criteri.
                  </p>
                  <p className="text-xs sm:text-sm mt-2">
                    Verifica di aver selezionato almeno una settimana.
                  </p>
                </div>
              )}
            </>
          )}

        {/* Messaggio quando i filtri non sono completi */}
        {filters.exercise &&
          !((mode === 'normal' && filters.normalConfig?.sets && filters.normalConfig?.reps) ||
            (mode === 'special' && filters.specialConfig?.technique && filters.specialConfig?.totalSets)) && (
            <div className="text-center py-8 sm:py-12 text-muted-foreground">
              <p className="text-sm sm:text-base">
                Compila tutti i filtri per vedere i risultati
              </p>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
