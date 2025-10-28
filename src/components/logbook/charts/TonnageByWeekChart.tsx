import { LoggedSession } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TonnageByWeekChartProps {
  filteredSessions: LoggedSession[];
}

export function TonnageByWeekChart({ filteredSessions }: TonnageByWeekChartProps) {
  const tonnageByWeek = filteredSessions.reduce((acc, session) => {
    const weekKey = `W${session.weekNum}`;
    acc[weekKey] = (acc[weekKey] || 0) + session.totalTonnage;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(tonnageByWeek)
    .map(([week, tonnage]) => ({
      week,
      tonnage: Math.round(tonnage),
    }))
    .sort((a, b) => {
      const aNum = parseInt(a.week.replace('W', ''), 10);
      const bNum = parseInt(b.week.replace('W', ''), 10);
      return aNum - bNum;
    });

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tonnellaggio nel Tempo</CardTitle>
          <CardDescription>Tonnellaggio totale per settimana</CardDescription>
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
        <CardTitle>Tonnellaggio nel Tempo</CardTitle>
        <CardDescription>Tonnellaggio totale per settimana (da sessioni loggate)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="tonnage" fill="hsl(24.6 95% 53.1%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
