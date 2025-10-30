import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { calculateVolume } from '@/lib/calculations';

export function VolumeByWeekChart() {
  const { getCurrentWeeks, exercises } = useApp();

  const weeks = getCurrentWeeks();
  const weekNumbers = Object.keys(weeks)
    .map(Number)
    .sort((a, b) => a - b);

  const data = weekNumbers.map((weekNum) => {
    const vol = calculateVolume(weeks[weekNum], exercises);
    return {
      week: `W${weekNum}`,
      volume: vol.total,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volume Totale per Settimana</CardTitle>
        <CardDescription>Volume pianificato (Sets × Coefficient)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="volume" fill="hsl(262.1 83.3% 57.8%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
