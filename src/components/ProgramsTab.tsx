import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Plus, Copy, Trash2, Calendar, Layers, CheckCircle2, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export function ProgramsTab() {
  const { programs, currentProgramId, setCurrentProgram, addProgram, updateProgram, duplicateProgram, deleteProgram } = useApp();
  const [showNewProgramModal, setShowNewProgramModal] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');
  const [newProgramDescription, setNewProgramDescription] = useState('');

  // Edit modal state
  const [showEditProgramModal, setShowEditProgramModal] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<number | null>(null);
  const [editProgramName, setEditProgramName] = useState('');
  const [editProgramDescription, setEditProgramDescription] = useState('');

  // Safety checks
  if (!programs || Object.keys(programs).length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Gestione Programmi</h2>
            <p className="text-muted-foreground">Caricamento programmi...</p>
          </div>
        </div>
      </div>
    );
  }

  const programList = Object.values(programs).sort((a, b) => b.id - a.id); // Newest first

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

  const handleDuplicateProgram = (programId: number) => {
    const program = programs[programId];
    if (confirm(`Duplicare il programma "${program?.name}"?`)) {
      duplicateProgram(programId);
    }
  };

  const handleDeleteProgram = (programId: number) => {
    if (programList.length === 1) {
      alert('Non puoi eliminare l\'ultimo programma!');
      return;
    }

    const program = programs[programId];
    if (confirm(`Eliminare il programma "${program?.name}"?\n\nQuesta azione eliminerà anche tutte le sessioni loggate relative a questo programma.`)) {
      deleteProgram(programId);
    }
  };

  const handleOpenEditModal = (programId: number) => {
    const program = programs[programId];
    if (program) {
      setEditingProgramId(programId);
      setEditProgramName(program.name);
      setEditProgramDescription(program.description || '');
      setShowEditProgramModal(true);
    }
  };

  const handleEditProgram = () => {
    if (!editProgramName.trim()) {
      alert('Inserisci un nome per il programma');
      return;
    }

    if (editingProgramId !== null) {
      const program = programs[editingProgramId];
      updateProgram(editingProgramId, {
        ...program,
        name: editProgramName.trim(),
        description: editProgramDescription.trim(),
      });
      setShowEditProgramModal(false);
      setEditingProgramId(null);
      setEditProgramName('');
      setEditProgramDescription('');
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Gestione Programmi</h2>
            <p className="text-muted-foreground">Crea, gestisci e seleziona i tuoi programmi di allenamento</p>
          </div>
          <Button onClick={() => setShowNewProgramModal(true)} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Programma
          </Button>
        </div>

        {/* Programs Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {programList.map((program) => {
            const isActive = currentProgramId === program.id;
            const weekCount = Object.keys(program.weeks || {}).length;
            const createdDate = program.createdAt ? format(new Date(program.createdAt), 'dd MMM yyyy', { locale: it }) : 'Data non disponibile';

            return (
              <Card
                key={program.id}
                className={`relative transition-all ${
                  isActive
                    ? 'ring-2 ring-primary shadow-lg'
                    : 'hover:shadow-md'
                }`}
              >
                {isActive && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Attivo
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg pr-20">{program.name}</CardTitle>
                  {program.description && (
                    <CardDescription className="text-sm">{program.description}</CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{createdDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Layers className="w-4 h-4" />
                      <span>{weekCount} settimane</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {!isActive ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setCurrentProgram(program.id)}
                        className="flex-1"
                      >
                        Seleziona
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="flex-1"
                      >
                        In Uso
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditModal(program.id)}
                      title="Modifica"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateProgram(program.id)}
                      title="Duplica"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    {programList.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProgram(program.id)}
                        title="Elimina"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {programList.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Nessun programma disponibile</p>
              <Button onClick={() => setShowNewProgramModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crea il Primo Programma
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

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

      {/* Edit Program Modal */}
      <Dialog open={showEditProgramModal} onOpenChange={setShowEditProgramModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Programma</DialogTitle>
            <DialogDescription>
              Modifica il nome e la descrizione del programma.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-program-name">Nome Programma *</Label>
              <Input
                id="edit-program-name"
                value={editProgramName}
                onChange={(e) => setEditProgramName(e.target.value)}
                placeholder="es. Mesociclo Forza Q1 2025"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-program-description">Descrizione (opzionale)</Label>
              <Input
                id="edit-program-description"
                value={editProgramDescription}
                onChange={(e) => setEditProgramDescription(e.target.value)}
                placeholder="es. Focus su incremento forza massimale"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditProgramModal(false)}>
              Annulla
            </Button>
            <Button onClick={handleEditProgram}>
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
