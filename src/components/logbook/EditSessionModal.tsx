import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { LoggedSet, LoggedSession, ExerciseVideo } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Plus, Trash2, CheckCircle, Video, ChevronDown, X, Loader2 } from 'lucide-react';
import { calculateSessionMetrics, calculateBlockTargetReps } from '@/lib/calculations';
import { getExerciseBlocks } from '@/lib/exerciseUtils';
import { VideoUploader } from '../video/VideoUploader';
import { VideoPlayer } from '../video/VideoPlayer';
import { getVideosForSession, linkVideoToSession, deleteVideo } from '@/lib/videoService';

interface EditSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: LoggedSession;
}

export function EditSessionModal({
  open,
  onOpenChange,
  session,
}: EditSessionModalProps) {
  const { updateLoggedSession, getCurrentWeeks, programs } = useApp();
  const { session: authSession } = useAuth();
  const [tempLogSets, setTempLogSets] = useState<LoggedSet[]>([]);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [blockNotes, setBlockNotes] = useState<string>('');
  
  // Video state
  const [sessionVideos, setSessionVideos] = useState<ExerciseVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [showVideoSection, setShowVideoSection] = useState(false);
  const [pendingVideos, setPendingVideos] = useState<ExerciseVideo[]>([]);
  
  const isAuthenticated = Boolean(authSession);

  useEffect(() => {
    if (open && session) {
      // Initialize with existing sets
      setTempLogSets(session.sets);

      // Initialize session notes
      setSessionNotes(session.notes || '');
      
      // Reset video state
      setPendingVideos([]);
      setShowVideoSection(false);

      // Fetch block notes from program
      const program = programs[session.programId];
      if (program) {
        const week = program.weeks[session.weekNum];
        if (week) {
          for (const day of week.days) {
            const exercise = day.exercises.find(e => e.exerciseName === session.exercise);
            if (exercise) {
              const blocks = getExerciseBlocks(exercise);
              const block = blocks[session.blockIndex];
              if (block && block.notes) {
                setBlockNotes(block.notes);
              } else {
                setBlockNotes('');
              }
              break;
            }
          }
        }
      }
      
      // Load existing videos for this session
      if (isAuthenticated) {
        loadSessionVideos();
      }
    }
  }, [open, session, programs, isAuthenticated]);
  
  const loadSessionVideos = async () => {
    if (!session) return;
    setLoadingVideos(true);
    try {
      const videos = await getVideosForSession(session.id);
      setSessionVideos(videos);
    } catch (err) {
      console.error('Errore caricamento video:', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleUpdateSet = (index: number, field: keyof LoggedSet, value: string) => {
    const updated = [...tempLogSets];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setTempLogSets(updated);
  };

  const handleAddSet = () => {
    const lastSet = tempLogSets[tempLogSets.length - 1];
    const newSetNum = lastSet ? lastSet.setNum + 1 : 1;
    const lastLoad = lastSet?.load || '80';

    if (session.technique === 'Normale') {
      setTempLogSets([
        ...tempLogSets,
        {
          reps: '',
          load: lastLoad,
          rpe: '',
          setNum: newSetNum,
          clusterNum: 1,
        },
      ]);
    } else {
      // For special techniques, add clusters based on existing pattern
      const clustersInLastSet = tempLogSets.filter(s => s.setNum === lastSet.setNum).length;
      const newSets: LoggedSet[] = [];
      for (let clusterNum = 1; clusterNum <= clustersInLastSet; clusterNum++) {
        newSets.push({
          reps: '',
          load: lastLoad,
          rpe: '',
          setNum: newSetNum,
          clusterNum,
        });
      }
      setTempLogSets([...tempLogSets, ...newSets]);
    }
  };

  const handleRemoveSet = (setNum: number) => {
    setTempLogSets(tempLogSets.filter((s) => s.setNum !== setNum));
  };

  const handleSave = async () => {
    const metrics = calculateSessionMetrics(tempLogSets);

    // Ricalcola targetReps se è 0 (per sessioni vecchie)
    let targetReps = session.targetReps;
    if (!targetReps || targetReps === 0) {
      const weeks = getCurrentWeeks();
      const week = weeks[session.weekNum];
      if (week) {
        for (const day of week.days) {
          const exercise = day.exercises.find(e => e.exerciseName === session.exercise);
          if (exercise) {
            const blocks = getExerciseBlocks(exercise);
            const block = blocks[session.blockIndex];
            if (block) {
              targetReps = calculateBlockTargetReps(block);
              break;
            }
          }
        }
      }
    }

    const updatedSession: LoggedSession = {
      ...session,
      sets: tempLogSets,
      totalReps: metrics.totalReps,
      avgRPE: metrics.avgRPE,
      targetReps,
      completion: targetReps > 0 ? (metrics.totalReps / targetReps) * 100 : 0,
      notes: sessionNotes.trim() || undefined,
    };

    updateLoggedSession(updatedSession);
    
    // Collega i nuovi video alla sessione
    if (pendingVideos.length > 0) {
      for (const video of pendingVideos) {
        await linkVideoToSession(video.id, session.id);
      }
    }

    onOpenChange(false);
  };
  
  const handleVideoUploaded = (video: ExerciseVideo) => {
    setPendingVideos((prev) => [...prev, video]);
  };
  
  const handleRemovePendingVideo = (videoId: string) => {
    setPendingVideos((prev) => prev.filter((v) => v.id !== videoId));
  };
  
  const handleDeleteSessionVideo = async (videoId: string) => {
    const success = await deleteVideo(videoId);
    if (success) {
      setSessionVideos((prev) => prev.filter((v) => v.id !== videoId));
    }
  };
  
  // Ottieni il programma per i metadati
  const program = session ? programs[session.programId] : undefined;

  // Group sets by setNum
  const setGroups = tempLogSets.reduce((acc, set) => {
    if (!acc[set.setNum]) acc[set.setNum] = [];
    acc[set.setNum].push(set);
    return acc;
  }, {} as Record<number, LoggedSet[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Modifica Sessione</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {session.exercise} - {session.technique}
            {session.techniqueSchema && ` (${session.techniqueSchema})`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
          {/* Sets */}
          {Object.entries(setGroups).map(([setNumStr, sets]) => {
            const setNum = parseInt(setNumStr, 10);
            return (
              <Card key={setNum} className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-sm font-medium">
                      S{setNum}
                    </span>
                  </h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSet(setNum)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {sets.map((set, clusterIndex) => {
                    const globalIndex = tempLogSets.findIndex(
                      (s) => s.setNum === set.setNum && s.clusterNum === set.clusterNum
                    );

                    return (
                      <div key={clusterIndex} className="flex gap-2 items-end bg-gray-50 p-2 rounded-md">
                        {session.technique !== 'Normale' && (
                          <div className="text-sm font-medium text-gray-600 w-16">
                            C{set.clusterNum}
                          </div>
                        )}
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Reps</Label>
                            <Input
                              type="number"
                              value={set.reps}
                              onChange={(e) =>
                                handleUpdateSet(globalIndex, 'reps', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Carico (kg)</Label>
                            <Input
                              type="text"
                              value={set.load}
                              onChange={(e) =>
                                handleUpdateSet(globalIndex, 'load', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs">RPE</Label>
                            <Input
                              type="number"
                              step="0.5"
                              value={set.rpe}
                              onChange={(e) =>
                                handleUpdateSet(globalIndex, 'rpe', e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}

          {/* Add Set Button */}
          <Button variant="outline" onClick={handleAddSet} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi Set
          </Button>

          {/* Block Notes (from program - read-only) */}
          {blockNotes && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Note dalla Scheda (sola lettura)</Label>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-900 italic">
                {blockNotes}
              </div>
            </div>
          )}

          {/* Session Notes (editable) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Note Sessione (opzionale)</Label>
            <Textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Aggiungi note sulla sessione..."
              className="min-h-[80px]"
            />
          </div>
          
          {/* Video Section - Solo per utenti autenticati */}
          {isAuthenticated && (
            <Collapsible open={showVideoSection} onOpenChange={setShowVideoSection}>
              <div className="border rounded-lg">
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        Video Esecuzione
                        {(sessionVideos.length > 0 || pendingVideos.length > 0) && (
                          <span className="ml-2 px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded">
                            {sessionVideos.length + pendingVideos.length}
                          </span>
                        )}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showVideoSection ? 'rotate-180' : ''}`} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-3 pt-0 space-y-3">
                    {/* Loading */}
                    {loadingVideos && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      </div>
                    )}
                    
                    {/* Video esistenti */}
                    {!loadingVideos && sessionVideos.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-xs text-gray-500">Video salvati</Label>
                        {sessionVideos.map((video) => (
                          <div key={video.id} className="border rounded-lg overflow-hidden">
                            <VideoPlayer
                              video={video}
                              onDelete={() => handleDeleteSessionVideo(video.id)}
                              showControls
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Video pendenti (appena caricati) */}
                    {pendingVideos.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-500">Nuovi video da salvare</Label>
                        {pendingVideos.map((video) => (
                          <div
                            key={video.id}
                            className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <Video className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-700">
                                Nuovo video
                              </span>
                              {video.file_size_bytes && (
                                <span className="text-xs text-green-500">
                                  {(video.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemovePendingVideo(video.id)}
                              className="p-1 hover:bg-green-100 rounded"
                            >
                              <X className="w-4 h-4 text-green-600" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Uploader per nuovi video */}
                    <div className="pt-2 border-t">
                      <Label className="text-xs text-gray-500 mb-2 block">Aggiungi video</Label>
                      <VideoUploader
                        defaultMetadata={{
                          exercise_name: session.exercise,
                          technique: session.technique,
                          reps: session.techniqueSchema || session.repRange,
                          rpe: session.targetRPE,
                          program_name: program?.name,
                          week_num: session.weekNum,
                          logged_session_id: session.id,
                        }}
                        onUploadComplete={handleVideoUploaded}
                        compact
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSave} className="w-full">
            <CheckCircle className="w-4 h-4 mr-2" />
            Salva Modifiche
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
