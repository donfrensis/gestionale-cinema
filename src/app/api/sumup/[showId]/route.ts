// src/app/api/sumup/[showId]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { sumUpService } from '@/lib/sumup';

export async function GET(
  request: Request,
  context: { params: Promise<{ showId: string }> }
) {
  // Verifica che l'utente sia autenticato
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }
  
  // Risolviamo i parametri in modo asincrono
  const params = await context.params;
  const showId = params.showId;
  
  try {
    const showIdNumber = parseInt(showId, 10);
    
    if (isNaN(showIdNumber)) {
      return NextResponse.json({ error: 'ID spettacolo non valido' }, { status: 400 });
    }
    
    // Verifica se il servizio è configurato
    if (!sumUpService.isConfigured()) {
      return NextResponse.json(
        { error: 'SumUp non configurato. Configurare SUMUP_API_KEY e SUMUP_MERCHANT_CODE nelle variabili d\'ambiente.' },
        { status: 503 }
      );
    }
    
    // Recupera le transazioni per lo spettacolo
    const data = await sumUpService.getTransactionsForShow(showIdNumber);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Errore nel recupero delle transazioni SumUp:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore sconosciuto' },
      { status: 500 }
    );
  }
}