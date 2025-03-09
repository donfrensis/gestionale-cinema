// src/app/users/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import UserList from '@/components/Users/UserList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  
  // Verifica che l'utente sia autenticato e sia un amministratore
  if (!session || !session.user.isAdmin) {
    redirect('/');
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestione Utenti</h1>
        <Link href="/users/new">
          <Button>Nuovo Utente</Button>
        </Link>
      </div>
      <UserList />
    </main>
  );
}