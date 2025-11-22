import { supabase } from './supabase';
import type { CoachingRelationship } from '@/types';

const RELATIONSHIP_SELECT = `
  id,
  coach_id,
  athlete_id,
  status,
  permissions,
  created_at,
  updated_at,
  coach:profiles!coaching_relationships_coach_id_fkey(id, full_name, email, avatar_url, role),
  athlete:profiles!coaching_relationships_athlete_id_fkey(id, full_name, email, avatar_url, role)
`;

export async function fetchRelationships(userId: string): Promise<CoachingRelationship[]> {
  const { data, error } = await supabase
    .from('coaching_relationships')
    .select(RELATIONSHIP_SELECT)
    .or(`coach_id.eq.${userId},athlete_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Errore nel recupero delle relazioni coach/atleta', error);
    throw error;
  }

  return (data as unknown as CoachingRelationship[]) ?? [];
}

export async function inviteAthlete(coachId: string, athleteId: string) {
  const { data, error } = await supabase
    .from('coaching_relationships')
    .insert({
      coach_id: coachId,
      athlete_id: athleteId,
      status: 'pending',
      permissions: 'editor',
    })
    .select(RELATIONSHIP_SELECT)
    .single();

  if (error) {
    console.error('Errore nell\'invio dell\'invito', error);
    throw error;
  }

  return data as unknown as CoachingRelationship;
}

export async function updateRelationshipStatus(id: string, status: 'pending' | 'active' | 'revoked') {
  const { data, error } = await supabase
    .from('coaching_relationships')
    .update({ status })
    .eq('id', id)
    .select(RELATIONSHIP_SELECT)
    .single();

  if (error) {
    console.error('Errore nell\'aggiornamento della relazione', error);
    throw error;
  }

  return data as unknown as CoachingRelationship;
}

export async function removeRelationship(id: string) {
  const { error } = await supabase
    .from('coaching_relationships')
    .update({ status: 'revoked' })
    .eq('id', id);

  if (error) {
    console.error('Errore nella rimozione della relazione', error);
    throw error;
  }
}


