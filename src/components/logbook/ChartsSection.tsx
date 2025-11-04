import { VolumeByMuscleChart } from './charts/VolumeByMuscleChart';
import { LoadProgressionChart } from './charts/LoadProgressionChart';

export function ChartsSection() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
        <div>
          <h3 className="text-lg sm:text-xl font-bold">Grafici e Progressioni</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">Analisi visiva dei tuoi allenamenti</p>
        </div>
      </div>

      {/* Chart 1: Volume by Muscle */}
      <VolumeByMuscleChart />

      {/* Chart 2: Parametrized Progression */}
      <LoadProgressionChart />
    </div>
  );
}
