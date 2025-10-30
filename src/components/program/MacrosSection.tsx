import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

export function MacrosSection() {
  const { currentWeek, getCurrentMacros, setMacros } = useApp();
  const macros = getCurrentMacros();
  const weekMacros = macros[currentWeek] || {
    kcal: '',
    protein: '',
    carbs: '',
    fat: '',
    notes: '',
  };

  const handleChange = (field: string, value: string) => {
    setMacros(currentWeek, {
      ...weekMacros,
      [field]: value,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nutrizione e Macronutrienti</CardTitle>
        <CardDescription>Traccia i tuoi macro per la settimana {currentWeek}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="kcal">Kcal</Label>
            <Input
              id="kcal"
              placeholder="es. 2500"
              value={weekMacros.kcal}
              onChange={(e) => handleChange('kcal', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="protein">Proteine (g)</Label>
            <Input
              id="protein"
              placeholder="es. 180"
              value={weekMacros.protein}
              onChange={(e) => handleChange('protein', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carbs">Carboidrati (g)</Label>
            <Input
              id="carbs"
              placeholder="es. 300"
              value={weekMacros.carbs}
              onChange={(e) => handleChange('carbs', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fat">Grassi (g)</Label>
            <Input
              id="fat"
              placeholder="es. 70"
              value={weekMacros.fat}
              onChange={(e) => handleChange('fat', e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Note</Label>
          <Textarea
            id="notes"
            placeholder="Note sulla dieta, timing, etc..."
            value={weekMacros.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
