import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { BarChart, Bar, XAxis, YAxis } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '../../ui/chart';
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
      fill: MUSCLE_COLORS[muscle] || '#6b7280',
    }));

  const uniqueMuscles = Object.keys(volumeData.byMuscle);

  // Create chart config dynamically
  const chartConfig: ChartConfig = {
    volume: {
      label: "Volume",
    },
  };

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-base sm:text-lg">Volume per Gruppo Muscolare</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Distribuzione del volume per muscolo</CardDescription>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 mt-3 sm:mt-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Settimana</Label>
            <Select value={selectedWeek.toString()} onValueChange={(v) => setSelectedWeek(Number(v))}>
              <SelectTrigger className="text-xs sm:text-sm">
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
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Muscolo</Label>
            <Select value={selectedMuscle} onValueChange={setSelectedMuscle}>
              <SelectTrigger className="text-xs sm:text-sm">
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
      <CardContent className="px-2 sm:px-6">
        <ChartContainer config={chartConfig} className="h-[300px] sm:h-[400px] w-full">
          <BarChart
            accessibilityLayer
            data={muscleData}
            layout="vertical"
            margin={{
              left: 5,
              right: 10,
            }}
          >
            <XAxis
              type="number"
              dataKey="volume"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={5}
              axisLine={false}
              width={100}
              tick={{ fontSize: 10 }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="volume" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
