import { useState } from 'react';
import { LoggedSession } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { EditSessionModal } from './EditSessionModal';
import { LoggedSessionCard } from './LoggedSessionCard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { History } from 'lucide-react';

interface LogbookTableProps {
  sessions: LoggedSession[];
}

export function LogbookTable({ sessions }: LogbookTableProps) {
  const { deleteLoggedSession } = useApp();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<LoggedSession | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

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
      <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <Card className="shadow-premium border-none">
          <CardHeader className="pb-3 sm:pb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg">Storico Sessioni</CardTitle>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 sm:w-9 sm:h-9 p-0">
                  <ChevronDown className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform ${isHistoryOpen ? '' : '-rotate-90'}`} />
                  <span className="sr-only">Espandi/Comprimi storico</span>
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="px-3 sm:px-6">
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <History className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Nessuna sessione trovata</p>
                <p className="text-xs text-muted-foreground mt-1">Prova a modificare i filtri di ricerca</p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  return (
    <>
      <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <Card className="shadow-premium border-none">
          <CardHeader className="pb-3 sm:pb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg">Storico Sessioni</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {sortedGroups.length} esercizio/i trovato/i ({sessions.length} blocchi totali)
                </CardDescription>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 sm:w-9 sm:h-9 p-0">
                  <ChevronDown className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform ${isHistoryOpen ? '' : '-rotate-90'}`} />
                  <span className="sr-only">Espandi/Comprimi storico</span>
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="px-3 sm:px-6">
              <div className="space-y-2 sm:space-y-3">
                <AnimatePresence mode="popLayout">
                  {sortedGroups.map(([groupId, groupSessions]) => {
                    // Ordina i blocchi per blockIndex
                    const sortedGroupSessions = [...groupSessions].sort((a, b) =>
                      (a.blockIndex ?? 0) - (b.blockIndex ?? 0)
                    );
                    const mainSession = sortedGroupSessions[0];
                    const hasMultipleBlocks = sortedGroupSessions.length > 1;

                    return (
                      <motion.div
                        key={groupId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        layout
                      >
                        <LoggedSessionCard
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
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

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
