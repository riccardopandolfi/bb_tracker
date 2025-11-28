import { supabase } from './supabase';

// Tipo per i video degli esercizi
export interface ExerciseVideo {
  id: string;
  user_id: string;
  exercise_name: string;
  technique: string;
  sets?: number;
  reps?: string;
  load_kg?: number;
  rpe?: number;
  storage_path: string;
  thumbnail_path?: string;
  file_size_bytes?: number;
  duration_seconds?: number;
  logged_session_id?: number;
  program_name?: string;
  week_num?: number;
  notes?: string;
  recorded_at: string;
  created_at: string;
}

// Metadati per l'upload di un video
export interface VideoUploadMetadata {
  exercise_name: string;
  technique: string;
  sets?: number;
  reps?: string;
  load_kg?: number;
  rpe?: number;
  logged_session_id?: number;
  program_name?: string;
  week_num?: number;
  notes?: string;
}

// Filtri per la ricerca video
export interface VideoSearchFilters {
  exercise_name?: string;
  technique?: string;
  logged_session_id?: number;
}

// Callback per il progresso dell'upload
export type UploadProgressCallback = (progress: number) => void;

// Nome del bucket
const BUCKET_NAME = 'exercise-videos';

/**
 * Genera un nome file univoco per il video
 */
function generateVideoFileName(userId: string, originalName: string): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop() || 'mp4';
  return `${userId}/${timestamp}_${Math.random().toString(36).substring(7)}.${extension}`;
}

/**
 * Carica un video nel bucket Storage
 */
export async function uploadExerciseVideo(
  file: File,
  metadata: VideoUploadMetadata,
  onProgress?: UploadProgressCallback
): Promise<ExerciseVideo | null> {
  try {
    // Ottieni l'utente corrente
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Utente non autenticato');
    }

    // Genera il path del file
    const storagePath = generateVideoFileName(user.id, file.name);

    // Upload del file con tracking del progresso
    // Nota: Supabase JS non supporta nativamente il progress, usiamo XMLHttpRequest per file grandi
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Errore upload video:', uploadError);
      throw uploadError;
    }

    // Simula progress completo (per ora, fino a quando non implementiamo XHR)
    if (onProgress) {
      onProgress(100);
    }

    // Salva i metadati nel database
    const videoRecord = {
      user_id: user.id,
      exercise_name: metadata.exercise_name,
      technique: metadata.technique,
      sets: metadata.sets,
      reps: metadata.reps,
      load_kg: metadata.load_kg,
      rpe: metadata.rpe,
      storage_path: storagePath,
      file_size_bytes: file.size,
      logged_session_id: metadata.logged_session_id,
      program_name: metadata.program_name,
      week_num: metadata.week_num,
      notes: metadata.notes,
    };

    const { data: insertData, error: insertError } = await supabase
      .from('exercise_videos')
      .insert(videoRecord)
      .select()
      .single();

    if (insertError) {
      console.error('Errore salvataggio metadati video:', insertError);
      // Se fallisce l'insert, elimina il file caricato
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      throw insertError;
    }

    return insertData as ExerciseVideo;
  } catch (error) {
    console.error('Errore durante upload video:', error);
    return null;
  }
}

/**
 * Genera un URL firmato per lo streaming del video
 */
export async function getVideoUrl(storagePath: string, expiresIn: number = 3600): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      console.error('Errore generazione URL video:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Errore generazione URL video:', error);
    return null;
  }
}

/**
 * Cerca video con filtri opzionali
 */
export async function searchVideos(filters?: VideoSearchFilters): Promise<ExerciseVideo[]> {
  try {
    let query = supabase
      .from('exercise_videos')
      .select('*')
      .order('recorded_at', { ascending: false });

    // Applica filtri
    if (filters?.exercise_name) {
      query = query.ilike('exercise_name', `%${filters.exercise_name}%`);
    }
    if (filters?.technique) {
      query = query.eq('technique', filters.technique);
    }
    if (filters?.logged_session_id) {
      query = query.eq('logged_session_id', filters.logged_session_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Errore ricerca video:', error);
      return [];
    }

    return data as ExerciseVideo[];
  } catch (error) {
    console.error('Errore ricerca video:', error);
    return [];
  }
}

/**
 * Ottieni tutti i video dell'utente corrente
 */
export async function getUserVideos(): Promise<ExerciseVideo[]> {
  try {
    const { data, error } = await supabase
      .from('exercise_videos')
      .select('*')
      .order('recorded_at', { ascending: false });

    if (error) {
      console.error('Errore recupero video utente:', error);
      return [];
    }

    return data as ExerciseVideo[];
  } catch (error) {
    console.error('Errore recupero video utente:', error);
    return [];
  }
}

/**
 * Ottieni video per una specifica sessione
 */
export async function getVideosForSession(sessionId: number): Promise<ExerciseVideo[]> {
  try {
    const { data, error } = await supabase
      .from('exercise_videos')
      .select('*')
      .eq('logged_session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Errore recupero video sessione:', error);
      return [];
    }

    return data as ExerciseVideo[];
  } catch (error) {
    console.error('Errore recupero video sessione:', error);
    return [];
  }
}

/**
 * Ottieni un singolo video per ID
 */
export async function getVideoById(videoId: string): Promise<ExerciseVideo | null> {
  try {
    const { data, error } = await supabase
      .from('exercise_videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (error) {
      console.error('Errore recupero video:', error);
      return null;
    }

    return data as ExerciseVideo;
  } catch (error) {
    console.error('Errore recupero video:', error);
    return null;
  }
}

/**
 * Elimina un video (file e metadati)
 */
export async function deleteVideo(videoId: string): Promise<boolean> {
  try {
    // Prima ottieni i metadati per avere il path
    const video = await getVideoById(videoId);
    if (!video) {
      console.error('Video non trovato');
      return false;
    }

    // Elimina il file dallo storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([video.storage_path]);

    if (storageError) {
      console.error('Errore eliminazione file video:', storageError);
      // Continua comunque a eliminare i metadati
    }

    // Elimina i metadati dal database
    const { error: dbError } = await supabase
      .from('exercise_videos')
      .delete()
      .eq('id', videoId);

    if (dbError) {
      console.error('Errore eliminazione metadati video:', dbError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Errore eliminazione video:', error);
    return false;
  }
}

/**
 * Aggiorna le note di un video
 */
export async function updateVideoNotes(videoId: string, notes: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('exercise_videos')
      .update({ notes })
      .eq('id', videoId);

    if (error) {
      console.error('Errore aggiornamento note video:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Errore aggiornamento note video:', error);
    return false;
  }
}

/**
 * Collega un video a una sessione loggata
 */
export async function linkVideoToSession(videoId: string, sessionId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('exercise_videos')
      .update({ logged_session_id: sessionId })
      .eq('id', videoId);

    if (error) {
      console.error('Errore collegamento video a sessione:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Errore collegamento video a sessione:', error);
    return false;
  }
}

/**
 * Ottieni le tecniche uniche usate nei video (per i filtri)
 */
export async function getUniqueTechniques(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('exercise_videos')
      .select('technique')
      .order('technique');

    if (error) {
      console.error('Errore recupero tecniche:', error);
      return [];
    }

    // Estrai valori unici
    const uniqueTechniques = [...new Set(data.map(d => d.technique))];
    return uniqueTechniques;
  } catch (error) {
    console.error('Errore recupero tecniche:', error);
    return [];
  }
}

/**
 * Ottieni i nomi esercizi unici usati nei video (per i filtri)
 */
export async function getUniqueExerciseNames(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('exercise_videos')
      .select('exercise_name')
      .order('exercise_name');

    if (error) {
      console.error('Errore recupero nomi esercizi:', error);
      return [];
    }

    // Estrai valori unici
    const uniqueNames = [...new Set(data.map(d => d.exercise_name))];
    return uniqueNames;
  } catch (error) {
    console.error('Errore recupero nomi esercizi:', error);
    return [];
  }
}

/**
 * Conta i video per una specifica sessione
 */
export async function countVideosForSession(sessionId: number): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('exercise_videos')
      .select('*', { count: 'exact', head: true })
      .eq('logged_session_id', sessionId);

    if (error) {
      console.error('Errore conteggio video sessione:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Errore conteggio video sessione:', error);
    return 0;
  }
}

