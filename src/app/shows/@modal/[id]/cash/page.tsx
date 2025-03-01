// src/app/shows/@modal/[id]/cash/page.tsx
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { calculateTotalFromCashJson } from '@/components/Dashboard/types';
import CashFormModal from '@/components/Cash/CashFormModal';
import type { CashReport } from '@prisma/client';

export default async function CashModal({ params }: { params: { id: string } }) {
  // Risolvi i parametri in modo asincrono come nelle altre modali
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);
  
  const session = await getServerSession();
  if (!session?.user) notFound();

  const show = await prisma.show.findUnique({
    where: { id },
    include: {
      film: true,
      operator: true,
      cashReport: true
    }
  });

  if (!show) notFound();

  // Se non c'è report, questa è un'apertura
  const isOpening = !show.cashReport;

  // Trasformiamo i Decimal in numeri JavaScript normali
  // Usiamo un cast di tipo per far contento TypeScript
  let processedCashReport = null;
  if (show.cashReport) {
    processedCashReport = {
      ...show.cashReport,
      posTotal: show.cashReport.posTotal ? Number(show.cashReport.posTotal) : null,
      ticketTotal: show.cashReport.ticketTotal ? Number(show.cashReport.ticketTotal) : null,
      subscriptionTotal: show.cashReport.subscriptionTotal ? Number(show.cashReport.subscriptionTotal) : null
    } as unknown as CashReport;
  }

  // Per l'apertura, verifica l'ultimo report chiuso e i prelievi
  let expectedOpeningTotal = 0;
  if (isOpening) {
    // Trova lo show più recente (in base al datetime) che ha un report di cassa chiuso
    const lastShowWithClosedReport = await prisma.show.findFirst({
      where: {
        cashReport: {
          closingDateTime: { not: null }
        }
      },
      include: {
        cashReport: true
      },
      orderBy: {
        datetime: 'desc'  // Ordina per data dello show, non per data di chiusura
      }
    });

    if (lastShowWithClosedReport?.cashReport?.closingCash) {
      try {
        const lastClosedReport = lastShowWithClosedReport.cashReport;
        
        // Debug dell'ultimo report chiuso
        console.log("Last show with closed report:", {
          showId: lastShowWithClosedReport.id,
          showDateTime: lastShowWithClosedReport.datetime,
          reportId: lastClosedReport.id,
          closingDateTime: lastClosedReport.closingDateTime
        });

        // Calcola il totale dell'ultima chiusura
        const closingTotal = calculateTotalFromCashJson(lastClosedReport.closingCash);
        console.log("Closing cash total calculated:", Number(closingTotal));

        // Trova i prelievi fatti dopo la DATA DELLO SHOW (non dopo la chiusura del report)
        const withdrawals = await prisma.withdrawal.findMany({
          where: {
            createdAt: {
              gte: lastShowWithClosedReport.datetime // Usa datetime dello show
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        });

        console.log("Withdrawals found:", withdrawals.length);
        withdrawals.forEach(w => console.log("Withdrawal:", {
          id: w.id,
          amount: Number(w.amount),
          createdAt: w.createdAt
        }));

        // Sottrai i prelievi dal totale
        const totalWithdrawals = withdrawals.reduce((sum, w) => 
          sum + Number(w.amount), 0
        );
        console.log("Total withdrawals:", totalWithdrawals);

        expectedOpeningTotal = Number(closingTotal) - totalWithdrawals;
        console.log("Expected opening total:", expectedOpeningTotal);
      } catch (error) {
        console.error("Error calculating expected opening total:", error);
      }
    } else {
      console.log("No show with closed cash report found");
    }
  }

  return (
    <CashFormModal
      showId={show.id}
      showTitle={show.film.title}
      showDatetime={show.datetime.toISOString().replace('Z', '')}
      type={isOpening ? 'opening' : 'closing'}
      expectedOpeningTotal={expectedOpeningTotal}
      currentReport={processedCashReport}
    />
  );
}