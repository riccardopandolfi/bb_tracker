import { useState } from 'react';
import { LoggedSession } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Pencil, Trash2 } from 'lucide-react';
import { getRPEColor } from '@/lib/calculations';
import { EditSessionModal } from './EditSessionModal';

interface LogbookTableProps {
  sessions: LoggedSession[];
}

export function LogbookTable({ sessions }: LogbookTableProps) {
  const { deleteLoggedSession } = useApp();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<LoggedSession | null>(null);

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Storico Sessioni</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">
            Nessuna sessione trovata con questi filtri
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storico Sessioni</CardTitle>
        <CardDescription>Tutte le sessioni loggate ordinate per data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Week</TableHead>
                <TableHead>Esercizio</TableHead>
                <TableHead>Tecnica</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Rep Range</TableHead>
                <TableHead>Reps</TableHead>
                <TableHead>Carichi (kg)</TableHead>
                <TableHead>RPE Reale</TableHead>
                <TableHead className="w-16">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSessions.map((session) => {
                // Count unique setNum to get the actual number of sets
                const numSets = new Set(session.sets.map(s => s.setNum)).size;

                return (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline">W{session.weekNum}</Badge>
                    </TableCell>
                    <TableCell>{session.exercise}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {session.technique}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {session.technique === 'Normale'
                          ? `${numSets}x${session.targetReps / numSets}`
                          : `${numSets} x ${session.techniqueSchema}`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{session.repRange}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {session.sets.map((set, i) => (
                          <Tooltip key={i}>
                            <TooltipTrigger asChild>
                              <Badge variant="secondary" className="font-mono cursor-help">
                                {set.reps}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                <p className="font-semibold">Set {i + 1}</p>
                                <p>Reps: {set.reps}</p>
                                <p>Carico: {set.load} kg</p>
                                {set.rpe && <p>RPE: {set.rpe}</p>}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {session.sets.map((set, i) => (
                          <Tooltip key={i}>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="font-mono cursor-help">
                                {set.load}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                <p className="font-semibold">Set {i + 1}</p>
                                <p>Reps: {set.reps}</p>
                                <p>Carico: {set.load} kg</p>
                                {set.rpe && <p>RPE: {set.rpe}</p>}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={session.avgRPE >= 9 ? 'destructive' : 'secondary'}
                        className={getRPEColor(session.avgRPE)}
                      >
                        {session.avgRPE > 0 ? session.avgRPE.toFixed(1) : '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedSession(session);
                            setEditModalOpen(true);
                          }}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteLoggedSession(session.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {selectedSession && (
        <EditSessionModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          session={selectedSession}
        />
      )}
    </Card>
  );
}
