import { LoggedSession } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { getRPEColor } from '@/lib/calculations';

interface LogbookTableProps {
  sessions: LoggedSession[];
}

export function LogbookTable({ sessions }: LogbookTableProps) {
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
                <TableHead>Rep Range</TableHead>
                <TableHead>Reps</TableHead>
                <TableHead>Completamento</TableHead>
                <TableHead>Tonnellaggio</TableHead>
                <TableHead>RPE Reale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSessions.map((session) => {
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
                      <Badge variant="secondary">{session.repRange}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {session.totalReps} / {session.targetReps}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress
                          value={Math.min(session.completion, 100)}
                          className="h-2"
                        />
                        <span className="text-xs text-muted-foreground">
                          {session.completion.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {session.totalTonnage.toFixed(0)} kg
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={session.avgRPE >= 9 ? 'destructive' : 'secondary'}
                        className={getRPEColor(session.avgRPE)}
                      >
                        {session.avgRPE > 0 ? session.avgRPE.toFixed(1) : '-'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
