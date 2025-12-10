import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { NormalSetsFilters } from './schema-analyzer/NormalSetsFilters';
import { SpecialTechniqueFilters } from './schema-analyzer/SpecialTechniqueFilters';
import { SchemaProgressionChart } from './schema-analyzer/SchemaProgressionChart';
import { SchemaDetailTable } from './schema-analyzer/SchemaDetailTable';
import { getExerciseBlocks } from '@/lib/exerciseUtils';
import { AD_HOC_TECHNIQUE } from '@/types';

type AnalysisMode = 'normal' | 'special' | 'adhoc';

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
    
    // Per modalità Ad Hoc: filtra solo sessioni con tecnica Ad Hoc
    if (mode === 'adhoc') {
      sessions = sessions.filter(s => s.technique === AD_HOC_TECHNIQUE);
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
    <Card className="card-monetra">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-base sm:text-lg">Analisi Schema di Lavoro</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Analizza le tue progressioni per schemi di lavoro specifici
        </CardDescription>

        {/* Mode Toggle */}
        <div className="flex gap-2 mt-3 sm:mt-4">
          <button
            onClick={() => handleModeChange('normal')}
            className={`flex-1 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors border-2 ${mode === 'normal'
                ? 'border-primary/40 bg-primary/5 text-black'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
          >
            Set Normali
          </button>
          <button
            onClick={() => handleModeChange('special')}
            className={`flex-1 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors border-2 ${mode === 'special'
                ? 'border-primary/40 bg-primary/5 text-black'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
          >
            Tecniche Speciali
          </button>
          <button
            onClick={() => handleModeChange('adhoc')}
            className={`flex-1 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors border-2 ${mode === 'adhoc'
                ? 'border-amber-400 bg-amber-50 text-amber-900'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
          >
            📝 Ad Hoc
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6">
        {/* Filtri specifici per modalità */}
        {mode === 'normal' ? (
          <NormalSetsFilters filters={filters} setFilters={setFilters} />
        ) : mode === 'special' ? (
          <SpecialTechniqueFilters filters={filters} setFilters={setFilters} />
        ) : (
          /* Filtri per Ad Hoc - solo esercizio e settimane */
          <div className="space-y-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800 mb-4">
              📝 Le sessioni Ad Hoc contengono log testuali liberi. Seleziona un esercizio per vedere lo storico.
            </p>
            <NormalSetsFilters filters={filters} setFilters={setFilters} hideConfig />
          </div>
        )}

        {/* Risultati */}
        {filters.exercise &&
          ((mode === 'normal' && filters.normalConfig?.sets && filters.normalConfig?.reps) ||
            (mode === 'special' && filters.specialConfig?.technique && filters.specialConfig?.totalSets) ||
            mode === 'adhoc') && (
            <>
              {filteredSessions.length > 0 ? (
                mode === 'adhoc' ? (
                  /* Visualizzazione speciale per Ad Hoc: tabella con data, schema, log */
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-amber-900">Storico Sessioni Ad Hoc</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-amber-100 text-amber-900">
                            <th className="px-3 py-2 text-left font-medium">Data</th>
                            <th className="px-3 py-2 text-left font-medium">Week</th>
                            <th className="px-3 py-2 text-left font-medium">Schema</th>
                            <th className="px-3 py-2 text-left font-medium">Log</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSessions.map((session, idx) => (
                            <tr key={session.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}>
                              <td className="px-3 py-2 whitespace-nowrap">
                                {new Date(session.date).toLocaleDateString('it-IT')}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">W{session.weekNum}</td>
                              <td className="px-3 py-2 max-w-xs">
                                <div className="whitespace-pre-wrap text-gray-600">
                                  {session.adHocSchema || session.techniqueSchema || '-'}
                                </div>
                              </td>
                              <td className="px-3 py-2 max-w-md">
                                <div className="whitespace-pre-wrap">
                                  {session.logText || '-'}
                                </div>
                                {session.notes && (
                                  <div className="text-xs text-gray-500 italic mt-1">
                                    Note: {session.notes}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                <>
                  <SchemaProgressionChart sessions={filteredSessions} filters={filters} mode={mode} />
                  <SchemaDetailTable sessions={filteredSessions} mode={mode} />
                </>
                )
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
            (mode === 'special' && filters.specialConfig?.technique && filters.specialConfig?.totalSets) ||
            mode === 'adhoc') && (
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
