// src/app/withdrawals/page.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from '@/lib/auth-options';
import WithdrawalsDeposits from "@/components/Withdrawals/WithdrawalsDeposits";

export default async function WithdrawalsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (!session.user.isAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Gestione Prelievi e Versamenti</h1>
      <WithdrawalsDeposits />
    </div>
  );
}