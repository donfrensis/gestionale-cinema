//  src/components/ui/PwaInstallBanner.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Salva l'evento beforeinstallprompt per usarlo poi
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };
    
    // Verifica se l'app è già installata
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches;
    
    if (!isAppInstalled) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  // Gestisce l'installazione
  const handleInstall = async () => {
    if (!installPrompt) return;
    
    // Mostra il prompt di installazione
    await installPrompt.prompt();
    
    // Aspetta la scelta dell'utente
    const choiceResult = await installPrompt.userChoice;
    
    // Resetta lo stato
    setInstallPrompt(null);
    setIsVisible(false);
    
    // Traccia il risultato
    console.log(`User ${choiceResult.outcome} the installation`);
  };
  
  // Chiude il banner
  const handleClose = () => {
    setIsVisible(false);
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-4 flex items-center justify-between z-50">
      <div className="flex items-center">
        <Download className="h-5 w-5 mr-2" />
        <span>Installa la app per un accesso più rapido</span>
      </div>
      <div className="flex items-center">
        <button
          onClick={handleInstall}
          className="ml-4 px-4 py-1 bg-white text-blue-600 rounded-md"
        >
          Installa
        </button>
        <button
          onClick={handleClose}
          className="ml-2 p-1 text-white hover:bg-blue-700 rounded-full"
          aria-label="Chiudi"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}