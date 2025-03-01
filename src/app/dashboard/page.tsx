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

  // Otteniamo tutti gli show per applicare la nostra logica di gestibilità
  const allShows = await prisma.show.findMany({
    include: {
      film: true,
      operator: true,
      cashReport: true
    },
    orderBy: {
      datetime: 'asc'
    }
  });

  // Troviamo lo show corrente da gestire con la stessa logica usata in shows/page.tsx
  let currentShow = null;
  
  // Prima controlliamo se c'è uno show con report aperto ma non chiuso
  currentShow = allShows.find(show => 
    show.cashReport && !show.cashReport.closingDateTime
  );
  
  // Se non c'è, cerchiamo il primo show senza report che non ha show precedenti aperti
  if (!currentShow) {
    for (const show of allShows) {
      if (!show.cashReport) {
        // Verifichiamo che non ci siano show precedenti con report non chiusi o senza report
        const hasPreviousOpenShows = allShows.some(otherShow => 
          otherShow.datetime < show.datetime && 
          ((otherShow.cashReport && !otherShow.cashReport.closingDateTime) || !otherShow.cashReport)
        );
        
        if (!hasPreviousOpenShows) {
          currentShow = show;
          break;
        }
      }
    }
  }

  // Troviamo gli show della settimana cinematografica (manteniamo il codice esistente)
  const weekShows = await prisma.show.findMany({
    where: {
      datetime: {
        gte: getTheatricalWeekStart(),
        lt: new Date(getTheatricalWeekStart().setDate(getTheatricalWeekStart().getDate() + 7))
      }
    },
    include: {
      film: true,
      operator: true,
      cashReport: true
    },
    orderBy: {
      datetime: 'asc'
    }
  });

  // Formattiamo i dati per i componenti
  const formattedWeekShows = weekShows.map(show => {
    // Applichiamo la stessa logica di gestibilità anche qui se necessario
    const hasOpenCashReport = show.cashReport && !show.cashReport.closingDateTime;
    const hasNoCashReport = !show.cashReport;
    const hasNoOpenReportsBefore = !allShows.some(otherShow => 
      otherShow.datetime < show.datetime &&
      ((otherShow.cashReport && !otherShow.cashReport.closingDateTime) || !otherShow.cashReport)
    );
    
    const is_manageable = hasOpenCashReport || (hasNoCashReport && hasNoOpenReportsBefore);
    
    // Ritorniamo l'oggetto formattato come prima, ma con la gestibilità corretta
    return {
      id: show.id,
      datetime: show.datetime.toISOString(),
      film_title: show.film.title,
      operator_name: show.operator?.username,
      is_closed: show.cashReport !== null ? show.cashReport?.closingDateTime !== null : false,
      report_id: show.cashReport?.id,
      // La gestibilità ora è determinata dalla nostra logica, ma manteniamo anche il controllo sull'operatore
      is_manageable: is_manageable && (show.operator?.username === session.user.username || !show.operator)
    };
  });

  // Formattiamo il current show se esiste
  const formattedCurrentShow = currentShow ? {
    id: currentShow.id,
    datetime: currentShow.datetime.toISOString(),
    film_title: currentShow.film.title,
    operator_name: currentShow.operator?.username,
    is_closed: currentShow.cashReport?.closingDateTime !== null,
    report_id: currentShow.cashReport?.id,
    show_timing: (new Date(currentShow.datetime) > new Date() ? 'next' : 'current') as 
      'current' | 'next',
    // Sempre gestibile nel CurrentTaskCard (altrimenti non lo mostreremmo)
    is_manageable: true
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