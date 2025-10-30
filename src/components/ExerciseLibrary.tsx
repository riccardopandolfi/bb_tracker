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

export function ExerciseLibrary() {
  const { exercises, addExercise, updateExercise, deleteExercise, muscleGroups, addMuscleGroup, customTechniques, addCustomTechnique, deleteCustomTechnique } = useApp();
  const [newMuscleGroup, setNewMuscleGroup] = useState('');
  const [showMuscleDialog, setShowMuscleDialog] = useState(false);
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
      addMuscleGroup(newMuscleGroup.trim());
      setNewMuscleGroup('');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold">Libreria Esercizi</h2>
          <p className="text-muted-foreground">Gestisci esercizi, cardio e gruppi muscolari</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={showMuscleDialog} onOpenChange={setShowMuscleDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Gruppo Muscolare
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
                <Button onClick={handleAddMuscleGroup} className="w-full">
                  Aggiungi
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showTechniqueDialog} onOpenChange={setShowTechniqueDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="w-4 h-4 mr-2" />
                Tecnica Personalizzata
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

          <Button onClick={handleAddCardio} variant="secondary" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Cardio
          </Button>
          <Button onClick={handleAddExercise} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Esercizio
          </Button>
        </div>
      </div>

      {/* Info Box */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Ogni esercizio può coinvolgere fino a 3 gruppi muscolari. La somma delle percentuali deve essere 100%.
        </AlertDescription>
      </Alert>

      {/* Custom Techniques Section */}
      {customTechniques.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tecniche Personalizzate</CardTitle>
            <CardDescription>
              {customTechniques.length} tecnica/e personalizzata/e
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {customTechniques.map((tech, index) => (
                <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{tech.name}</div>
                    <div className="text-sm text-muted-foreground">{tech.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {tech.parameters.length} parametro/i: {tech.parameters.map(p => p.label).join(', ')}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteCustomTechnique(tech.name)}
                    className="ml-2"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercise Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {exercises.map((exercise, index) => (
          <ExerciseCard
            key={index}
            exercise={exercise}
            index={index}
            onUpdate={updateExercise}
            onDelete={deleteExercise}
            muscleGroups={muscleGroups}
          />
        ))}
      </div>
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
      [field]: field === 'percent' ? parseInt(value, 10) || 0 : value,
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
    <Card className={!isValid ? 'border-red-500 border-2' : ''}>
      <CardHeader>
        <CardTitle>
          <Input
            value={localExercise.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="font-bold text-lg"
          />
        </CardTitle>
        <CardDescription>
          {localExercise.type === 'cardio' ? 'Esercizio Cardio' : 'Distribuzione Muscolare'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {localExercise.type === 'cardio' ? (
          /* Cardio Equipment */
          <div>
            <Label>Attrezzatura</Label>
            <Select
              value={localExercise.cardioEquipment || 'Cyclette'}
              onValueChange={(value) => handleCardioEquipmentChange(value as CardioEquipment)}
            >
              <SelectTrigger>
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
              <div key={muscleIndex} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label>Muscolo {muscleIndex + 1}</Label>
                  <Select
                    value={muscle.muscle}
                    onValueChange={(value) => handleMuscleChange(muscleIndex, 'muscle', value)}
                  >
                    <SelectTrigger>
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
                <div className="w-24">
                  <Label>%</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={muscle.percent}
                    onChange={(e) => handleMuscleChange(muscleIndex, 'percent', e.target.value)}
                  />
                </div>
                {(localExercise.muscles?.length || 0) > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMuscle(muscleIndex)}
                    className="mb-0"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}

            {/* Add Muscle Button */}
            {(localExercise.muscles?.length || 0) < 3 && (
              <Button variant="outline" size="sm" onClick={handleAddMuscle} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi Muscolo
              </Button>
            )}

            {/* Total Percentage */}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium">Totale:</span>
              <span
                className={`text-sm font-bold ${
                  isValid ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {totalPercent}%
              </span>
            </div>
          </>
        )}

        {/* Delete Exercise */}
        <Button variant="destructive" size="sm" onClick={() => onDelete(index)} className="w-full">
          <Trash2 className="w-4 h-4 mr-2" />
          Elimina Esercizio
        </Button>
      </CardContent>
    </Card>
  );
}
