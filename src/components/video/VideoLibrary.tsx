import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Video, Search, Filter, Loader2, Play, Calendar, Dumbbell, RefreshCw } from 'lucide-react';
import { searchVideos, getUniqueTechniques, getUniqueExerciseNames, getVideoUrl } from '@/lib/videoService';
import { VideoPlayerDialog } from './VideoPlayer';
import { ExerciseVideo } from '@/types';

interface VideoLibraryProps {
  // Se specificato, filtra solo video di un esercizio specifico
  exerciseFilter?: string;
  // Se specificato, filtra solo video di una tecnica specifica  
  techniqueFilter?: string;
  // Modalità compatta (meno controlli)
  compact?: boolean;
}

export function VideoLibrary({
  exerciseFilter,
  techniqueFilter,
  compact = false,
}: VideoLibraryProps) {
  const [videos, setVideos] = useState<ExerciseVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(exerciseFilter || '');
  const [selectedTechnique, setSelectedTechnique] = useState(techniqueFilter || 'all');
  const [techniques, setTechniques] = useState<string[]>([]);
  const [exerciseNames, setExerciseNames] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<ExerciseVideo | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  // Carica i filtri disponibili
  useEffect(() => {
    async function loadFilters() {
      const [techs, names] = await Promise.all([
        getUniqueTechniques(),
        getUniqueExerciseNames(),
      ]);
      setTechniques(techs);
      setExerciseNames(names);
    }
    loadFilters();
  }, []);

  // Carica i video
  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const filters: { exercise_name?: string; technique?: string } = {};
      
      if (searchQuery) {
        filters.exercise_name = searchQuery;
      }
      if (selectedTechnique && selectedTechnique !== 'all') {
        filters.technique = selectedTechnique;
      }

      const result = await searchVideos(filters);
      setVideos(result);

      // Carica thumbnails (prima frame del video)
      // Per ora usiamo il video URL stesso, in futuro potremmo generare thumbnail
      const thumbs: Record<string, string> = {};
      for (const video of result.slice(0, 12)) { // Limita per performance
        const url = await getVideoUrl(video.storage_path);
        if (url) {
          thumbs[video.id] = url;
        }
      }
      setThumbnails(thumbs);
    } catch (err) {
      console.error('Errore caricamento video:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedTechnique]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadVideos();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Header e Filtri */}
      {!compact && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Video className="w-5 h-5" />
              Libreria Video
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              {/* Ricerca esercizio */}
              <div className="flex-1">
                <Label htmlFor="search" className="sr-only">Cerca esercizio</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Cerca per nome esercizio..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    list="exercise-names"
                  />
                  <datalist id="exercise-names">
                    {exerciseNames.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Filtro tecnica */}
              <div className="w-full sm:w-48">
                <Label htmlFor="technique-filter" className="sr-only">Tecnica</Label>
                <Select value={selectedTechnique} onValueChange={setSelectedTechnique}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Tutte le tecniche" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le tecniche</SelectItem>
                    {techniques.map((tech) => (
                      <SelectItem key={tech} value={tech}>
                        {tech}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pulsante cerca */}
              <Button type="submit" variant="outline">
                <Search className="w-4 h-4 mr-2" />
                Cerca
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Empty state */}
      {!loading && videos.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">
              {searchQuery || selectedTechnique !== 'all'
                ? 'Nessun video trovato con questi filtri'
                : 'Nessun video caricato'}
            </p>
            <p className="text-sm text-gray-400">
              Carica video delle tue esecuzioni durante il log degli allenamenti
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grid video */}
      {!loading && videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <Card
              key={video.id}
              className="group cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
              onClick={() => setSelectedVideo(video)}
            >
              {/* Thumbnail / Preview */}
              <div className="relative aspect-video bg-gray-900">
                {thumbnails[video.id] ? (
                  <video
                    src={thumbnails[video.id]}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                    onMouseEnter={(e) => {
                      const target = e.target as HTMLVideoElement;
                      target.currentTime = 0;
                      target.play().catch(() => {});
                    }}
                    onMouseLeave={(e) => {
                      const target = e.target as HTMLVideoElement;
                      target.pause();
                      target.currentTime = 0;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-10 h-10 text-gray-600" />
                  </div>
                )}
                
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-6 h-6 text-gray-900 ml-0.5" />
                  </div>
                </div>

                {/* Duration badge */}
                {video.duration_seconds && (
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white">
                    {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, '0')}
                  </div>
                )}
              </div>

              {/* Info */}
              <CardContent className="p-3">
                <h3 className="font-medium text-sm line-clamp-1 mb-1">
                  {video.exercise_name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                    {video.technique}
                  </span>
                  {video.load_kg && (
                    <span className="flex items-center gap-0.5">
                      <Dumbbell className="w-3 h-3" />
                      {video.load_kg}kg
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  {formatDate(video.recorded_at)}
                  {video.file_size_bytes && (
                    <span className="ml-auto">{formatFileSize(video.file_size_bytes)}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Refresh button */}
      {!loading && videos.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={loadVideos}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Aggiorna
          </Button>
        </div>
      )}

      {/* Video Player Dialog */}
      <VideoPlayerDialog
        video={selectedVideo}
        open={!!selectedVideo}
        onOpenChange={(open) => !open && setSelectedVideo(null)}
        onDelete={() => {
          setSelectedVideo(null);
          loadVideos();
        }}
      />
    </div>
  );
}

