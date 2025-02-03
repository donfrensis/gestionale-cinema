//  src/components/Events/ManageCashButton.tsx
'use client';

import { Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';  // Nota: ora è UI maiuscolo
import { useRouter } from 'next/navigation';
import { ShowEvent } from '@/components/Home/types';  // Riusiamo il tipo che abbiamo creato

interface ManageCashButtonProps {
  event: ShowEvent;
  size?: 'default' | 'sm' | 'lg';
}

export default function ManageCashButton({ event, size = 'default' }: ManageCashButtonProps) {
  const router = useRouter();

  return (
    <Button
      size={size}
      onClick={() => router.push(`/cassa/${event.id}?returnUrl=${encodeURIComponent(window.location.pathname)}`)}
      disabled={event.is_closed || !event.is_manageable}
      variant={event.is_manageable ? 'default' : 'secondary'}
    >
      <Euro className="h-4 w-4 mr-2" />
      {event.is_closed 
        ? 'Cassa Chiusa' 
        : event.is_manageable 
          ? 'Gestisci Cassa'
          : 'In Attesa'
      }
    </Button>
  );
}