import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import type { CoachingRelationship } from '@/types';

interface CoachAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CoachAccessDialog({ open, onOpenChange }: CoachAccessDialogProps) {
  const {
    session,
    relationships,
    relationshipsLoading,
    inviteAthleteByEmail,
    acceptInvite,
    declineInvite,
    revokeRelationship,
    setActiveAccountId,
  } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session) return null;

  const coachRelationships = relationships.filter((rel) => rel.coach_id === session.user.id);
  const athleteRelationships = relationships.filter((rel) => rel.athlete_id === session.user.id);
  const pendingAsCoach = coachRelationships.filter((rel) => rel.status === 'pending');
  const activeAthletes = coachRelationships.filter((rel) => rel.status === 'active');
  const pendingAsAthlete = athleteRelationships.filter((rel) => rel.status === 'pending');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setError(null);
    setIsSubmitting(true);
    try {
      await inviteAthleteByEmail(inviteEmail);
      setInviteEmail('');
      setFeedback('Invito inviato con successo');
    } catch (err: any) {
      setError(err?.message ?? 'Impossibile inviare l\'invito');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRelationshipCard = (
    title: string,
    list: CoachingRelationship[],
    actions: (rel: CoachingRelationship) => React.ReactNode
  ) => {
    if (list.length === 0) return null;
    return (
      <div>
        <h4 className="text-xs uppercase tracking-wide text-white/60 mb-2">{title}</h4>
        <div className="space-y-3">
          {list.map((rel) => (
            <div
              key={rel.id}
              className="border border-white/10 rounded-xl p-3 flex items-center justify-between bg-white/5"
            >
              <div>
                <p className="font-heading text-white">
                  {rel.athlete?.full_name || rel.coach?.full_name || rel.athlete?.email || rel.coach?.email || 'Profilo'}
                </p>
                <Badge variant="outline" className="mt-1 uppercase tracking-wide text-[10px]">
                  {rel.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {actions(rel)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Gestione Coach & Atleti</DialogTitle>
          <DialogDescription>
            Invita i tuoi atleti e gestisci gli accessi condivisi in tempo reale.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] pr-2 space-y-6 overflow-y-auto">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Invita un nuovo atleta</h3>
            <form onSubmit={handleInvite} className="grid gap-3">
              <div className="grid gap-2">
                <Label>Email dell&rsquo;atleta</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="mario@esempio.com"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              {feedback && <p className="text-sm text-emerald-400">{feedback}</p>}
              <Button type="submit" disabled={!inviteEmail || isSubmitting}>
                {isSubmitting ? 'Invio in corso...' : 'Invia invito'}
              </Button>
            </form>
          </section>

          {renderRelationshipCard('Atleti attivi', activeAthletes, (rel) => (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setActiveAccountId(rel.athlete_id);
                  onOpenChange(false);
                }}
              >
                Visualizza
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-400"
                onClick={() => revokeRelationship(rel.id)}
              >
                Rimuovi
              </Button>
            </>
          ))}

          {renderRelationshipCard('Inviti inviati (coach)', pendingAsCoach, (rel) => (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-400"
              onClick={() => declineInvite(rel.id)}
            >
              Annulla
            </Button>
          ))}

          {renderRelationshipCard('Inviti ricevuti', pendingAsAthlete, (rel) => (
            <>
              <Button size="sm" variant="outline" onClick={() => acceptInvite(rel.id)}>
                Accetta
              </Button>
              <Button size="sm" variant="ghost" className="text-red-400" onClick={() => declineInvite(rel.id)}>
                Rifiuta
              </Button>
            </>
          ))}
        </div>
        {relationshipsLoading && <p className="text-xs text-white/60">Aggiornamento relazioni...</p>}
      </DialogContent>
    </Dialog>
  );
}


