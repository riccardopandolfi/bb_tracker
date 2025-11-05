import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Plus, Copy, Trash2, Folder } from 'lucide-react';

export function ProgramSelector() {
  const { programs, currentProgramId, setCurrentProgram, addProgram, duplicateProgram, deleteProgram } = useApp();
  const [showNewProgramModal, setShowNewProgramModal] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');
  const [newProgramDescription, setNewProgramDescription] = useState('');

  const programList = Object.values(programs).sort((a, b) => a.id - b.id);
  const activeProgramId = currentProgramId ?? programList[0]?.id ?? null;
  const currentProgram = activeProgramId != null ? programs[activeProgramId] : undefined;

  if (programList.length === 0 || !currentProgram) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <Folder className="w-8 h-8 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Nessun programma disponibile</h3>
            <p className="text-sm text-muted-foreground">
              Crea il tuo primo programma per iniziare a pianificare le settimane di allenamento.
            </p>
            <Button onClick={() => setShowNewProgramModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Nuovo Programma
            </Button>
          </div>
        </CardContent>

        <Dialog open={showNewProgramModal} onOpenChange={setShowNewProgramModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crea Nuovo Programma</DialogTitle>
              <DialogDescription>
                Crea un nuovo programma di allenamento con settimane, giorni ed esercizi personalizzati.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="program-name">Nome Programma *</Label>
                <Input
                  id="program-name"
                  value={newProgramName}
                  onChange={(e) => setNewProgramName(e.target.value)}
                  placeholder="es. Mesociclo Forza Q1 2025"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="program-description">Descrizione (opzionale)</Label>
                <Input
                  id="program-description"
                  value={newProgramDescription}
                  onChange={(e) => setNewProgramDescription(e.target.value)}
                  placeholder="es. Focus su incremento forza massimale"
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewProgramModal(false)}>
                Annulla
              </Button>
              <Button onClick={() => {
                if (!newProgramName.trim()) {
                  alert('Inserisci un nome per il programma');
                  return;
                }
                addProgram(newProgramName.trim(), newProgramDescription.trim());
                setNewProgramName('');
                setNewProgramDescription('');
                setShowNewProgramModal(false);
              }}>
                Crea Programma
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  const handleCreateProgram = () => {
    if (!newProgramName.trim()) {
      alert('Inserisci un nome per il programma');
      return;
    }

    addProgram(newProgramName.trim(), newProgramDescription.trim());
    setNewProgramName('');
    setNewProgramDescription('');
    setShowNewProgramModal(false);
  };

  const handleDuplicateProgram = () => {
    if (!currentProgram || activeProgramId == null) return;
    if (confirm(`Duplicare il programma "${currentProgram.name}"?`)) {
      duplicateProgram(activeProgramId);
    }
  };

  const handleDeleteProgram = () => {
    if (!currentProgram || activeProgramId == null) return;
    if (confirm(`Eliminare il programma "${currentProgram.name}"?\n\nQuesta azione eliminerà anche tutte le sessioni loggate relative a questo programma.`)) {
      deleteProgram(activeProgramId);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Current Program Display */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">{currentProgram?.name}</h3>
                  {currentProgram?.description && (
                    <p className="text-sm text-muted-foreground">{currentProgram.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDuplicateProgram}>
                  <Copy className="w-4 h-4 mr-1" />
                  Duplica
                </Button>
                {programList.length > 1 && (
                  <Button variant="outline" size="sm" onClick={handleDeleteProgram}>
                    <Trash2 className="w-4 h-4 mr-1 text-red-500" />
                    Elimina
                  </Button>
                )}
              </div>
            </div>

            {/* Program List */}
            {programList.length > 1 && (
              <div className="flex flex-wrap gap-2 items-center pt-4 border-t">
                <span className="text-sm font-medium mr-2">Cambia Programma:</span>
                {programList.map((program) => (
                  <Button
                    key={program.id}
                    variant={activeProgramId === program.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentProgram(program.id)}
                  >
                    {program.name}
                  </Button>
                ))}
                <Button variant="secondary" size="sm" onClick={() => setShowNewProgramModal(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Nuovo Programma
                </Button>
              </div>
            )}

            {/* Add Program Button (if only one program exists) */}
            {programList.length === 1 && (
              <div className="pt-4 border-t">
                <Button variant="outline" size="sm" onClick={() => setShowNewProgramModal(true)} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Crea Nuovo Programma
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* New Program Modal */}
      <Dialog open={showNewProgramModal} onOpenChange={setShowNewProgramModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crea Nuovo Programma</DialogTitle>
            <DialogDescription>
              Crea un nuovo programma di allenamento con settimane, giorni ed esercizi personalizzati.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="program-name">Nome Programma *</Label>
              <Input
                id="program-name"
                value={newProgramName}
                onChange={(e) => setNewProgramName(e.target.value)}
                placeholder="es. Mesociclo Forza Q1 2025"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="program-description">Descrizione (opzionale)</Label>
              <Input
                id="program-description"
                value={newProgramDescription}
                onChange={(e) => setNewProgramDescription(e.target.value)}
                placeholder="es. Focus su incremento forza massimale"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProgramModal(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreateProgram}>
              Crea Programma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
