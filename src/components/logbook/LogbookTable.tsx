import { useState } from 'react';
import { LoggedSession } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { EditSessionModal } from './EditSessionModal';
import { LoggedSessionCard } from './LoggedSessionCard';

interface LogbookTableProps {
  sessions: LoggedSession[];
}

export function LogbookTable({ sessions }: LogbookTableProps) {
  const { deleteLoggedSession } = useApp();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<LoggedSession | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set());

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const toggleExpanded = (sessionId: number) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const handleEdit = (session: LoggedSession) => {
    setSelectedSession(session);
    setEditModalOpen(true);
  };

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
    <>
      <Card>
        <CardHeader>
          <CardTitle>Storico Sessioni</CardTitle>
          <CardDescription>
            {sortedSessions.length} sessione/i trovata/e
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedSessions.map((session) => (
              <LoggedSessionCard
                key={session.id}
                session={session}
                isExpanded={expandedSessions.has(session.id)}
                onToggleExpand={() => toggleExpanded(session.id)}
                onEdit={() => handleEdit(session)}
                onDelete={() => deleteLoggedSession(session.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedSession && (
        <EditSessionModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          session={selectedSession}
        />
      )}
    </>
  );
}
