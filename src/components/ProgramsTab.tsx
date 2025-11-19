import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Plus, Copy, Trash2, Calendar, Layers, CheckCircle2, Pencil, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';

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

  // Define handlers first
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

  // Check if no programs exist
  const hasProgramms = programs && Object.keys(programs).length > 0;

  if (!hasProgramms) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold font-heading">Gestione Programmi</h2>
            <p className="text-muted-foreground">Crea, gestisci e seleziona i tuoi programmi di allenamento</p>
          </div>
        </div>

        {/* Empty State - Large */}
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-20 px-4">
            <div className="rounded-full bg-primary/10 p-4 sm:p-6 mb-4 sm:mb-6">
              <Layers className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-center font-heading">Crea il Tuo Primo Programma</h3>
            <p className="text-muted-foreground text-center mb-6 sm:mb-8 max-w-lg text-base sm:text-lg px-2">
              Inizia il tuo percorso di allenamento creando un programma personalizzato con settimane, giorni ed esercizi.
            </p>
            <Button onClick={() => setShowNewProgramModal(true)} size="lg" className="text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Crea Nuovo Programma
            </Button>
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
      </div>
    );
  }

  const programList = Object.values(programs).sort((a, b) => b.id - a.id); // Newest first

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-heading">Gestione Programmi</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Crea, gestisci e seleziona i tuoi programmi di allenamento</p>
          </div>
          <Button onClick={() => setShowNewProgramModal(true)} size="lg" className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Programma
          </Button>
        </div>

        {/* Programs Grid */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
          {programList.map((program) => {
            const isActive = currentProgramId === program.id;
            const weekCount = Object.keys(program.weeks || {}).length;
            const createdDate = program.createdAt ? format(new Date(program.createdAt), 'dd MMM yyyy', { locale: it }) : 'Data non disponibile';

            return (
              <ProgramCard
                key={program.id}
                program={program}
                isActive={isActive}
                createdDate={createdDate}
                weekCount={weekCount}
                programListLength={programList.length}
                onSelect={() => setCurrentProgram(program.id)}
                onEdit={() => handleOpenEditModal(program.id)}
                onDuplicate={() => handleDuplicateProgram(program.id)}
                onDelete={() => handleDeleteProgram(program.id)}
              />
            );
          })}
        </div>

        {/* Empty State */}
        {programList.length === 0 && (
          <Card>
            <CardContent className="py-8 sm:py-12 text-center px-4">
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">Nessun programma disponibile</p>
              <Button onClick={() => setShowNewProgramModal(true)} className="w-full sm:w-auto">
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

function ProgramCard({
  program,
  isActive,
  createdDate,
  weekCount,
  programListLength,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete
}: {
  program: any;
  isActive: boolean;
  createdDate: string;
  weekCount: number;
  programListLength: number;
  onSelect: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group block h-full w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {isHovered && !isActive && (
          <motion.span
            className="absolute inset-0 h-full w-full bg-neutral-200 dark:bg-slate-800/[0.8] block rounded-xl"
            layoutId="hoverBackground"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: 0.15 },
            }}
            exit={{
              opacity: 0,
              transition: { duration: 0.15, delay: 0.2 },
            }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-20 h-full">
        {isActive ? (
          <div className="relative w-full h-full">
            <div className="absolute -inset-[1px] rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-black opacity-100 blur-sm" />
            </div>
            <Card className="relative bg-card border-black shadow-[0_0_30px_-10px_rgba(0,0,0,0.3)] h-full">
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 flex items-center gap-2">
                <Badge variant="default" className="gap-1 text-xs bg-sky-500 hover:bg-sky-600">
                  <CheckCircle2 className="w-3 h-3" />
                  Attivo
                </Badge>
                <ProgramActionsMenu
                  onEdit={onEdit}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                  canDelete={programListLength > 1}
                />
              </div>

              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-base sm:text-lg pr-24 sm:pr-28 font-heading">{program.name}</CardTitle>
                {program.description && (
                  <CardDescription className="text-xs sm:text-sm line-clamp-2">{program.description}</CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{createdDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                    <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span>{weekCount} settimane</span>
                  </div>
                </div>

                <div className="pt-1 sm:pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="w-full text-xs sm:text-sm border-sky-500/20 text-sky-500 bg-sky-50"
                  >
                    In Uso
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card
            className="relative transition-all min-w-0 w-full h-full bg-card border-black/10 hover:border-transparent"
          >
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
              <ProgramActionsMenu
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                canDelete={programListLength > 1}
              />
            </div>

            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-base sm:text-lg pr-10 sm:pr-12 font-heading">{program.name}</CardTitle>
              {program.description && (
                <CardDescription className="text-xs sm:text-sm line-clamp-2">{program.description}</CardDescription>
              )}
            </CardHeader>

            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">{createdDate}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                  <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>{weekCount} settimane</span>
                </div>
              </div>

              <div className="pt-1 sm:pt-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={onSelect}
                  className="w-full text-xs sm:text-sm shadow-sm hover:shadow-md transition-all"
                >
                  Seleziona
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ProgramActionsMenu({
  onEdit,
  onDuplicate,
  onDelete,
  canDelete
}: {
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-black/5">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Azioni</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
          <Pencil className="mr-2 h-4 w-4" />
          Modifica
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
          <Copy className="mr-2 h-4 w-4" />
          Duplica
        </DropdownMenuItem>
        {canDelete && (
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Elimina
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
