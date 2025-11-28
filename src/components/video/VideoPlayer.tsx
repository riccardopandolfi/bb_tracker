import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Loader2, Play, Pause, Maximize2, Volume2, VolumeX, Trash2, Download } from 'lucide-react';
import { getVideoUrl, deleteVideo } from '@/lib/videoService';
import { ExerciseVideo } from '@/types';

interface VideoPlayerProps {
  video: ExerciseVideo;
  onDelete?: () => void;
  showControls?: boolean;
  autoPlay?: boolean;
  className?: string;
}

export function VideoPlayer({
  video,
  onDelete,
  showControls = true,
  autoPlay = false,
  className = '',
}: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let mounted = true;

    async function loadVideo() {
      setLoading(true);
      setError(null);

      try {
        const url = await getVideoUrl(video.storage_path);
        if (mounted) {
          if (url) {
            setVideoUrl(url);
          } else {
            setError('Impossibile caricare il video');
          }
        }
      } catch (err) {
        if (mounted) {
          setError('Errore durante il caricamento del video');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadVideo();

    return () => {
      mounted = false;
    };
  }, [video.storage_path]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleDownload = async () => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `${video.exercise_name}_${video.technique}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Eliminare questo video? L\'azione non può essere annullata.')) {
      return;
    }

    setDeleting(true);
    try {
      const success = await deleteVideo(video.id);
      if (success) {
        onDelete?.();
      } else {
        setError('Errore durante l\'eliminazione');
      }
    } catch (err) {
      setError('Errore durante l\'eliminazione');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg p-8 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !videoUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg p-8 text-center ${className}`}>
        <p className="text-sm text-gray-500">{error || 'Video non disponibile'}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Video */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full"
          controls={!showControls}
          autoPlay={autoPlay}
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Custom controls overlay */}
        {showControls && (
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayPause}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" />
                )}
              </button>
              <button
                onClick={handleMuteToggle}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>
              <div className="flex-1" />
              <button
                onClick={handleFullscreen}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
              >
                <Maximize2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info & Actions */}
      {showControls && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-500">
            {formatDate(video.recorded_at)}
            {video.load_kg && ` • ${video.load_kg}kg`}
            {video.reps && ` • ${video.reps}`}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="h-8 w-8"
              title="Scarica"
            >
              <Download className="w-4 h-4" />
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={deleting}
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                title="Elimina"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Dialog per visualizzare un video a schermo pieno
interface VideoPlayerDialogProps {
  video: ExerciseVideo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: () => void;
}

export function VideoPlayerDialog({
  video,
  open,
  onOpenChange,
  onDelete,
}: VideoPlayerDialogProps) {
  if (!video) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{video.exercise_name}</span>
            <span className="text-sm font-normal text-muted-foreground">
              • {video.technique}
            </span>
          </DialogTitle>
        </DialogHeader>
        <VideoPlayer
          video={video}
          onDelete={() => {
            onDelete?.();
            onOpenChange(false);
          }}
          showControls
        />
        {video.notes && (
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            {video.notes}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

