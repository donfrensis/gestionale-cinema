// src/app/page.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from 'next/navigation';
import { authOptions } from "./api/auth/[...nextauth]/route";
import { ShowsTable, CurrentTaskCard, LastHandledCard } from '@/components/Home';
import { prisma } from '@/lib/db';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  if (session.user.firstAccess) {
    redirect('/first-access');
  }

  const shows = await prisma.show.findMany({
    where: {
      date: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    },
    include: {
      film: true,
      operator: true,
      cashReport: true
    },
    orderBy: [
      { date: 'asc' },
      { time: 'asc' }
    ]
  });

  const formattedShows = shows.map(show => ({
    id: show.id,
    date: show.date.toISOString(),
    time: show.time.toString(),
    film_title: show.film.title,
    operator_name: show.operator?.username,
    is_closed: show.cashReport?.closingDateTime !== null,
    report_id: show.cashReport?.id
  }));

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid gap-6 md:grid-cols-2">
        <CurrentTaskCard show={formattedShows.find(e => 
          !e.is_closed && e.operator_name)} />
        <LastHandledCard show={formattedShows.find(e => 
          e.is_closed)} />
      </div>
      <div className="mt-6">
        <ShowsTable shows={formattedShows} />
      </div>
    </main>
  );
}