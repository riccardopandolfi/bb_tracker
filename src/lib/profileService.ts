import { supabase } from './supabase';
import type { Profile } from '@/types';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const PROFILE_SELECT = 'id, email, full_name, avatar_url, role, created_at, updated_at';

const normalizeEmail = (email?: string | null) => email?.trim().toLowerCase() ?? null;

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Errore nel recupero del profilo', error);
    throw error;
  }

  return data ?? null;
}

export async function getProfileByEmail(email: string): Promise<Profile | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('email', normalized)
    .maybeSingle();

  if (error) {
    console.error('Errore nel recupero del profilo via email', error);
    throw error;
  }

  return data ?? null;
}

export async function ensureProfileForUser(user: SupabaseUser, fullNameOverride?: string): Promise<Profile> {
  // Attendi che il profilo venga creato dal trigger (può richiedere qualche millisecondo)
  let existing = await getProfileById(user.id);
  
  // Se il profilo non esiste ancora, attendi e riprova (il trigger lo sta creando)
  if (!existing) {
    let retries = 5;
    while (!existing && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Attendi 500ms
      existing = await getProfileById(user.id);
      retries--;
    }
  }

  const payload = {
    id: user.id,
    email: normalizeEmail(user.email),
    full_name: fullNameOverride ?? (existing?.full_name ?? user.user_metadata?.full_name ?? user.email),
  };

  if (existing) {
    const needsUpdate =
      (payload.email && payload.email !== existing.email) ||
      (payload.full_name && payload.full_name !== existing.full_name);

    if (!needsUpdate) {
      return existing;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select(PROFILE_SELECT)
      .single();

    if (error) {
      console.error('Errore nell\'aggiornamento del profilo', error);
      throw error;
    }

    return data;
  }

  // Se dopo i retry il profilo non esiste, prova a crearlo manualmente come fallback
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      ...payload,
      role: 'athlete',
    })
    .select(PROFILE_SELECT)
    .single();

  if (error) {
    console.error('Errore nella creazione del profilo', error);
    throw error;
  }

  return data;
}


