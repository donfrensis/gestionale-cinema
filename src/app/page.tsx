// src/app/page.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  if (session.user.firstAccess) {
    redirect('/first-access');
  }

  // Se arriviamo qui, l'utente è autenticato e non è al primo accesso
  redirect('/dashboard');
}