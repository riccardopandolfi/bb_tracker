import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { calculateVolume } from '@/lib/calculations';

export function VolumeSummary() {
  const { currentWeek, getCurrentWeeks, exercises } = useApp();
  const weeks = getCurrentWeeks();
  const week = weeks[currentWeek];

  const volumeData = calculateVolume(week, exercises);

  const musclesSorted = Object.entries(volumeData.byMuscle).sort(
    ([, a], [, b]) => b.volume - a.volume
  );

  return (
    <div className="space-y-4">
      {/* Volume by Muscle */}
      {musclesSorted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Volume per Gruppo Muscolare</CardTitle>
            <CardDescription>Distribuzione del volume nella settimana corrente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {musclesSorted.map(([muscle, data]) => (
                <div key={muscle} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{muscle}</div>
                    <div className="text-xs text-muted-foreground">RPE ~{data.estimatedRPE.toFixed(1)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-600">{data.volume.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">volume</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
