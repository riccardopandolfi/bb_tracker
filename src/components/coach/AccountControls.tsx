import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface AccountControlsProps {
  onOpenCoachPanel: () => void;
  compact?: boolean;
}

export function AccountControls({ onOpenCoachPanel, compact }: AccountControlsProps) {
  const { session, profile, relationships, activeAccountId, setActiveAccountId, activeAccountProfile, isCoachMode, signOut } = useAuth();

  if (!session) {
    return null;
  }

  const coachAthletes = relationships.filter(
    (rel) => rel.coach_id === session.user.id && rel.status === 'active'
  );

  const displayProfile = activeAccountProfile ?? profile;
  const displayName = displayProfile?.full_name || displayProfile?.email || session.user.email || 'Profilo';

  const handleChange = (value: string) => {
    if (value === 'self') {
      setActiveAccountId(null);
      return;
    }
    setActiveAccountId(value);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-white',
        compact && 'bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10'
      )}
    >
      {!compact && (
        <div className="hidden xl:flex flex-col text-right leading-tight">
          <span className="text-[10px] uppercase tracking-wide text-white/50">
            {isCoachMode ? 'Coach Mode' : 'Profilo'}
          </span>
          <span className="text-sm font-heading">{displayName}</span>
        </div>
      )}
      {coachAthletes.length > 0 && (
        <Select
          value={isCoachMode ? activeAccountId ?? 'self' : 'self'}
          onValueChange={handleChange}
        >
          <SelectTrigger className="w-[140px] xl:w-[180px] bg-white/5 border-white/10 text-white hover:bg-white/10 focus:ring-primary/50">
            <SelectValue
              placeholder="Seleziona atleta"
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="self">Il mio profilo</SelectItem>
            {coachAthletes.map((rel) => (
              <SelectItem key={rel.id} value={rel.athlete_id}>
                {rel.athlete?.full_name || rel.athlete?.email || 'Atleta'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button
        variant={compact ? 'ghost' : 'outline'}
        size="sm"
        className={cn(
          'text-white border-white/40 bg-white/5 hover:bg-white/15 hover:text-white hover:border-white/60',
          compact && 'h-8 px-3',
          !compact && 'px-2 xl:px-3 text-xs xl:text-sm'
        )}
        onClick={onOpenCoachPanel}
      >
        <span className="hidden lg:inline">Coach Area</span>
        <span className="lg:hidden">Coach</span>
      </Button>
      <Button
        variant={compact ? 'ghost' : 'outline'}
        size="sm"
        className={cn(
          'text-white border-white/40 bg-white/5 hover:bg-white/15 hover:text-white hover:border-white/60',
          compact && 'h-8 px-3',
          !compact && 'px-2 xl:px-3 text-xs xl:text-sm'
        )}
        onClick={signOut}
      >
        Esci
      </Button>
    </div>
  );
}


