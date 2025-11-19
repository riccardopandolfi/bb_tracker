import { supabase } from './supabase';
import { AppState } from '@/types';

export interface AppStateRow {
  id: number;
  data: AppState;
  updated_at: string;
}

/**
 * Carica lo stato dell'app dal database
 */
export async function loadAppState(): Promise<AppState | null> {
  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('data')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Error loading app state:', error);
      return null;
    }

    return data?.data || null;
  } catch (error) {
    console.error('Error loading app state:', error);
    return null;
  }
}

/**
 * Salva lo stato dell'app nel database
 */
export async function saveAppState(state: AppState): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('app_state')
      .update({ data: state })
      .eq('id', 1);

    if (error) {
      console.error('Error saving app state:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saving app state:', error);
    return false;
  }
}

/**
 * Sottoscrizione agli aggiornamenti real-time
 */
export function subscribeToAppState(
  callback: (state: AppState) => void
) {
  const channel = supabase
    .channel('app_state_changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'app_state',
        filter: 'id=eq.1'
      },
      (payload) => {
        const newState = payload.new as AppStateRow;
        if (newState?.data) {
          callback(newState.data);
        }
      }
    )
    .subscribe();

  // Ritorna funzione per annullare la sottoscrizione
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Migra dati da localStorage a Supabase (da eseguire una sola volta)
 */
export async function migrateFromLocalStorage(localData: AppState): Promise<boolean> {
  try {
    // Prima verifica se il database è vuoto
    const currentState = await loadAppState();

    // Se il database ha già dati, non migrare
    if (currentState && Object.keys(currentState.userData || {}).length > 0) {
      console.log('Database already has data, skipping migration');
      return true;
    }

    // Migra i dati da localStorage
    const success = await saveAppState(localData);

    if (success) {
      console.log('Successfully migrated data from localStorage to Supabase');
    }

    return success;
  } catch (error) {
    console.error('Error migrating from localStorage:', error);
    return false;
  }
}
