import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { calculateVolume } from '@/lib/calculations';

export function VolumeByMuscleChart() {
  const { getCurrentWeeks, exercises, currentWeek } = useApp();
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [selectedMuscle, setSelectedMuscle] = useState('all');

  const weeks = getCurrentWeeks();
  const weekNumbers = Object.keys(weeks)
    .map(Number)
    .sort((a, b) => a - b);

  const volumeData = calculateVolume(weeks[selectedWeek], exercises);

  const muscleData = Object.entries(volumeData.byMuscle)
    .filter(([muscle]) => selectedMuscle === 'all' || muscle === selectedMuscle)
    .sort(([, a], [, b]) => b.volume - a.volume)
    .map(([muscle, data]) => ({
      name: muscle,
      volume: parseFloat(data.volume.toFixed(1)),
    }));

  const uniqueMuscles = Object.keys(volumeData.byMuscle);

  const COLORS = [
    'hsl(262.1 83.3% 57.8%)',
    'hsl(221.2 83.2% 53.3%)',
    'hsl(142.1 76.2% 36.3%)',
    'hsl(24.6 95% 53.1%)',
    'hsl(346.8 77.2% 49.8%)',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volume per Gruppo Muscolare</CardTitle>
        <CardDescription>Distribuzione del volume per muscolo</CardDescription>
        <div className="grid gap-4 md:grid-cols-2 mt-4">
          <div className="space-y-2">
            <Label>Settimana</Label>
            <Select value={selectedWeek.toString()} onValueChange={(v) => setSelectedWeek(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {weekNumbers.map((weekNum) => (
                  <SelectItem key={weekNum} value={weekNum.toString()}>
                    Settimana {weekNum}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Muscolo</Label>
            <Select value={selectedMuscle} onValueChange={setSelectedMuscle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                {uniqueMuscles.map((muscle) => (
                  <SelectItem key={muscle} value={muscle}>
                    {muscle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={muscleData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="volume" radius={[0, 8, 8, 0]}>
                {muscleData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
