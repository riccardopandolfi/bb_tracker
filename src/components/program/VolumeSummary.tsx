import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { calculateVolume } from '@/lib/calculations';
import { MUSCLE_COLORS } from '@/lib/constants';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Button } from '../ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function VolumeSummary() {
  const { currentWeek, getCurrentWeeks, exercises } = useApp();
  const weeks = getCurrentWeeks();
  const week = weeks[currentWeek];
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Calculate volume on every render to ensure updates
  const volumeData = calculateVolume(week, exercises);

  const musclesSorted = Object.entries(volumeData.byMuscle).sort(
    ([, a], [, b]) => b.volume - a.volume
  );

  const volumeCards = (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {musclesSorted.map(([muscle, data]) => {
        const muscleColor = MUSCLE_COLORS[muscle] || '#6b7280';
        return (
          <div
            key={muscle}
            className="flex justify-between items-center p-3 border rounded-lg"
          >
            <div>
              <div className="font-medium text-sm">{muscle}</div>
              <div className="text-xs text-muted-foreground">
                RPE ~{data.estimatedRPE.toFixed(1)}
              </div>
            </div>
            <div className="text-right">
              <div
                className="text-lg font-bold"
                style={{ color: muscleColor }}
              >
                {data.volume.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">volume</div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Volume by Muscle */}
      {musclesSorted.length > 0 && (
        <>
          <Card className="hidden sm:block">
            <CardHeader>
              <CardTitle>Volume per Gruppo Muscolare</CardTitle>
              <CardDescription>
                Distribuzione del volume nella settimana corrente
              </CardDescription>
            </CardHeader>
            <CardContent>{volumeCards}</CardContent>
          </Card>

          <Collapsible
            className="sm:hidden"
            open={isMobileOpen}
            onOpenChange={setIsMobileOpen}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">
                    Volume per Gruppo Muscolare
                  </CardTitle>
                  <CardDescription>
                    Distribuzione del volume nella settimana corrente
                  </CardDescription>
                </div>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={
                      isMobileOpen ? 'Nascondi volume per gruppo muscolare' : 'Mostra volume per gruppo muscolare'
                    }
                  >
                    {isMobileOpen ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-0">{volumeCards}</CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </>
      )}
    </div>
  );
}
