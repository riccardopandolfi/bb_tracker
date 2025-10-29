import { VolumeByMuscleChart } from './charts/VolumeByMuscleChart';
import { LoadProgressionChart } from './charts/LoadProgressionChart';

export function ChartsSection() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">Grafici e Progressioni</h3>
          <p className="text-sm text-muted-foreground">Analisi visiva dei tuoi allenamenti</p>
        </div>
      </div>

      {/* Chart 1: Volume by Muscle */}
      <VolumeByMuscleChart />

      {/* Chart 2: Parametrized Progression */}
      <LoadProgressionChart />
    </div>
  );
}
