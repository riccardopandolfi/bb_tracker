import { useState, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { Card } from '../ui/card';
import { Upload, X, Video, FileVideo, Loader2 } from 'lucide-react';
import { uploadExerciseVideo, VideoUploadMetadata } from '@/lib/videoService';
import { ExerciseVideo } from '@/types';

interface VideoUploaderProps {
  // Metadati pre-compilati (dall'esercizio/blocco corrente)
  defaultMetadata?: Partial<VideoUploadMetadata>;
  // Callback quando il video è stato caricato con successo
  onUploadComplete?: (video: ExerciseVideo) => void;
  // Callback per annullare
  onCancel?: () => void;
  // Modalità compatta (senza form metadati, usa solo i default)
  compact?: boolean;
}

export function VideoUploader({
  defaultMetadata = {},
  onUploadComplete,
  onCancel,
  compact = false,
}: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState(defaultMetadata.notes || '');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-matroska'];

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!acceptedTypes.includes(selectedFile.type)) {
      setError('Formato video non supportato. Usa MP4, MOV, WebM, AVI o MKV.');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Crea preview URL
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const handleRemoveFile = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [preview]);

  const handleUpload = async () => {
    if (!file) return;

    // Verifica che abbiamo i metadati necessari
    if (!defaultMetadata.exercise_name || !defaultMetadata.technique) {
      setError('Metadati esercizio mancanti');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const metadata: VideoUploadMetadata = {
        exercise_name: defaultMetadata.exercise_name,
        technique: defaultMetadata.technique,
        sets: defaultMetadata.sets,
        reps: defaultMetadata.reps,
        load_kg: defaultMetadata.load_kg,
        rpe: defaultMetadata.rpe,
        logged_session_id: defaultMetadata.logged_session_id,
        program_name: defaultMetadata.program_name,
        week_num: defaultMetadata.week_num,
        notes: notes || undefined,
      };

      const video = await uploadExerciseVideo(file, metadata, (p) => {
        setProgress(p);
      });

      if (video) {
        onUploadComplete?.(video);
        handleRemoveFile();
      } else {
        setError('Errore durante il caricamento del video');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Errore durante il caricamento del video');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {!file && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${isDragging 
              ? 'border-primary bg-primary/10' 
              : 'border-gray-300 hover:border-primary hover:bg-gray-50'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleInputChange}
            className="hidden"
          />
          <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-primary' : 'text-gray-400'}`} />
          <p className="text-sm font-medium text-gray-700">
            Trascina un video qui o clicca per selezionare
          </p>
          <p className="text-xs text-gray-500 mt-1">
            MP4, MOV, WebM, AVI, MKV
          </p>
        </div>
      )}

      {/* Preview */}
      {file && preview && (
        <Card className="overflow-hidden">
          <div className="relative">
            <video
              src={preview}
              controls
              className="w-full max-h-64 object-contain bg-black"
            />
            {!uploading && (
              <button
                onClick={handleRemoveFile}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
          <div className="p-3 bg-gray-50 border-t">
            <div className="flex items-center gap-2 text-sm">
              <FileVideo className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-700 truncate flex-1">
                {file.name}
              </span>
              <span className="text-gray-500">
                {formatFileSize(file.size)}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Progress bar */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Caricamento in corso...</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Note (se non compact) */}
      {!compact && file && !uploading && (
        <div className="space-y-2">
          <Label htmlFor="video-notes" className="text-sm">
            Note (opzionale)
          </Label>
          <Textarea
            id="video-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Aggiungi note su questa esecuzione..."
            rows={2}
            className="resize-none"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </p>
      )}

      {/* Actions */}
      {file && (
        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={uploading}
            >
              Annulla
            </Button>
          )}
          <Button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="lime-gradient text-black hover:opacity-90"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Caricamento...
              </>
            ) : (
              <>
                <Video className="w-4 h-4 mr-2" />
                Carica Video
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

