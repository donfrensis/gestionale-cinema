//  src/components/Shows/ManageCashButton.tsx
'use client';

import { Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';  // Nota: ora è UI maiuscolo
import { useRouter } from 'next/navigation';
import { Show } from '@/components/Dashboard/types';  // Riusiamo il tipo che abbiamo creato

interface ManageCashButtonProps {
  show: Show;
  size?: 'default' | 'sm' | 'lg';
}

export default function ManageCashButton({ show, size = 'default' }: ManageCashButtonProps) {
  const router = useRouter();

  return (
    <Button
      size={size}
      onClick={() => router.push(`/cassa/${show.id}?returnUrl=${encodeURIComponent(window.location.pathname)}`)}
      disabled={show.is_closed || !show.is_manageable}
      variant={show.is_manageable ? 'default' : 'secondary'}
    >
      <Euro className="h-4 w-4 mr-2" />
      {show.is_closed 
        ? 'Cassa Chiusa' 
        : show.is_manageable 
          ? 'Gestisci Cassa'
          : 'In Attesa'
      }
    </Button>
  );
}