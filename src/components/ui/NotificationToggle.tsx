//  src/components/ui/NotificationToggle.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  isPushNotificationSupported, 
  getSubscription, 
  subscribeToPush, 
  unsubscribeFromPush 
} from '@/lib/push-client';
import { toast } from '@/components/ui/use-toast';

export default function NotificationToggle() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Verifica se le notifiche sono supportate e se l'utente è già iscritto
  useEffect(() => {
    const checkNotificationStatus = async () => {
      const supported = isPushNotificationSupported();
      setIsSupported(supported);
      
      if (supported) {
        const subscription = await getSubscription();
        setIsSubscribed(!!subscription);
      }
      
      setIsLoading(false);
    };
    
    checkNotificationStatus();
  }, []);
  
  // Gestisce la sottoscrizione/cancellazione
  const toggleSubscription = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      if (isSubscribed) {
        await unsubscribeFromPush();
        setIsSubscribed(false);
        toast({
          title: "Notifiche disattivate",
          description: "Non riceverai più notifiche push da questo dispositivo."
        });
      } else {
        await subscribeToPush();
        setIsSubscribed(true);
        toast({
          title: "Notifiche attivate",
          description: "Riceverai notifiche push su questo dispositivo."
        });
      }
    } catch (error) {
      console.error('Errore nella gestione delle notifiche:', error);
      
      toast({
        variant: "destructive",
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile gestire le notifiche"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Se le notifiche non sono supportate, mostra un messaggio
  if (!isSupported) {
    return (
      <div className="flex items-center text-sm text-gray-500">
        <BellOff className="w-4 h-4 mr-1" />
        <span>Notifiche non supportate</span>
      </div>
    );
  }
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleSubscription}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <span className="h-4 w-4 border-2 border-t-transparent border-gray-600 dark:border-gray-300 rounded-full animate-spin" />
      ) : isSubscribed ? (
        <>
          <BellRing className="h-4 w-4" />
          <span>Disattiva notifiche</span>
        </>
      ) : (
        <>
          <Bell className="h-4 w-4" />
          <span>Attiva notifiche</span>
        </>
      )}
    </Button>
  );
}