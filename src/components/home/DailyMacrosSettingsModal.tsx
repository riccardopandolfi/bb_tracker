import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { DayMacros } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Save, Calendar } from 'lucide-react';

const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

interface DailyMacrosSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DailyMacrosSettingsModal({ open, onOpenChange }: DailyMacrosSettingsModalProps) {
  const { dailyMacros, initializeDailyMacros, updateDailyMacros } = useApp();
  const [tempMacros, setTempMacros] = useState<DayMacros[]>([]);

  useEffect(() => {
    if (open) {
      if (dailyMacros) {
        // Carica i macro esistenti
        setTempMacros([...dailyMacros.days]);
      } else {
        // Inizializza con macro vuoti
        const emptyDays: DayMacros[] = Array(7).fill(null).map(() => ({
          kcal: '',
          protein: '',
          carbs: '',
          fat: '',
          supplements: [],
        }));
        setTempMacros(emptyDays);
      }
    }
  }, [open, dailyMacros]);

  const handleUpdateDay = (dayIndex: number, field: keyof DayMacros, value: string) => {
    const updated = [...tempMacros];
    updated[dayIndex] = {
      ...updated[dayIndex],
      [field]: value,
    };
    setTempMacros(updated);
  };

  const handleCopyToAll = (dayIndex: number) => {
    const sourceMacros = tempMacros[dayIndex];
    const updated = tempMacros.map(() => ({ ...sourceMacros }));
    setTempMacros(updated);
  };

  const handleSave = () => {
    // Se dailyMacros non esiste, inizializzalo prima
    if (!dailyMacros) {
      initializeDailyMacros();
      // Dopo l'inizializzazione, aggiorna i macro
      setTimeout(() => {
        tempMacros.forEach((macros, idx) => {
          updateDailyMacros(idx, macros);
        });
      }, 100);
    } else {
      // Aggiorna tutti i giorni
      tempMacros.forEach((macros, idx) => {
        updateDailyMacros(idx, macros);
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="w-5 h-5" />
            Configura Macro Settimanali
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Imposta i macro per ogni giorno della settimana. Potrai spuntare ogni giorno quando completato.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3 sm:py-4">
          {DAY_NAMES.map((dayName, dayIndex) => (
            <Card key={dayIndex} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-sm font-medium">
                    {dayName}
                  </span>
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyToAll(dayIndex)}
                  className="text-xs"
                >
                  Copia a tutti
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Kcal</Label>
                  <Input
                    type="text"
                    value={tempMacros[dayIndex]?.kcal || ''}
                    onChange={(e) => handleUpdateDay(dayIndex, 'kcal', e.target.value)}
                    placeholder="es. 2500"
                  />
                </div>
                <div>
                  <Label className="text-xs">Proteine (g)</Label>
                  <Input
                    type="text"
                    value={tempMacros[dayIndex]?.protein || ''}
                    onChange={(e) => handleUpdateDay(dayIndex, 'protein', e.target.value)}
                    placeholder="es. 180"
                  />
                </div>
                <div>
                  <Label className="text-xs">Carboidrati (g)</Label>
                  <Input
                    type="text"
                    value={tempMacros[dayIndex]?.carbs || ''}
                    onChange={(e) => handleUpdateDay(dayIndex, 'carbs', e.target.value)}
                    placeholder="es. 300"
                  />
                </div>
                <div>
                  <Label className="text-xs">Grassi (g)</Label>
                  <Input
                    type="text"
                    value={tempMacros[dayIndex]?.fat || ''}
                    onChange={(e) => handleUpdateDay(dayIndex, 'fat', e.target.value)}
                    placeholder="es. 70"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={handleSave} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Salva Configurazione
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
