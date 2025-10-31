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
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  // Raggruppa sessioni per esercizio, data e settimana
  const groupedSessions = sessions.reduce((acc, session) => {
    const key = `${session.exercise}_${session.date}_${session.weekNum}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(session);
    return acc;
  }, {} as Record<string, LoggedSession[]>);

  // Ordina i gruppi per data (più recente prima)
  const sortedGroups = Object.entries(groupedSessions).sort(
    ([keyA], [keyB]) => {
      const dateA = keyA.split('_')[1];
      const dateB = keyB.split('_')[1];
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    }
  );

  const toggleExpanded = (groupId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedSessions(newExpanded);
  };

  const handleEdit = (session?: LoggedSession) => {
    // Se viene passata una sessione (quando si seleziona un blocco), usala
    // Altrimenti usa quella passata di default
    if (session) {
      setSelectedSession(session);
    } else {
      // Fallback per retrocompatibilità
      const defaultSession = sortedGroups[0]?.[1]?.[0];
      if (defaultSession) {
        setSelectedSession(defaultSession);
      }
    }
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
            {sortedGroups.length} esercizio/i trovato/i ({sessions.length} blocchi totali)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedGroups.map(([groupId, groupSessions]) => {
              // Ordina i blocchi per blockIndex
              const sortedGroupSessions = [...groupSessions].sort((a, b) => 
                (a.blockIndex ?? 0) - (b.blockIndex ?? 0)
              );
              const mainSession = sortedGroupSessions[0];
              const hasMultipleBlocks = sortedGroupSessions.length > 1;
              
              return (
                <LoggedSessionCard
                  key={groupId}
                  session={mainSession}
                  groupedSessions={hasMultipleBlocks ? sortedGroupSessions : undefined}
                  isExpanded={expandedSessions.has(groupId)}
                  onToggleExpand={() => toggleExpanded(groupId)}
                  onEdit={(selectedSession) => {
                    handleEdit(selectedSession || mainSession);
                  }}
                  onDelete={() => {
                    // Elimina tutte le sessioni del gruppo
                    sortedGroupSessions.forEach(s => deleteLoggedSession(s.id));
                  }}
                />
              );
            })}
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
