import { LoggedSession } from '@/types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { getRPEColor } from '@/lib/calculations';

interface LoggedSessionCardProps {
  session: LoggedSession;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function LoggedSessionCard({
  session,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: LoggedSessionCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Group sets by setNum for techniques
  const uniqueSets = Array.from(new Set(session.sets.map(s => s.setNum)));
  const isSpecialTechnique = session.technique !== 'Normale';

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          {/* Header - Always Visible */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  🗓️ {formatDate(session.date)}
                </span>
                <Badge variant="outline" className="text-xs">
                  W{session.weekNum}
                </Badge>
              </div>

              <h3 className="text-lg font-semibold mb-2">{session.exercise}</h3>

              <div className="flex flex-wrap items-center gap-2 text-sm mb-2">
                <span className="text-muted-foreground font-medium">
                  {session.technique}
                </span>
                <span>•</span>
                {isSpecialTechnique ? (
                  <span className="text-xs text-muted-foreground font-mono">
                    {uniqueSets.length} × {session.techniqueSchema}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {uniqueSets.length} × {session.targetReps / uniqueSets.length}
                  </span>
                )}
              </div>

              {/* Sets detail display */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {uniqueSets.map(setNum => {
                  const setData = session.sets.filter(s => s.setNum === setNum);
                  const repsDisplay = isSpecialTechnique
                    ? setData.map(s => s.reps || '0').join('+')
                    : setData[0]?.reps || '0';
                  const loadValue = parseFloat(setData[0]?.load || '0').toFixed(0);

                  return (
                    <div
                      key={setNum}
                      className="px-2.5 py-1 rounded-md bg-muted/50 backdrop-blur-sm text-xs"
                    >
                      <span className="font-medium">{repsDisplay}</span>
                      <span className="mx-1 text-muted-foreground">@</span>
                      <span className="font-medium">{loadValue}kg</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">
                  RPE Target: {session.targetRPE?.toFixed(1)}
                </span>
                <span>•</span>
                <span className="text-muted-foreground">
                  RPE Reale:{' '}
                  <span className={getRPEColor(session.avgRPE)}>
                    {session.avgRPE?.toFixed(1)}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex gap-1">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Pencil className="w-4 h-4 text-blue-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>

          {/* Expanded Content */}
          <CollapsibleContent>
            <div className="mt-6 pt-4 border-t space-y-4">
              {/* Session Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Range</div>
                  <div className="font-medium">{session.repRange}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Reps Totali</div>
                  <div className="font-medium">
                    {session.totalReps} / {session.targetReps}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Coefficiente</div>
                  <div className="font-medium">{session.coefficient}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">RPE Medio</div>
                  <div className={`font-medium ${getRPEColor(session.avgRPE)}`}>
                    {session.avgRPE?.toFixed(1)}
                  </div>
                </div>
              </div>

              {/* Sets Detail Table */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Dettaglio Sets:</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs">Set</TableHead>
                        {isSpecialTechnique && (
                          <TableHead className="text-xs">Mini</TableHead>
                        )}
                        <TableHead className="text-xs">Reps</TableHead>
                        <TableHead className="text-xs">Target</TableHead>
                        <TableHead className="text-xs">Load (kg)</TableHead>
                        <TableHead className="text-xs">RPE</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {session.sets.map((set, idx) => {
                        const targetReps = isSpecialTechnique
                          ? parseFloat(set.reps || '0')
                          : session.targetReps / uniqueSets.length;
                        const actualReps = parseFloat(set.reps || '0');
                        const rpeValue = parseFloat(set.rpe || '0');
                        const isComplete = actualReps >= targetReps * 0.9;

                        return (
                          <TableRow key={idx} className={isComplete ? '' : 'bg-red-50'}>
                            <TableCell className="text-sm font-medium">
                              {set.setNum}
                            </TableCell>
                            {isSpecialTechnique && (
                              <TableCell className="text-sm text-muted-foreground">
                                {set.clusterNum}
                              </TableCell>
                            )}
                            <TableCell className="text-sm">
                              {actualReps}
                              {!isComplete && ' ⚠️'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {targetReps}
                            </TableCell>
                            <TableCell className="text-sm">
                              {parseFloat(set.load || '0').toFixed(1)}
                            </TableCell>
                            <TableCell className={`text-sm font-medium ${getRPEColor(rpeValue)}`}>
                              {rpeValue.toFixed(1)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Target Loads Info */}
              {session.targetLoads && session.targetLoads.length > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Carichi pianificati: </span>
                  <span className="font-medium">{session.targetLoads.join(' - ')} kg</span>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}
