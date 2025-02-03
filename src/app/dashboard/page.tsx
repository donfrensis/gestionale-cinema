'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
// import { CalendarDays } from 'lucide-react';
import { EventsTable, CurrentTaskCard, LastHandledCard } from '@/components/Home';
import type { ShowEvent } from '@/components/Home/types';

type DashboardData = {
  todayShows: ShowEvent[];  // cambiato da todayEvents
  currentShow: ShowEvent | null;  // cambiato da currentTask
  lastHandled: ShowEvent | null;
};

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData>({
    todayShows: [],  // cambiato
    currentShow: null,  // cambiato
    lastHandled: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/shows?view=home');  // cambiato da events a shows
        if (!res.ok) throw new Error('Errore nel caricamento dei dati');
        const responseData = await res.json();
        setData(responseData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Caricamento...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push('/login');
    return null;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid gap-8">
        {/* Sezione principale con lo show da gestire */}
        <CurrentTaskCard event={data.currentShow} />

        {/* Ultima chiusura a sinistra, lista shows a destra */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Colonna sinistra: ultimo show gestito */}
          <div className="lg:col-span-1 hidden">
            <LastHandledCard event={data.lastHandled} />
          </div>

          {/* Colonna destra: shows programmati */}
          <div className="lg:col-span-2">
            <EventsTable events={data.todayShows} />
          </div>
        </div>
      </div>
    </main>
  );
}