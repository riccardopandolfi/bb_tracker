import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, User as UserIcon, Trash2 } from 'lucide-react';

export function UserSelector() {
    const { users, currentUserId, switchUser, addUser, deleteUser } = useApp();
    const { session } = useAuth();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    
    // Non mostrare il selettore per utenti autenticati
    if (session) {
        return null;
    }

    const handleAddUser = () => {
        if (newUserName.trim()) {
            addUser(newUserName.trim());
            setNewUserName('');
            setIsAddDialogOpen(false);
        }
    };

    const handleDeleteUser = (e: React.MouseEvent, userId: string) => {
        e.stopPropagation();
        e.preventDefault();
        deleteUser(userId);
    };

    const currentUser = users.find(u => u.id === currentUserId);

    return (
        <div className="flex items-center gap-2">
            <Select value={currentUserId} onValueChange={switchUser}>
                <SelectTrigger className="w-10 xl:w-[200px] bg-white/5 border-white/10 text-white px-2 xl:px-3 hover:bg-white/10 transition-colors focus:ring-primary/50">
                    <div className="flex items-center gap-2 justify-center xl:justify-start w-full">
                        <UserIcon className="h-4 w-4 shrink-0" />
                        <span className="hidden xl:inline truncate font-heading">
                            <SelectValue placeholder="Seleziona utente" />
                        </span>
                    </div>
                </SelectTrigger>
                <SelectContent>
                    {users.map((user) => (
                        <SelectItem 
                            key={user.id} 
                            value={user.id}
                        >
                            {user.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {users.length > 1 && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 hover:text-red-400"
                    onClick={(e) => handleDeleteUser(e, currentUserId)}
                    title={`Elimina ${currentUser?.name || 'utente'}`}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}

            <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => setIsAddDialogOpen(true)}
                title="Aggiungi utente"
            >
                <Plus className="h-4 w-4" />
            </Button>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Aggiungi nuovo utente</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input
                                id="name"
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                                placeholder="Es. Mario Rossi"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Annulla
                        </Button>
                        <Button onClick={handleAddUser}>Crea Utente</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
