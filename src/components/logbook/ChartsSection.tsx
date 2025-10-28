import { LoggedSession } from '@/types';
import { VolumeByWeekChart } from './charts/VolumeByWeekChart';
import { VolumeByMuscleChart } from './charts/VolumeByMuscleChart';
import { TonnageByWeekChart } from './charts/TonnageByWeekChart';
import { RPEOverTimeChart } from './charts/RPEOverTimeChart';
import { LoadProgressionChart } from './charts/LoadProgressionChart';

interface ChartsSectionProps {
  filteredSessions: LoggedSession[];
}

export function ChartsSection({ filteredSessions }: ChartsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">Grafici e Progressioni</h3>
          <p className="text-sm text-muted-foreground">Analisi visiva dei tuoi allenamenti</p>
        </div>
      </div>

      {/* Chart 1: Volume by Week */}
      <VolumeByWeekChart />

      {/* Chart 2: Volume by Muscle */}
      <VolumeByMuscleChart />

      {/* Chart 3: Tonnage by Week */}
      <TonnageByWeekChart filteredSessions={filteredSessions} />

      {/* Chart 4: RPE Over Time */}
      <RPEOverTimeChart filteredSessions={filteredSessions} />

      {/* Chart 5: Load Progression */}
      <LoadProgressionChart />
    </div>
  );
}
