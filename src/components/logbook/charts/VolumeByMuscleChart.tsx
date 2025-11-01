import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { calculateVolume } from '@/lib/calculations';
import { MUSCLE_COLORS } from '@/lib/constants';

export function VolumeByMuscleChart() {
  const { getCurrentWeeks, exercises, currentWeek } = useApp();
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [selectedMuscle, setSelectedMuscle] = useState('all');

  const weeks = getCurrentWeeks();
  const weekNumbers = Object.keys(weeks)
    .map(Number)
    .sort((a, b) => a - b);

  // Calculate volume on every render to ensure updates
  const volumeData = calculateVolume(weeks[selectedWeek], exercises);

  const muscleData = Object.entries(volumeData.byMuscle)
    .filter(([muscle]) => selectedMuscle === 'all' || muscle === selectedMuscle)
    .sort(([, a], [, b]) => b.volume - a.volume)
    .map(([muscle, data]) => ({
      name: muscle,
      volume: parseFloat(data.volume.toFixed(1)),
    }));

  const uniqueMuscles = Object.keys(volumeData.byMuscle);

  // Helper function to get muscle color
  const getMuscleColor = (muscleName: string): string => {
    return MUSCLE_COLORS[muscleName] || '#6b7280'; // gray-500 as fallback
  };

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
                {muscleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getMuscleColor(entry.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
