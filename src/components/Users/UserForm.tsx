// src/components/Users/UserForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { Eye, EyeOff } from 'lucide-react';

interface User {
  id: number;
  username: string;
  isAdmin: boolean;
  firstAccess: boolean;
  createdAt: string;
}

interface UserFormProps {
  user?: User;
}

export default function UserForm({ user }: UserFormProps) {
  const router = useRouter();
  const isEditMode = !!user;

  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(user?.isAdmin || false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username) {
      setError('Lo username è obbligatorio');
      return;
    }

    if (!isEditMode && (!password || password.length < 8)) {
      setError('La password deve essere di almeno 8 caratteri');
      return;
    }

    try {
      setLoading(true);

      const endpoint = isEditMode 
        ? `/api/users/${user.id}` 
        : '/api/users';
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      const userData = isEditMode 
        ? { username, isAdmin } 
        : { username, password, isAdmin };

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Errore durante il salvataggio');
      }

      toast({
        title: "Successo",
        description: isEditMode 
          ? "Utente aggiornato con successo" 
          : "Nuovo utente creato con successo"
      });

      router.push('/users');
      router.refresh();
    } catch (error) {
      console.error('Errore durante il salvataggio:', error);
      setError(error instanceof Error ? error.message : 'Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Inserisci username"
              required
            />
          </div>

          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="password">Password iniziale</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Inserisci password iniziale"
                  className="pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="isAdmin"
              checked={isAdmin}
              onCheckedChange={setIsAdmin}
            />
            <Label htmlFor="isAdmin">Amministratore</Label>
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/users')}
              disabled={loading}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2" />
              ) : null}
              {isEditMode ? 'Aggiorna' : 'Crea'} Utente
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}