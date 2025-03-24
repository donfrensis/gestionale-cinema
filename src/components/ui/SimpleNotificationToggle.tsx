// Crea un file temporaneo SimpleNotificationToggle.tsx nella stessa cartella
'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SimpleNotificationToggle() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => alert('Notifiche cliccate')}
      className="flex items-center gap-2"
    >
      <Bell className="h-4 w-4" />
      <span>Notifiche</span>
    </Button>
  );
}