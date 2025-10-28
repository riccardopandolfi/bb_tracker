import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Info, TrendingUp, Scale, Zap, Users } from 'lucide-react';
import { calculateVolume, calculateRealTonnage } from '@/lib/calculations';

export function VolumeSummary() {
  const { currentWeek, weeks, exercises, loggedSessions } = useApp();
  const week = weeks[currentWeek];

  const volumeData = calculateVolume(week, exercises);
  const realTonnage = calculateRealTonnage(loggedSessions, currentWeek);

  const musclesSorted = Object.entries(volumeData.byMuscle).sort(
    ([, a], [, b]) => b.volume - a.volume
  );

  return (
    <div className="space-y-4">
      {/* Info Box */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Volume = Sets × Coefficient</strong> - Il volume NON dipende dalle reps!
        </AlertDescription>
      </Alert>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume (A Priori)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{volumeData.total.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Sets × Coefficient</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tonnellaggio Reale</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTonnage.toFixed(0)} kg</div>
            <p className="text-xs text-muted-foreground">Da sessioni loggate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RPE Stimato</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{volumeData.estimatedRPE.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Media da coefficient</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Muscoli</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{volumeData.muscleCount}</div>
            <p className="text-xs text-muted-foreground">Gruppi allenati</p>
          </CardContent>
        </Card>
      </div>

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
