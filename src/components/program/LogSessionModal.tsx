import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { LoggedSet, LoggedSession, ExerciseVideo, AD_HOC_TECHNIQUE } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Plus, Trash2, CheckCircle, Video, ChevronDown, X } from 'lucide-react';
import { parseSchema, calculateBlockTargetReps, calculateSessionMetrics } from '@/lib/calculations';
import { getExerciseBlocks } from '@/lib/exerciseUtils';
import { VideoUploader } from '../video/VideoUploader';
import { linkVideoToSession } from '@/lib/videoService';

interface LogSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayIndex: number;
  exerciseIndex: number;
  blockIndex?: number | null;
}

export function LogSessionModal({
  open,
  onOpenChange,
  dayIndex,
  exerciseIndex,
  blockIndex,
}: LogSessionModalProps) {
  const { currentWeek, getCurrentWeeks, currentProgramId, programs, addLoggedSession } = useApp();
  const { session } = useAuth();
  const weeks = getCurrentWeeks();
  const week = weeks[currentWeek];
  const day = week?.days[dayIndex];
  const exercise = day?.exercises[exerciseIndex];
  
  // Ottieni il blocco specifico (o il primo se non specificato)
  const blocks = exercise ? getExerciseBlocks(exercise) : [];
  const currentBlockIndex = blockIndex !== null && blockIndex !== undefined ? blockIndex : (blocks.length > 0 ? 0 : null);
  const block = currentBlockIndex !== null ? blocks[currentBlockIndex] : null;

  const [tempLogSets, setTempLogSets] = useState<LoggedSet[]>([]);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [adHocLogText, setAdHocLogText] = useState<string>('');
  const [pendingVideos, setPendingVideos] = useState<ExerciseVideo[]>([]);
  const [showVideoUploader, setShowVideoUploader] = useState(false);
  
  // Verifica se è tecnica Ad Hoc
  const isAdHocTechnique = block?.technique === AD_HOC_TECHNIQUE;
  
  // Controlla se l'utente è autenticato (video disponibili solo per utenti autenticati)
  const isAuthenticated = Boolean(session);

  useEffect(() => {
    if (open && exercise && block) {
      // Initialize temp log sets
      initializeTempSets();
      setSessionNotes('');
      setAdHocLogText('');
      setPendingVideos([]);
      setShowVideoUploader(false);
    }
  }, [open, exercise, block]);

  const initializeTempSets = () => {
    if (!block || !block.technique) return;

    const sets: LoggedSet[] = [];

    if (block.technique === 'Ramping') {
      // Ramping: inizia con 1 set, l'utente ne aggiunge altri finché non raggiunge RPE target
      sets.push({
        reps: block.repsBase || '',
        load: block.startLoad || '80',
        rpe: '',
        setNum: 1,
        clusterNum: 1,
      });
    } else if (block.technique === 'Normale') {
      // Normal technique: N sets
      if (!block.sets) return;
      for (let setNum = 1; setNum <= block.sets; setNum++) {
        sets.push({
          reps: block.repsBase || '',
          load: block.targetLoads?.[setNum - 1] || '80',
          rpe: '',
          setNum,
          clusterNum: 1,
        });
      }
    } else {
      // Special technique: N sets × M clusters
      if (!block.sets) return;
      const clusters = parseSchema(block.techniqueSchema || '');
      if (clusters.length === 0) {
        alert('Schema tecnica non valido!');
        return;
      }

      // Usa targetLoadsByCluster se disponibile, altrimenti fallback a targetLoads
      const loadsByCluster = block.targetLoadsByCluster || 
        (block.targetLoads?.map(load => Array(clusters.length).fill(load)) || 
         Array(block.sets || 1).fill(Array(clusters.length).fill('80')));
      
      for (let setNum = 1; setNum <= block.sets; setNum++) {
        const setLoads = loadsByCluster[setNum - 1] || Array(clusters.length).fill('80');
        for (let clusterNum = 1; clusterNum <= clusters.length; clusterNum++) {
          sets.push({
            reps: clusters[clusterNum - 1]?.toString() || '',
            load: setLoads[clusterNum - 1] || '80',
            rpe: '',
            setNum,
            clusterNum,
          });
        }
      }
    }

    setTempLogSets(sets);
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
    if (!block || !block.technique) return;

    const lastSet = tempLogSets[tempLogSets.length - 1];
    const newSetNum = lastSet ? lastSet.setNum + 1 : 1;
    const lastLoad = lastSet?.load || '80';

    if (block.technique === 'Normale') {
      setTempLogSets([
        ...tempLogSets,
        {
          reps: block.repsBase || '',
          load: lastLoad,
          rpe: '',
          setNum: newSetNum,
          clusterNum: 1,
        },
      ]);
    } else {
      const clusters = parseSchema(block.techniqueSchema || '');
      const newSets: LoggedSet[] = [];
      for (let clusterNum = 1; clusterNum <= clusters.length; clusterNum++) {
        newSets.push({
          reps: clusters[clusterNum - 1]?.toString() || '',
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
    if (!exercise || !block) return;
    if (currentProgramId == null) {
      alert('Seleziona un programma prima di loggare una sessione.');
      return;
    }
    
    // Per tecniche Ad Hoc: solo log testuale
    if (isAdHocTechnique) {
      if (!adHocLogText.trim()) {
        alert('Inserisci il log testuale per questa tecnica Ad Hoc.');
        return;
      }
      
      const sessionId = Date.now();
      const loggedSession: LoggedSession = {
        id: sessionId,
        programId: currentProgramId,
        date: new Date().toISOString().split('T')[0],
        weekNum: currentWeek,
        exercise: exercise.exerciseName,
        dayIndex: dayIndex,
        dayName: day?.name,
        exerciseIndex: exerciseIndex,
        blockIndex: currentBlockIndex !== null ? currentBlockIndex : 0,
        technique: block.technique || AD_HOC_TECHNIQUE,
        techniqueSchema: block.adHocSchema || '',
        repRange: '8-12', // Default per Ad Hoc
        coefficient: block.adHocCoefficient || 1,
        targetLoads: [],
        targetRPE: 0,
        sets: [],
        totalReps: 0,
        targetReps: 0,
        avgRPE: 0,
        completion: 100, // Ad Hoc è sempre "completo" se loggato
        blockRest: block.blockRest,
        notes: sessionNotes.trim() || undefined,
        logText: adHocLogText.trim(),
        adHocSchema: block.adHocSchema,
      };
      
      addLoggedSession(loggedSession);
      
      if (pendingVideos.length > 0) {
        for (const video of pendingVideos) {
          await linkVideoToSession(video.id, sessionId);
        }
      }
      
      onOpenChange(false);
      return;
    }
    
    // Per tecniche normali richiedi repRange, per tecniche speciali no
    const isNormalTechnique = block.technique === 'Normale';
    if (!block.technique || (isNormalTechnique && !block.repRange) || block.coefficient === undefined || block.targetRPE === undefined) return;

    const targetReps = calculateBlockTargetReps(block);
    const metrics = calculateSessionMetrics(tempLogSets);

    const sessionId = Date.now();
    const loggedSession: LoggedSession = {
      id: sessionId,
      programId: currentProgramId,
      date: new Date().toISOString().split('T')[0],
      weekNum: currentWeek,
      exercise: exercise.exerciseName,
      dayIndex: dayIndex,
      dayName: day?.name,
      exerciseIndex: exerciseIndex, // Per distinguere esercizi con stesso nome in posizioni diverse
      blockIndex: currentBlockIndex !== null ? currentBlockIndex : 0,
      technique: block.technique,
      techniqueSchema: block.techniqueSchema || '',
      repRange: isNormalTechnique ? (block.repRange || '8-12') : '8-12', // Solo per normali, altrimenti default (non usato)
      coefficient: block.coefficient,
      // Per tecniche speciali con targetLoadsByCluster, salva i carichi come stringhe separate da '/'
      // Es: ["80/70/60", "70/60/50"] per set con carichi diversi per cluster
      targetLoads: block.targetLoadsByCluster && block.targetLoadsByCluster.length > 0
        ? block.targetLoadsByCluster.map(setLoads => setLoads.join('/'))
        : (block.targetLoads || []),
      targetRPE: block.targetRPE,
      sets: tempLogSets,
      totalReps: metrics.totalReps,
      targetReps,
      avgRPE: metrics.avgRPE,
      completion: targetReps > 0 ? (metrics.totalReps / targetReps) * 100 : 0,
      blockRest: block.blockRest,
      notes: sessionNotes.trim() || undefined,
    };

    addLoggedSession(loggedSession);

    // Collega i video pendenti alla sessione
    if (pendingVideos.length > 0) {
      for (const video of pendingVideos) {
        await linkVideoToSession(video.id, sessionId);
      }
    }

    onOpenChange(false);
  };
  
  const handleVideoUploaded = (video: ExerciseVideo) => {
    setPendingVideos((prev) => [...prev, video]);
    setShowVideoUploader(false);
  };
  
  const handleRemoveVideo = (videoId: string) => {
    setPendingVideos((prev) => prev.filter((v) => v.id !== videoId));
  };
  
  // Ottieni nome programma per i metadati video
  const programName = currentProgramId != null ? programs[currentProgramId]?.name : undefined;

  if (!exercise || !block) return null;

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
          <DialogTitle className="text-base sm:text-lg">Log Sessione</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {exercise.exerciseName} - Blocco {currentBlockIndex !== null ? currentBlockIndex + 1 : 1} - {block.technique}
            {block.techniqueSchema && ` (${block.techniqueSchema})`}
            {blocks.length > 1 && ` - ${blocks.length} blocchi totali`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
          {/* UI speciale per Ad Hoc */}
          {isAdHocTechnique ? (
            <div className="space-y-4">
              {/* Schema Ad Hoc (solo lettura) */}
              {block.adHocSchema && (
                <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                  <Label className="text-xs text-amber-700 font-medium mb-2 block">Schema Pianificato</Label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{block.adHocSchema}</p>
                </div>
              )}
              
              {/* Textarea per log testuale */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Log Testuale</Label>
                <Textarea
                  value={adHocLogText}
                  onChange={(e) => setAdHocLogText(e.target.value)}
                  placeholder="Descrivi come è andata la sessione: set completati, carichi usati, sensazioni..."
                  className="min-h-[150px]"
                />
                <p className="text-xs text-muted-foreground">
                  Per le tecniche Ad Hoc, scrivi liberamente il resoconto della sessione.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Sets - UI standard */}
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
                            {block.technique !== 'Normale' && (
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
            </>
          )}

          {/* Note */}
          <div>
            <Label className="text-sm font-medium mb-2">Note (opzionale)</Label>
            <Textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Aggiungi note sulla sessione..."
              className="min-h-[80px]"
            />
          </div>

          {/* Video Section - Solo per utenti autenticati */}
          {isAuthenticated && (
            <Collapsible open={showVideoUploader} onOpenChange={setShowVideoUploader}>
              <div className="border rounded-lg">
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        Video Esecuzione
                        {pendingVideos.length > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded">
                            {pendingVideos.length}
                          </span>
                        )}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showVideoUploader ? 'rotate-180' : ''}`} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-3 pt-0 space-y-3">
                    {/* Video già caricati */}
                    {pendingVideos.length > 0 && (
                      <div className="space-y-2">
                        {pendingVideos.map((video) => (
                          <div
                            key={video.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <Video className="w-4 h-4 text-primary" />
                              <span className="text-sm text-gray-700 truncate max-w-[200px]">
                                Video caricato
                              </span>
                              {video.file_size_bytes && (
                                <span className="text-xs text-gray-400">
                                  {(video.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveVideo(video.id)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <X className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Uploader */}
                    <VideoUploader
                      defaultMetadata={{
                        exercise_name: exercise?.exerciseName || '',
                        technique: block?.technique || 'Normale',
                        sets: block?.sets,
                        reps: block?.repsBase?.toString() || block?.techniqueSchema,
                        load_kg: block?.targetLoads?.[0] ? parseFloat(block.targetLoads[0]) : undefined,
                        rpe: block?.targetRPE,
                        program_name: programName,
                        week_num: currentWeek,
                      }}
                      onUploadComplete={handleVideoUploaded}
                      compact
                    />
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSave} className="w-full">
            <CheckCircle className="w-4 h-4 mr-2" />
            Salva Sessione
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
