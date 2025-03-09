// src/app/shows/page.tsx
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db"
import ShowListCard from "@/components/Shows/ShowListCard"
import { calculateTotalFromCashJson } from "@/components/Dashboard/types"

export default async function ShowsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user.isAdmin) {
    redirect("/")
  }

  const shows = await prisma.show.findMany({
    include: {
      film: true,
      operator: true,
      cashReport: {
        include: {
          operator: true
        }
      }
    },
    orderBy: {
      datetime: "desc"
    }
  })

  // Formattiamo i dati per la UI
  const formattedShows = shows.map(show => {
    const localDate = new Date(show.datetime)
    const localDateStr = localDate.getFullYear() + '-' +
      String(localDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(localDate.getDate()).padStart(2, '0') + 'T' +
      String(localDate.getHours()).padStart(2, '0') + ':' +
      String(localDate.getMinutes()).padStart(2, '0') + ':' +
      String(localDate.getSeconds()).padStart(2, '0')

    const is_closed = show.cashReport !== null ? show.cashReport?.closingDateTime !== null : false

    // CASO 1: Ha un report di cassa non chiuso -> gestibile
    const hasOpenCashReport = show.cashReport && !show.cashReport.closingDateTime;
    
    // CASO 2: Non ha report di cassa
    const hasNoCashReport = !show.cashReport;
    
    // CASO 2.1: Non ci sono report di cassa aperti prima di questo show
    const hasNoOpenReportsBefore = !shows.some(otherShow => 
      // Altro show è prima di questo show
      new Date(otherShow.datetime) < new Date(show.datetime) &&
      // E altro show ha un report non chiuso o non ha report
      ((otherShow.cashReport && !otherShow.cashReport.closingDateTime) || !otherShow.cashReport)
    );
    
    // Logica finale: Gestibile se ha un report aperto, oppure se non ha report e non ci sono report aperti prima
    const is_manageable = hasOpenCashReport || (hasNoCashReport && hasNoOpenReportsBefore);

    // Calcolo della quadratura e delle informazioni di cassa
    let cash_difference = undefined;
    let balance_difference = undefined;
    let pos_total = undefined;
    let ticket_total = undefined;
    let subscription_total = undefined;

    // Calcoli solo se c'è un report chiuso
    if (show.cashReport?.closingDateTime && show.cashReport.openingCash && show.cashReport.closingCash) {
      // Calcola i totali di apertura e chiusura
      const openingTotal = calculateTotalFromCashJson(show.cashReport.openingCash);
      const closingTotal = calculateTotalFromCashJson(show.cashReport.closingCash);
      
      // Calcola la differenza di contanti
      cash_difference = Number(closingTotal) - Number(openingTotal);
      
      // Recupera i valori dal report
      pos_total = show.cashReport.posTotal ? Number(show.cashReport.posTotal) : 0;
      ticket_total = show.cashReport.ticketTotal ? Number(show.cashReport.ticketTotal) : 0;
      subscription_total = show.cashReport.subscriptionTotal ? Number(show.cashReport.subscriptionTotal) : 0;
      
      // Calcola gli incassi dichiarati e gli incassi effettivi
      const declaredIncome = ticket_total + subscription_total;
      const actualIncome = cash_difference + pos_total;
      
      // Calcola la differenza di quadratura
      balance_difference = actualIncome - declaredIncome;
    }

    return {
      id: show.id,
      datetime: localDateStr,
      film_title: show.film.title,
      operator_name: show.operator?.username,
      bolId: show.bolId,
      notes: show.notes,
      is_closed,
      report_id: show.cashReport?.id,
      is_manageable,
      // Aggiungi i dati di cassa e quadratura
      cash_difference,
      pos_total,
      ticket_total,
      subscription_total,
      balance_difference
    }
  })

  return (
    <div className="container py-6">
      <ShowListCard shows={formattedShows} />
    </div>
  )
}