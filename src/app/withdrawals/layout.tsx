// src/app/withdrawals/layout.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from '@/lib/auth-options';
import Navbar from "@/components/Navbar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Gestione Prelievi',
  description: 'Gestione dei prelievi di cassa del cinema',
}

// In Next.js 15, il layout deve ricevere solo children
export default async function WithdrawalsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (!session.user.isAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}