import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Lista di pattern di User Agent per dispositivi mobili
const MOBILE_UA_PATTERNS = [
  /Android/i,
  /webOS/i,
  /iPhone/i,
  /iPad/i,
  /iPod/i,
  /BlackBerry/i,
  /Windows Phone/i,
  /Mobile/i,
];

// Funzione per verificare se il user agent indica un dispositivo mobile
function isMobileDevice(userAgent: string): boolean {
  return MOBILE_UA_PATTERNS.some((pattern) => pattern.test(userAgent));
}

export async function middleware(request: NextRequest) {
  console.log('Middleware eseguito!', request.nextUrl.pathname);
  
  // Ottieni il token dalla sessione
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET 
  });
  
  // Se l'utente non è autenticato, lascia che NextAuth gestisca il redirect
  if (!token) {
    return NextResponse.next();
  }

  // Ottieni il path dalla URL
  const path = request.nextUrl.pathname;
  
  // Ignora API e assets statici
  if (
    path.startsWith('/api/') || 
    path.startsWith('/_next/') || 
    path === '/favicon.ico' ||
    path === '/manifest.json' ||
    path === '/sw.js'
  ) {
    return NextResponse.next();
  }
  
  // Controlla se l'utente è admin
  const isAdmin = token.isAdmin === true;
  
  // Ignora la pagina di primo accesso
  if (path === '/first-access' || path === '/login') {
    return NextResponse.next();
  }
  
  // Pagine riservate solo agli admin
  const adminOnlyPaths = ['/users', '/films', '/withdrawals'];
  
  // Controlla se l'utente sta tentando di accedere a una pagina riservata agli admin
  const isAdminOnlyPath = adminOnlyPaths.some(path => 
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
  );
  
  // Se non è admin ma sta tentando di accedere a una pagina admin-only
  if (!isAdmin && isAdminOnlyPath) {
    console.log('Non-admin trying to access admin page, redirecting to /availability');
    return NextResponse.redirect(new URL('/availability', request.url));
  }
  
  // Controlla se il dispositivo è mobile
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = isMobileDevice(userAgent);
  
  // Logica specifica per dispositivi mobili (non-admin su mobile vedono solo availability)
  if (!isAdmin && isMobile) {
    // Su mobile, gli utenti non-admin possono accedere solo alla pagina availability
    if (path !== '/availability') {
      console.log('Non-admin on mobile, redirecting to /availability');
      return NextResponse.redirect(new URL('/availability', request.url));
    }
  }
  
  return NextResponse.next();
}

// Configura i path su cui eseguire il middleware (opzionale, in quanto stiamo già
// filtrando all'interno del middleware, ma può migliorare le performance)
export const config = {
  matcher: [
    // Proteggi pagine che richiedono autenticazione o hanno logica di routing specifica
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)',
  ],
};