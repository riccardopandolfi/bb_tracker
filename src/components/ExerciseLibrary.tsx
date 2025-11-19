import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Exercise, MuscleDistribution, CARDIO_EQUIPMENT, CardioEquipment, CustomTechnique, TechniqueParameter } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Trash2, AlertCircle, Settings2 } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

export function ExerciseLibrary() {
  const { exercises, addExercise, updateExercise, deleteExercise, muscleGroups, addMuscleGroup, updateMuscleGroupColor, deleteMuscleGroup, getMuscleColor, customTechniques, addCustomTechnique, deleteCustomTechnique } = useApp();
  const [newMuscleGroup, setNewMuscleGroup] = useState('');
  const [newMuscleColor, setNewMuscleColor] = useState('#6b7280'); // Default gray
  const [showMuscleDialog, setShowMuscleDialog] = useState(false);
  const [showMuscleGroupsManager, setShowMuscleGroupsManager] = useState(false);
  const [showTechniqueDialog, setShowTechniqueDialog] = useState(false);
  const [newTechnique, setNewTechnique] = useState<CustomTechnique>({
    name: '',
    description: '',
    parameters: [],
  });

  const handleAddExercise = () => {
    const newExercise: Exercise = {
      name: 'Nuovo Esercizio',
      type: 'resistance',
      muscles: [{ muscle: muscleGroups[0] || 'Petto', percent: 100 }],
    };
    addExercise(newExercise);
  };

  const handleAddCardio = () => {
    const newExercise: Exercise = {
      name: 'Nuovo Cardio',
      type: 'cardio',
      cardioEquipment: 'Cyclette',
    };
    addExercise(newExercise);
  };

  const handleAddMuscleGroup = () => {
    if (newMuscleGroup.trim()) {
      addMuscleGroup(newMuscleGroup.trim(), newMuscleColor);
      setNewMuscleGroup('');
      setNewMuscleColor('#6b7280'); // Reset to default
      setShowMuscleDialog(false);
    }
  };

  const handleAddTechniqueParameter = () => {
    const newParam: TechniqueParameter = {
      name: `param${newTechnique.parameters.length + 1}`,
      type: 'number',
      label: 'Nuovo Parametro',
      defaultValue: '',
    };
    setNewTechnique({
      ...newTechnique,
      parameters: [...newTechnique.parameters, newParam],
    });
  };

  const handleUpdateParameter = (index: number, field: keyof TechniqueParameter, value: any) => {
    const updatedParams = [...newTechnique.parameters];
    updatedParams[index] = {
      ...updatedParams[index],
      [field]: value,
    };
    setNewTechnique({
      ...newTechnique,
      parameters: updatedParams,
    });
  };

  const handleRemoveParameter = (index: number) => {
    setNewTechnique({
      ...newTechnique,
      parameters: newTechnique.parameters.filter((_, i) => i !== index),
    });
  };

  const handleSaveTechnique = () => {
    if (newTechnique.name.trim()) {
      addCustomTechnique(newTechnique);
      setNewTechnique({
        name: '',
        description: '',
        parameters: [],
      });
      setShowTechniqueDialog(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Libreria Esercizi</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Gestisci esercizi, cardio e gruppi muscolari</p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <Dialog open={showMuscleGroupsManager} onOpenChange={setShowMuscleGroupsManager}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                <Settings2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Gestisci Gruppi</span>
                <span className="sm:hidden">Gruppi</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Gestione Gruppi Muscolari</DialogTitle>
                <DialogDescription>
                  {muscleGroups.length} gruppo/i muscolare/i disponibile/i. Puoi modificare i colori o eliminare i gruppi non utilizzati.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {muscleGroups.map((muscle) => (
                  <div key={muscle} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Input
                        type="color"
                        value={getMuscleColor(muscle)}
                        onChange={(e) => updateMuscleGroupColor(muscle, e.target.value)}
                        className="w-10 h-10 cursor-pointer flex-shrink-0"
                        title="Cambia colore"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs sm:text-sm truncate">{muscle}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMuscleGroup(muscle)}
                      className="h-8 w-8 flex-shrink-0"
                      title="Elimina gruppo"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showMuscleDialog} onOpenChange={setShowMuscleDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Gruppo Muscolare</span>
                <span className="sm:hidden">Gruppo M.</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuovo Gruppo Muscolare</DialogTitle>
                <DialogDescription>
                  Aggiungi un nuovo gruppo muscolare personalizzato
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome Gruppo Muscolare</Label>
                  <Input
                    value={newMuscleGroup}
                    onChange={(e) => setNewMuscleGroup(e.target.value)}
                    placeholder="es: Deltoidi - Mediale"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddMuscleGroup()}
                  />
                </div>
                <div>
                  <Label>Colore</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={newMuscleColor}
                      onChange={(e) => setNewMuscleColor(e.target.value)}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={newMuscleColor}
                      onChange={(e) => setNewMuscleColor(e.target.value)}
                      placeholder="#6b7280"
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
                <Button onClick={handleAddMuscleGroup} className="w-full">
                  Aggiungi
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showTechniqueDialog} onOpenChange={setShowTechniqueDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                <Settings2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Tecnica Personalizzata</span>
                <span className="sm:hidden">Tecnica</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuova Tecnica Personalizzata</DialogTitle>
                <DialogDescription>
                  Crea una tecnica di allenamento con parametri configurabili
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome Tecnica</Label>
                  <Input
                    value={newTechnique.name}
                    onChange={(e) => setNewTechnique({ ...newTechnique, name: e.target.value })}
                    placeholder="es: Super Drop-Set"
                  />
                </div>
                <div>
                  <Label>Descrizione</Label>
                  <Textarea
                    value={newTechnique.description}
                    onChange={(e) => setNewTechnique({ ...newTechnique, description: e.target.value })}
                    placeholder="Descrivi come funziona questa tecnica..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Parametri</Label>
                    <Button onClick={handleAddTechniqueParameter} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Aggiungi Parametro
                    </Button>
                  </div>

                  {newTechnique.parameters.map((param, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Nome Campo</Label>
                              <Input
                                value={param.name}
                                onChange={(e) => handleUpdateParameter(index, 'name', e.target.value)}
                                placeholder="es: reps"
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Label Visualizzata</Label>
                              <Input
                                value={param.label}
                                onChange={(e) => handleUpdateParameter(index, 'label', e.target.value)}
                                placeholder="es: Ripetizioni"
                                className="h-8"
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveParameter(index)}
                            className="ml-2"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Tipo</Label>
                            <Select
                              value={param.type}
                              onValueChange={(v) => handleUpdateParameter(index, 'type', v as 'number' | 'text' | 'select')}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="number">Numero</SelectItem>
                                <SelectItem value="text">Testo</SelectItem>
                                <SelectItem value="select">Select</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Valore Default</Label>
                            <Input
                              value={param.defaultValue}
                              onChange={(e) => handleUpdateParameter(index, 'defaultValue', e.target.value)}
                              placeholder="Opzionale"
                              className="h-8"
                            />
                          </div>
                        </div>

                        {param.type === 'select' && (
                          <div>
                            <Label className="text-xs">Opzioni (separate da virgola)</Label>
                            <Input
                              value={param.options?.join(', ') || ''}
                              onChange={(e) => handleUpdateParameter(index, 'options', e.target.value.split(',').map(s => s.trim()))}
                              placeholder="es: Basso, Medio, Alto"
                              className="h-8"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {newTechnique.parameters.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nessun parametro. Aggiungi parametri per configurare la tecnica.
                    </p>
                  )}
                </div>

                <Button onClick={handleSaveTechnique} className="w-full">
                  Salva Tecnica
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={handleAddCardio} variant="secondary" size="sm" className="text-xs sm:text-sm">
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Cardio
          </Button>
          <Button onClick={handleAddExercise} size="sm" className="text-xs sm:text-sm">
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Esercizio
          </Button>
        </div>
      </div>

      {/* Info Box */}
      <Alert>
        <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <AlertDescription className="text-xs sm:text-sm">
          Ogni esercizio può coinvolgere fino a 3 gruppi muscolari. La somma delle percentuali deve essere 100%.
        </AlertDescription>
      </Alert>

      {/* Custom Techniques Section */}
      {customTechniques.length > 0 && (
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Tecniche Personalizzate</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {customTechniques.length} tecnica/e personalizzata/e
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="space-y-2">
              {customTechniques.map((tech, index) => (
                <div key={index} className="flex items-start justify-between p-2 sm:p-3 border rounded-lg gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-base truncate">{tech.name}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{tech.description}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                      {tech.parameters.length} parametro/i: {tech.parameters.map(p => p.label).join(', ')}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteCustomTechnique(tech.name)}
                    className="ml-2 h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercise Cards */}
      {exercises.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-20 px-4">
            <div className="rounded-full bg-primary/10 p-4 sm:p-6 mb-4 sm:mb-6">
              <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-center">Libreria Vuota</h3>
            <p className="text-muted-foreground text-center mb-6 sm:mb-8 max-w-lg text-base sm:text-lg px-2">
              Aggiungi i tuoi esercizi preferiti per iniziare a costruire i tuoi programmi di allenamento.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleAddExercise} size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Nuovo Esercizio
              </Button>
              <Button onClick={handleAddCardio} variant="secondary" size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Nuovo Cardio
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
          <AnimatePresence mode="popLayout">
            {exercises.map((exercise, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
                className="min-w-0 w-full"
              >
                <ExerciseCard
                  exercise={exercise}
                  index={index}
                  onUpdate={updateExercise}
                  onDelete={deleteExercise}
                  muscleGroups={muscleGroups}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  onUpdate: (index: number, exercise: Exercise) => void;
  onDelete: (index: number) => void;
  muscleGroups: string[];
}

function ExerciseCard({ exercise, index, onUpdate, onDelete, muscleGroups }: ExerciseCardProps) {
  const [localExercise, setLocalExercise] = useState<Exercise>(exercise);

  const totalPercent = localExercise.muscles?.reduce((sum, m) => sum + m.percent, 0) || 0;
  const isValid = localExercise.type === 'cardio' || totalPercent === 100;

  const handleNameChange = (name: string) => {
    const updated = { ...localExercise, name };
    setLocalExercise(updated);
    onUpdate(index, updated);
  };

  const handleMuscleChange = (muscleIndex: number, field: keyof MuscleDistribution, value: any) => {
    if (!localExercise.muscles) return;
    const updated = { ...localExercise };
    if (!updated.muscles) return;
    updated.muscles[muscleIndex] = {
      ...updated.muscles[muscleIndex],
      [field]: field === 'percent' ? (value === '' ? 0 : parseInt(value, 10) || 0) : value,
    };
    setLocalExercise(updated);
    onUpdate(index, updated);
  };

  const handleAddMuscle = () => {
    if (!localExercise.muscles || localExercise.muscles.length >= 3) return;
    const updated = {
      ...localExercise,
      muscles: [...localExercise.muscles, { muscle: muscleGroups[0] || 'Petto', percent: 0 }],
    };
    setLocalExercise(updated);
    onUpdate(index, updated);
  };

  const handleRemoveMuscle = (muscleIndex: number) => {
    if (!localExercise.muscles || localExercise.muscles.length <= 1) return;
    const updated = {
      ...localExercise,
      muscles: localExercise.muscles.filter((_, i) => i !== muscleIndex),
    };
    setLocalExercise(updated);
    onUpdate(index, updated);
  };

  const handleCardioEquipmentChange = (equipment: CardioEquipment) => {
    const updated = { ...localExercise, cardioEquipment: equipment };
    setLocalExercise(updated);
    onUpdate(index, updated);
  };

  return (
    <Card className={`${!isValid ? 'border-red-500 border-2' : 'border-transparent'} min-w-0 w-full shadow-premium hover:shadow-premium-hover transition-all duration-300`}>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="min-w-0">
          <Input
            value={localExercise.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="font-bold text-base sm:text-lg w-full"
          />
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {localExercise.type === 'cardio' ? 'Esercizio Cardio' : 'Distribuzione Muscolare'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 min-w-0">
        {localExercise.type === 'cardio' ? (
          /* Cardio Equipment */
          <div className="w-full">
            <Label className="text-xs sm:text-sm">Attrezzatura</Label>
            <Select
              value={localExercise.cardioEquipment || 'Cyclette'}
              onValueChange={(value) => handleCardioEquipmentChange(value as CardioEquipment)}
            >
              <SelectTrigger className="text-xs sm:text-sm w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARDIO_EQUIPMENT.map((equipment) => (
                  <SelectItem key={equipment} value={equipment}>
                    {equipment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <>
            {/* Muscles */}
            {localExercise.muscles?.map((muscle, muscleIndex) => (
              <div key={muscleIndex} className="flex gap-1.5 sm:gap-2 items-end w-full">
                <div className="flex-1 min-w-0">
                  <Label className="text-xs sm:text-sm">Muscolo {muscleIndex + 1}</Label>
                  <Select
                    value={muscle.muscle}
                    onValueChange={(value) => handleMuscleChange(muscleIndex, 'muscle', value)}
                  >
                    <SelectTrigger className="text-xs sm:text-sm w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {muscleGroups.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-16 sm:w-20 flex-shrink-0">
                  <Label className="text-xs sm:text-sm">%</Label>
                  <Input
                    type="number"
                    value={muscle.percent === 0 ? '' : muscle.percent}
                    onChange={(e) => handleMuscleChange(muscleIndex, 'percent', e.target.value)}
                    className="text-xs sm:text-sm w-full"
                    min="0"
                    max="100"
                  />
                </div>
                {(localExercise.muscles?.length || 0) > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMuscle(muscleIndex)}
                    className="mb-0 h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}

            {/* Add Muscle Button */}
            {(localExercise.muscles?.length || 0) < 3 && (
              <Button variant="outline" size="sm" onClick={handleAddMuscle} className="w-full text-xs sm:text-sm">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Aggiungi Muscolo
              </Button>
            )}

            {/* Total Percentage */}
            <div className="flex justify-between items-center pt-1.5 sm:pt-2 border-t">
              <span className="text-xs sm:text-sm font-medium">Totale:</span>
              <span
                className={`text-xs sm:text-sm font-bold ${isValid ? 'text-green-600' : 'text-red-600'
                  }`}
              >
                {totalPercent}%
              </span>
            </div>
          </>
        )}

        {/* Delete Exercise */}
        <Button variant="destructive" size="sm" onClick={() => onDelete(index)} className="w-full text-xs sm:text-sm">
          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          Elimina Esercizio
        </Button>
      </CardContent>
    </Card>
  );
}
