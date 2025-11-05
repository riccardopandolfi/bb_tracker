import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BarChart, Bar, XAxis, CartesianGrid } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { Folder, TrendingUp } from 'lucide-react';

export function MacrosTab() {
  const { programs, setMacros } = useApp();

  // State per i selettori
  const [selectedProgramId, setSelectedProgramId] = useState<number>(
    Object.keys(programs).length > 0 ? Number(Object.keys(programs)[0]) : 1
  );
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  if (!programs || Object.keys(programs).length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Macronutrienti</h2>
            <p className="text-muted-foreground">Caricamento...</p>
          </div>
        </div>
      </div>
    );
  }

  const programList = Object.values(programs).sort((a, b) => a.id - b.id);
  const selectedProgram = programs[selectedProgramId];

  if (!selectedProgram) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Macronutrienti</h2>
            <p className="text-muted-foreground">Nessun programma trovato</p>
          </div>
        </div>
      </div>
    );
  }

  const weekNumbers = Object.keys(selectedProgram.weeks || {})
    .map(Number)
    .sort((a, b) => a - b);

  // Macros della settimana selezionata
  const currentMacros = selectedProgram.macros?.[selectedWeek] || {
    kcal: '',
    protein: '',
    carbs: '',
    fat: '',
    notes: '',
  };

  // Prepara dati per il grafico
  const chartData = weekNumbers.map((weekNum) => {
    const weekMacros = selectedProgram.macros?.[weekNum];
    return {
      week: `W${weekNum}`,
      Proteine: weekMacros?.protein ? parseFloat(weekMacros.protein) : 0,
      Carboidrati: weekMacros?.carbs ? parseFloat(weekMacros.carbs) : 0,
      Grassi: weekMacros?.fat ? parseFloat(weekMacros.fat) : 0,
    };
  });

  // Configurazione del grafico
  const chartConfig = {
    Proteine: {
      label: 'Proteine',
      color: 'hsl(221.2 83.2% 53.3%)',
    },
    Carboidrati: {
      label: 'Carboidrati',
      color: 'hsl(142.1 76.2% 36.3%)',
    },
    Grassi: {
      label: 'Grassi',
      color: 'hsl(24.6 95% 53.1%)',
    },
  } satisfies ChartConfig;

  const handleChange = (field: string, value: string) => {
    setMacros(selectedWeek, {
      ...currentMacros,
      [field]: value,
    }, selectedProgramId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Macronutrienti</h2>
          <p className="text-muted-foreground">Traccia e visualizza i tuoi macronutrienti per programma e settimana</p>
        </div>
      </div>

      {/* Selettori Programma e Settimana */}
      <Card>
        <CardHeader>
          <CardTitle>Seleziona Programma e Settimana</CardTitle>
          <CardDescription>Scegli il programma e la settimana per cui vuoi gestire i macros</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Selettore Programma */}
            <div className="space-y-2">
              <Label htmlFor="program-select">Programma</Label>
              <Select
                value={selectedProgramId.toString()}
                onValueChange={(v) => {
                  setSelectedProgramId(Number(v));
                  setSelectedWeek(1); // Reset alla settimana 1 quando cambi programma
                }}
              >
                <SelectTrigger id="program-select">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4" />
                      {selectedProgram.name}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {programList.map((program) => (
                    <SelectItem key={program.id} value={program.id.toString()}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selettore Settimana */}
            <div className="space-y-2">
              <Label htmlFor="week-select">Settimana</Label>
              <Select
                value={selectedWeek.toString()}
                onValueChange={(v) => setSelectedWeek(Number(v))}
              >
                <SelectTrigger id="week-select">
                  <SelectValue>Settimana {selectedWeek}</SelectValue>
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
          </div>
        </CardContent>
      </Card>

      {/* Form Macros */}
      <Card>
        <CardHeader>
          <CardTitle>Macronutrienti - Settimana {selectedWeek}</CardTitle>
          <CardDescription>Inserisci i tuoi obiettivi di macronutrienti per questa settimana</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="kcal">Kcal</Label>
              <Input
                id="kcal"
                type="number"
                placeholder="es. 2500"
                value={currentMacros.kcal}
                onChange={(e) => handleChange('kcal', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein">Proteine (g)</Label>
              <Input
                id="protein"
                type="number"
                placeholder="es. 180"
                value={currentMacros.protein}
                onChange={(e) => handleChange('protein', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs">Carboidrati (g)</Label>
              <Input
                id="carbs"
                type="number"
                placeholder="es. 300"
                value={currentMacros.carbs}
                onChange={(e) => handleChange('carbs', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat">Grassi (g)</Label>
              <Input
                id="fat"
                type="number"
                placeholder="es. 70"
                value={currentMacros.fat}
                onChange={(e) => handleChange('fat', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              placeholder="Note sulla dieta, timing, etc..."
              value={currentMacros.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Grafico Trend Macronutrienti */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-black" />
            <CardTitle>Trend Macronutrienti</CardTitle>
          </div>
          <CardDescription>
            Visualizzazione del trend dei macronutrienti per tutte le settimane del programma "{selectedProgram.name}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 || chartData.every(d => d.Proteine === 0 && d.Carboidrati === 0 && d.Grassi === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-center">
                Nessun dato disponibile. Inserisci i macronutrienti per vedere il trend.
              </p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="week"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dashed" />}
                />
                <Bar dataKey="Proteine" fill="var(--color-Proteine)" radius={4} />
                <Bar dataKey="Carboidrati" fill="var(--color-Carboidrati)" radius={4} />
                <Bar dataKey="Grassi" fill="var(--color-Grassi)" radius={4} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
