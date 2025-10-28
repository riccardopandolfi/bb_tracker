import { LoggedSession } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface RPEOverTimeChartProps {
  filteredSessions: LoggedSession[];
}

export function RPEOverTimeChart({ filteredSessions }: RPEOverTimeChartProps) {
  const sortedSessions = [...filteredSessions]
    .filter((s) => s.avgRPE > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const data = sortedSessions.map((s) => ({
    date: s.date,
    rpe: s.avgRPE,
    label: `${s.exercise.substring(0, 15)}... (${s.totalReps}/${s.targetReps})`,
  }));

  const getRPEColor = (rpe: number) => {
    if (rpe < 7) return 'hsl(142.1 76.2% 36.3%)'; // green
    if (rpe < 8) return 'hsl(47.9 95.8% 53.1%)'; // yellow
    if (rpe < 9) return 'hsl(24.6 95% 53.1%)'; // orange
    return 'hsl(0 84.2% 60.2%)'; // red
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>RPE Reale nel Tempo</CardTitle>
          <CardDescription>RPE medio per sessione</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">Nessun dato disponibile</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>RPE Reale nel Tempo</CardTitle>
        <CardDescription>RPE medio per ogni sessione loggata</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 10]} />
              <YAxis dataKey="date" type="category" width={100} />
              <Tooltip
                content={({ payload }) => {
                  if (!payload || payload.length === 0) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border rounded p-2 shadow-lg">
                      <p className="font-bold">{data.date}</p>
                      <p className="text-sm">{data.label}</p>
                      <p className="text-sm">RPE: {data.rpe.toFixed(1)}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="rpe" radius={[0, 8, 8, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getRPEColor(entry.rpe)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
