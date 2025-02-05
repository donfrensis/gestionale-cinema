//  src/app/dashboard/page.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from 'next/navigation';
import { authOptions } from "../api/auth/[...nextauth]/route";
import { ShowsTable, CurrentTaskCard } from '@/components/Dashboard';
import { prisma } from '@/lib/db';

const getTheatricalWeekStart = () => {
 const today = new Date();
 const dayOfWeek = today.getDay();
 const daysToThursday = dayOfWeek >= 4 
   ? dayOfWeek - 4  // Se siamo tra gio e dom, torniamo indietro al giovedì
   : dayOfWeek + 3; // Se siamo tra lun e mer, torniamo indietro al giovedì della settimana precedente
 
 const thursday = new Date(today);
 thursday.setDate(today.getDate() - daysToThursday);
 thursday.setHours(0, 0, 0, 0);
 return thursday;
};

export default async function DashboardPage() {
 const session = await getServerSession(authOptions);
 
 if (!session) {
   redirect('/login');
 }

 // Troviamo la data di oggi (inizio giornata)
 const today = new Date();
 today.setHours(0, 0, 0, 0);

 // Troviamo lo show corrente/prossimo con la logica corretta
 const currentShow = await prisma.show.findFirst({
   where: {
     OR: [
       // Primo show senza report dopo l'ultimo chiuso
       {
         AND: [
           {
             cashReport: null,  // non ha report
           },
           {
             // non esistono show precedenti con cassa non chiusa
             date: {
               gte: today
             },
             NOT: {
               cashReport: {
                 closingDateTime: null
               }
             }
           }
         ]
       },
       // OPPURE show con cassa aperta ma non chiusa
       {
         cashReport: {
           closingDateTime: null,
           
         }
       }
     ]
   },
   include: {
     film: true,
     operator: true,
     cashReport: true
   },
   orderBy: [
     { date: 'asc' },
     { time: 'asc' }
   ],
 });

 // Troviamo gli show della settimana cinematografica
 const weekShows = await prisma.show.findMany({
   where: {
     date: {
       gte: getTheatricalWeekStart(),
       lt: new Date(getTheatricalWeekStart().setDate(getTheatricalWeekStart().getDate() + 7))
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

 // Formattiamo i dati per i componenti
 const formattedWeekShows = weekShows.map(show => ({
   id: show.id,
   date: show.date.toISOString(),
   time: show.time.toString(),
   film_title: show.film.title,
   operator_name: show.operator?.username,
   is_closed: show.cashReport !== null ? show.cashReport?.closingDateTime !== null : false,
   report_id: show.cashReport?.id,
   is_manageable: show.operator?.username === session.user.username
 }));

  console.log('weekShows:', weekShows);
  console.log('formattedWeekShows:', formattedWeekShows);

 const formattedCurrentShow = currentShow ? {
   id: currentShow.id,
   date: currentShow.date.toISOString(),
   time: currentShow.time.toString(),
   film_title: currentShow.film.title,
   operator_name: currentShow.operator?.username,
   is_closed: currentShow.cashReport?.closingDateTime !== null,
   report_id: currentShow.cashReport?.id,
   is_manageable: currentShow.operator?.username === session.user.username
 } : null;

 return (
   <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
     <div>
       <CurrentTaskCard show={formattedCurrentShow} />
     </div>
     <div className="mt-6">
       <ShowsTable shows={formattedWeekShows} />
     </div>
   </main>
 );
}