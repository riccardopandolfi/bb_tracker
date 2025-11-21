import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
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
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newUserName, setNewUserName] = useState('');

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

    return (
        <div className="flex items-center gap-2">
            <Select value={currentUserId} onValueChange={switchUser}>
                <SelectTrigger className="w-10 md:w-[200px] bg-white/5 border-white/10 text-white px-2 md:px-3 hover:bg-white/10 transition-colors focus:ring-primary/50">
                    <div className="flex items-center gap-2 justify-center md:justify-start w-full">
                        <UserIcon className="h-4 w-4 shrink-0" />
                        <span className="hidden md:inline truncate font-heading">
                            <SelectValue placeholder="Seleziona utente" />
                        </span>
                    </div>
                </SelectTrigger>
                <SelectContent>
                    {users.map((user) => (
                        <SelectItem key={user.id} value={user.id} className="group" onSelect={(e) => {
                            // Prevent selection if clicking on delete button
                            const target = e.target as HTMLElement;
                            if (target.closest('button')) {
                                e.preventDefault();
                            }
                        }}>
                            <div className="flex items-center justify-between w-full gap-2" onClick={(e) => {
                                // Prevent selection when clicking on delete button area
                                const target = e.target as HTMLElement;
                                if (target.closest('button')) {
                                    e.stopPropagation();
                                }
                            }}>
                                <span>{user.name}</span>
                                {users.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        type="button"
                                        className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
                                        onClick={(e) => handleDeleteUser(e, user.id)}
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

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
