// src/app/users/edit/[id]/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import UserForm from '@/components/Users/UserForm';
import { prisma } from '@/lib/db';

// Aggiornato per Next.js 15
interface EditUserPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await getServerSession(authOptions);
  
  // Verifica che l'utente sia autenticato e sia un amministratore
  if (!session || !session.user.isAdmin) {
    redirect('/');
  }

  // Accesso asincrono ai parametri in Next.js 15
  const resolvedParams = await params;
  const userId = parseInt(resolvedParams.id);
  if (isNaN(userId)) {
    redirect('/users');
  }

  // Recupera i dati dell'utente
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      isAdmin: true,
      firstAccess: true,
      createdAt: true
    }
  });

  if (!userData) {
    redirect('/users');
  }
  
  // Converti createdAt da Date a string
  const user = {
    ...userData,
    createdAt: userData.createdAt.toISOString()
  };

  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Modifica Utente</h1>
      <UserForm user={user} />
    </main>
  );
}