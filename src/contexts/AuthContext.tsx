import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { CoachingRelationship, Profile } from '@/types';
import { ensureProfileForUser, getProfileByEmail } from '@/lib/profileService';
import { fetchRelationships, inviteAthlete, removeRelationship, updateRelationshipStatus } from '@/lib/coachingService';

interface AuthContextValue {
  session: Session | null;
  user: SupabaseUser | null;
  profile: Profile | null;
  activeAccountId: string | null;
  setActiveAccountId: (targetId: string | null) => void;
  activeAccountProfile: Profile | null;
  isCoachMode: boolean;
  loading: boolean;
  relationships: CoachingRelationship[];
  relationshipsLoading: boolean;
  refreshRelationships: () => Promise<void>;
  inviteAthleteByEmail: (email: string) => Promise<void>;
  acceptInvite: (id: string) => Promise<void>;
  declineInvite: (id: string) => Promise<void>;
  revokeRelationship: (id: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: { email: string; password: string; fullName: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeAccountId, setActiveAccountIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [relationships, setRelationships] = useState<CoachingRelationship[]>([]);
  const [relationshipsLoading, setRelationshipsLoading] = useState(false);

  useEffect(() => {
    const initialise = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setLoading(false);
    };

    initialise();

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setActiveAccountIdState(currentSession?.user?.id ?? null);
      if (!currentSession) {
        setProfile(null);
        setRelationships([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      setActiveAccountIdState(null);
      return;
    }

    ensureProfileForUser(session.user)
      .then(setProfile)
      .catch((error) => console.error('Impossibile caricare il profilo', error));
  }, [session?.user]);

  const refreshRelationships = useCallback(async () => {
    if (!session?.user) {
      setRelationships([]);
      setRelationshipsLoading(false);
      return;
    }
    setRelationshipsLoading(true);
    try {
      const list = await fetchRelationships(session.user.id);
      setRelationships(list);
    } catch (error) {
      console.error('Errore nel caricamento delle relazioni', error);
    } finally {
      setRelationshipsLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (!session?.user) return;
    refreshRelationships();
  }, [session?.user, refreshRelationships]);

  useEffect(() => {
    if (!session?.user) return;

    if (!activeAccountId) {
      setActiveAccountIdState(session.user.id);
      return;
    }

    if (activeAccountId === session.user.id) return;

    const isAllowed = relationships.some(
      (rel) =>
        rel.status === 'active' &&
        rel.coach_id === session.user?.id &&
        rel.athlete_id === activeAccountId
    );

    if (!isAllowed) {
      setActiveAccountIdState(session.user.id);
    }
  }, [relationships, activeAccountId, session?.user]);

  const setActiveAccountIdSafe = (targetId: string | null) => {
    if (!session?.user) return;
    if (!targetId || targetId === session.user.id) {
      setActiveAccountIdState(session.user.id);
      return;
    }

    const isAllowed = relationships.some(
      (rel) =>
        rel.status === 'active' &&
        rel.coach_id === session.user?.id &&
        rel.athlete_id === targetId
    );

    if (isAllowed) {
      setActiveAccountIdState(targetId);
    } else {
      console.warn('Accesso non autorizzato al profilo selezionato');
    }
  };

  const inviteAthleteByEmail = async (email: string) => {
    if (!session?.user) throw new Error('Devi essere autenticato per inviare un invito');
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === session.user.email?.toLowerCase()) {
      throw new Error('Non puoi invitare te stesso');
    }

    const targetProfile = await getProfileByEmail(normalizedEmail);
    if (!targetProfile) {
      throw new Error('Nessun atleta registrato con questa email');
    }

    try {
      await inviteAthlete(session.user.id, targetProfile.id);
      await refreshRelationships();
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new Error('Esiste già una relazione con questo atleta');
      }
      throw error;
    }
  };

  const acceptInvite = async (relationshipId: string) => {
    await updateRelationshipStatus(relationshipId, 'active');
    await refreshRelationships();
  };

  const declineInvite = async (relationshipId: string) => {
    await updateRelationshipStatus(relationshipId, 'revoked');
    await refreshRelationships();
  };

  const revokeRelationshipAction = async (relationshipId: string) => {
    await removeRelationship(relationshipId);
    await refreshRelationships();
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(error.message);
    }
  };

  const signUp = async ({ email, password, fullName }: { email: string; password: string; fullName: string; }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    // Il profilo viene creato automaticamente dal trigger del database
    // Attendiamo un attimo e poi verifichiamo/aggiorniamo se necessario
    if (data.user) {
      try {
        await ensureProfileForUser(data.user, fullName);
      } catch (err) {
        // Se c'è un errore nel profilo, logghiamolo ma non blocchiamo la registrazione
        console.error('Errore nel controllo del profilo dopo la registrazione:', err);
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRelationships([]);
    setActiveAccountIdState(null);
  };

  const activeAccountProfile =
    activeAccountId && activeAccountId !== profile?.id
      ? relationships.find((rel) => rel.athlete_id === activeAccountId)?.athlete ?? profile
      : profile;

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    activeAccountId: activeAccountId ?? session?.user?.id ?? null,
    setActiveAccountId: setActiveAccountIdSafe,
    activeAccountProfile: activeAccountProfile ?? profile,
    isCoachMode: Boolean(session?.user && activeAccountId && activeAccountId !== session.user.id),
    loading,
    relationships,
    relationshipsLoading,
    refreshRelationships,
    inviteAthleteByEmail,
    acceptInvite,
    declineInvite,
    revokeRelationship: revokeRelationshipAction,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere usato all\'interno di AuthProvider');
  }
  return context;
}


