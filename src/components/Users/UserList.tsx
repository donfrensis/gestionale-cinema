// src/components/Users/UserList.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Pencil, KeyRound, Search } from 'lucide-react';

interface User {
  id: number;
  username: string;
  isAdmin: boolean;
  firstAccess: boolean;
  createdAt: string;
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(user => 
          user.username.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Errore nel caricamento degli utenti');
      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Errore nel caricamento degli utenti:', error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile caricare gli utenti. Riprova più tardi."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Errore nel reset della password');
      
      toast({
        title: "Successo",
        description: `Password reimpostata per ${selectedUser.username}`
      });
      
      // Aggiorna l'elenco degli utenti per riflettere il cambio di stato firstAccess
      fetchUsers();
    } catch (error) {
      console.error('Errore nel reset della password:', error);
      toast({
        variant: "destructive",
        title: "Errore", 
        description: "Impossibile reimpostare la password. Riprova più tardi."
      });
    } finally {
      setActionLoading(false);
      setResetDialogOpen(false);
      setSelectedUser(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca utente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-md"
          />
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Ruolo</TableHead>
                <TableHead>Stato Password</TableHead>
                <TableHead>Data Creazione</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isAdmin 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        }`}
                      >
                        {user.isAdmin ? 'Amministratore' : 'Operatore'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.firstAccess 
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        }`}
                      >
                        {user.firstAccess ? 'Non Impostata' : 'Impostata'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Link href={`/users/edit/${user.id}`}>
                          <Button variant="outline" size="sm">
                            <Pencil className="h-4 w-4 mr-1" /> Modifica
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setResetDialogOpen(true);
                          }}
                        >
                          <KeyRound className="h-4 w-4 mr-1" /> Reset
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    {searchQuery ? 'Nessun utente trovato' : 'Nessun utente disponibile'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Sei sicuro di voler reimpostare la password per <strong>{selectedUser?.username}</strong>?
            <br /><br />
            utente dovrà impostare una nuova password al prossimo accesso.
          </p>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setResetDialogOpen(false)}
              disabled={actionLoading}
            >
              Annulla
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleResetPassword}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2" />
              ) : null}
              Reset Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}