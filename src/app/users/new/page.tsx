// src/app/users/new/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import UserForm from '@/components/Users/UserForm';

export default async function NewUserPage() {
  const session = await getServerSession(authOptions);
  
  // Verifica che l'utente sia autenticato e sia un amministratore
  if (!session || !session.user.isAdmin) {
    redirect('/');
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Crea Nuovo Utente</h1>
      <UserForm />
    </main>
  );
}