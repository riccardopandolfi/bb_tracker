import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { REP_RANGES, TECHNIQUES } from '@/types';
import { TrendingUp } from 'lucide-react';

export function LoadProgressionChart() {
  const { loggedSessions, exercises } = useApp();
  const [selectedExercise, setSelectedExercise] = useState('');
  const [selectedRepRange, setSelectedRepRange] = useState('');
  const [selectedTechnique, setSelectedTechnique] = useState('');

  const uniqueExercises = Array.from(new Set(exercises.map((e) => e.name)));

  const filteredSessions = loggedSessions.filter((s) => {
    if (selectedExercise && s.exercise !== selectedExercise) return false;
    if (selectedRepRange && s.repRange !== selectedRepRange) return false;
    if (selectedTechnique && s.technique !== selectedTechnique) return false;
    return true;
  });

  const sortedSessions = [...filteredSessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const data = sortedSessions.map((s) => {
    const avgLoad =
      s.sets.reduce((sum, set) => sum + parseFloat(set.load || '0'), 0) / s.sets.length;

    return {
      date: s.date,
      week: `W${s.weekNum}`,
      avgLoad: Math.round(avgLoad * 10) / 10,
      totalReps: s.totalReps,
      avgRPE: s.avgRPE,
      exercise: s.exercise,
    };
  });

  const hasFilters = selectedExercise || selectedRepRange || selectedTechnique;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progressione Carico per Rep Range</CardTitle>
        <CardDescription>Traccia la tua progressione nel tempo</CardDescription>
        <div className="grid gap-4 md:grid-cols-3 mt-4">
          <div className="space-y-2">
            <Label>Esercizio</Label>
            <Select value={selectedExercise || 'all'} onValueChange={(v) => setSelectedExercise(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona esercizio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                {uniqueExercises.map((exercise) => (
                  <SelectItem key={exercise} value={exercise}>
                    {exercise}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Rep Range</Label>
            <Select value={selectedRepRange || 'all'} onValueChange={(v) => setSelectedRepRange(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Tutti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                {Object.keys(REP_RANGES).map((range) => (
                  <SelectItem key={range} value={range}>
                    {range}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tecnica</Label>
            <Select value={selectedTechnique || 'all'} onValueChange={(v) => setSelectedTechnique(v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Tutte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte</SelectItem>
                {TECHNIQUES.map((tech) => (
                  <SelectItem key={tech} value={tech}>
                    {tech}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasFilters || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-center">
              {!hasFilters
                ? 'Seleziona esercizio, rep range o tecnica per vedere la progressione'
                : 'Nessun dato disponibile con questi filtri'}
            </p>
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: 'Carico (kg)', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border rounded p-3 shadow-lg">
                        <p className="font-bold">{data.date}</p>
                        <p className="text-sm">{data.exercise}</p>
                        <p className="text-sm">Carico medio: {data.avgLoad} kg</p>
                        <p className="text-sm">Reps: {data.totalReps}</p>
                        <p className="text-sm">RPE: {data.avgRPE.toFixed(1)}</p>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avgLoad"
                  stroke="hsl(262.1 83.3% 57.8%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(262.1 83.3% 57.8%)', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
