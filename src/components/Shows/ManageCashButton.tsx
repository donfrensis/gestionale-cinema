// src/components/Shows/ManageCashButton.tsx
'use client';

import { Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Show } from '@/components/Dashboard/types';

interface ManageCashButtonProps {
  show: Show;
  size?: 'default' | 'sm' | 'lg';
}

export default function ManageCashButton({ show, size = 'default' }: ManageCashButtonProps) {
  return (
    <Button
      size={size}
      disabled={!show.is_manageable}
      variant={show.is_manageable ? 'default' : 'secondary'}
      className="gap-2"
      asChild
    >
      <Link href={`/shows/${show.id}/cash`}>
        <Euro className="h-4 w-4 mr-2" />
        Gestisci Cassa
      </Link>
    </Button>
  );
}