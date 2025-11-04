import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Day } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { ExercisesTable } from './ExercisesTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export function DaysTabs() {
  const { currentWeek, getCurrentWeeks, updateWeek } = useApp();
  const weeks = getCurrentWeeks();
  const week = weeks[currentWeek];
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null);
  const [editingDayName, setEditingDayName] = useState('');

  if (!week) {
    return <div className="text-center py-8 text-muted-foreground">Nessuna settimana selezionata</div>;
  }

  const handleAddDay = () => {
    const newDay: Day = {
      name: `Giorno ${week.days.length + 1}`,
      exercises: [],
    };
    const updatedWeek = {
      ...week,
      days: [...week.days, newDay],
    };
    updateWeek(currentWeek, updatedWeek);
    setCurrentDayIndex(week.days.length);
  };

  const handleDeleteDay = (dayIndex: number) => {
    if (week.days.length <= 1) {
      alert('Non puoi eliminare l\'ultimo giorno!');
      return;
    }
    const updatedWeek = {
      ...week,
      days: week.days.filter((_, i) => i !== dayIndex),
    };
    updateWeek(currentWeek, updatedWeek);
    if (currentDayIndex >= week.days.length - 1) {
      setCurrentDayIndex(Math.max(0, currentDayIndex - 1));
    }
  };

  const handleEditDayName = (dayIndex: number) => {
    const day = week.days[dayIndex];
    setEditingDayName(day.name);
    setEditingDayIndex(dayIndex);
  };

  const handleSaveDayName = () => {
    if (editingDayIndex === null) return;
    
    if (!editingDayName.trim()) {
      alert('Il nome del giorno non può essere vuoto!');
      return;
    }

    const updatedWeek = {
      ...week,
      days: week.days.map((day, index) =>
        index === editingDayIndex ? { ...day, name: editingDayName.trim() } : day
      ),
    };
    updateWeek(currentWeek, updatedWeek);
    setEditingDayIndex(null);
    setEditingDayName('');
  };

  const handleCancelEdit = () => {
    setEditingDayIndex(null);
    setEditingDayName('');
  };

  if (week.days.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Nessun giorno in questa settimana</p>
        <Button onClick={handleAddDay}>
          <Plus className="w-4 h-4 mr-2" />
          Aggiungi Giorno
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs
        value={currentDayIndex.toString()}
        onValueChange={(v) => setCurrentDayIndex(parseInt(v, 10))}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 sm:flex-wrap">
            <div className="flex items-center gap-2 sm:hidden">
              <Select
                value={currentDayIndex.toString()}
                onValueChange={(value) => setCurrentDayIndex(parseInt(value, 10))}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleziona giorno" />
                </SelectTrigger>
                <SelectContent>
                  {week.days.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleEditDayName(currentDayIndex)}
                aria-label="Rinomina giorno"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>

            <TabsList className="hidden sm:flex flex-wrap">
              {week.days.map((day, index) => (
                <TabsTrigger key={index} value={index.toString()} className="flex items-center gap-1.5 pr-1.5">
                  <span>{day.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditDayName(index);
                    }}
                    className="p-0.5 hover:bg-muted rounded-sm transition-colors flex-shrink-0"
                    title="Modifica nome giorno"
                    type="button"
                  >
                    <Pencil className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 sm:hidden"
              onClick={handleAddDay}
              aria-label="Aggiungi giorno"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleAddDay} className="hidden sm:inline-flex">
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Giorno
            </Button>
          </div>
        </div>

        {week.days.map((_, dayIndex) => (
          <TabsContent key={dayIndex} value={dayIndex.toString()} className="space-y-4">
            <ExercisesTable dayIndex={dayIndex} />
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteDay(dayIndex)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Elimina Giorno
            </Button>
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog per modificare il nome del giorno */}
      <Dialog open={editingDayIndex !== null} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Nome Giorno</DialogTitle>
            <DialogDescription>
              Inserisci un nome personalizzato per questo giorno (es. Push, Pull, Legs)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="day-name">Nome Giorno</Label>
              <Input
                id="day-name"
                value={editingDayName}
                onChange={(e) => setEditingDayName(e.target.value)}
                placeholder="es. Push, Pull, Legs"
                className="mt-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveDayName();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              Annulla
            </Button>
            <Button onClick={handleSaveDayName}>
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
