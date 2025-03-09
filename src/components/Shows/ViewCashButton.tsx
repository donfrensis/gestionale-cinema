// src/components/Shows/ViewCashButton.tsx
'use client';

import { Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Show } from '@/components/Dashboard/types';

interface ViewCashButtonProps {
  show: Show;
  size?: 'default' | 'sm' | 'lg';
}

export default function ViewCashButton({ show, size = 'default' }: ViewCashButtonProps) {
  return (
    <Button
      size={size}
      variant="secondary"
      className="gap-2"
      asChild
    >
      <Link href={`/shows/${show.id}/cash`}>
        <Euro className="h-4 w-4 mr-2" />
        Visualizza Cassa
      </Link>
    </Button>
  );
}