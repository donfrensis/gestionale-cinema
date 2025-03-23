// src/components/AutoLogout.tsx
'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

interface AutoLogoutProps {
  timeoutMinutes?: number;
  mobileDisabled?: boolean;
  logoutOnWindowClose?: boolean; // Nuovo parametro
}

export default function AutoLogout({ 
  timeoutMinutes = 60, 
  mobileDisabled = true,
  logoutOnWindowClose = true // Default a true
}: AutoLogoutProps) {
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const { data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    // Se non c'è sessione o siamo sulla pagina di login, non fare nulla
    if (!session || pathname === '/login') {
      return;
    }

    // Verifica se è un dispositivo mobile
    const isMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    };

    // Se è mobile e mobileDisabled è true, non fare nulla
    if (mobileDisabled && isMobile()) {
      return;
    }

    // Aggiorna l'ultimo timestamp di attività
    const updateActivity = () => {
      setLastActivity(Date.now());
    };

    // Eventi di interazione utente
    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('touchstart', updateActivity);
    window.addEventListener('scroll', updateActivity);

    // Timer che controlla l'inattività
    const interval = setInterval(() => {
      const inactiveTime = Date.now() - lastActivity;
      const inactiveMinutes = inactiveTime / (1000 * 60);
      
      if (inactiveMinutes >= timeoutMinutes) {
        // Esegui il logout
        signOut({ callbackUrl: `${window.location.origin}/login` });
      }
    }, 60000); // Controlla ogni minuto

    // Handler per logout alla chiusura della finestra
    const handleBeforeUnload = () => {
      if (logoutOnWindowClose && !isMobile()) {
        // Usa fetch sincrono per assicurarsi che la richiesta venga eseguita
        // prima della chiusura della finestra
        const logoutUrl = `${window.location.origin}/api/auth/signout`;
        navigator.sendBeacon(logoutUrl);
      }
    };

    // Aggiungi event listener per beforeunload se logoutOnWindowClose è true
    if (logoutOnWindowClose && !isMobile()) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    // Pulizia
    return () => {
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      
      if (logoutOnWindowClose && !isMobile()) {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
      
      clearInterval(interval);
    };
  }, [lastActivity, timeoutMinutes, pathname, mobileDisabled, session, logoutOnWindowClose]);

  // Non renderizza nulla visivamente
  return null;
}