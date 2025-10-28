import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Day } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { ExercisesTable } from './ExercisesTable';

export function DaysTabs() {
  const { currentWeek, weeks, updateWeek } = useApp();
  const week = weeks[currentWeek];
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

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
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            {week.days.map((day, index) => (
              <TabsTrigger key={index} value={index.toString()}>
                {day.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button variant="outline" size="sm" onClick={handleAddDay}>
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi Giorno
          </Button>
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
    </div>
  );
}
