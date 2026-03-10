'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DENOMINATIONS = [
  { label: '50 €', value: 50 },
  { label: '20 €', value: 20 },
  { label: '10 €', value: 10 },
] as const;

interface BanknoteCounterProps {
  onTotalChange: (total: number) => void;
}

export function BanknoteCounter({ onTotalChange }: BanknoteCounterProps) {
  const [quantities, setQuantities] = useState<Record<number, number>>({ 50: 0, 20: 0, 10: 0 });
  const [copied, setCopied] = useState(false);

  const handleChange = (denom: number, raw: string) => {
    const qty = raw === '' ? 0 : Math.max(0, Math.floor(Number(raw)));
    const next = { ...quantities, [denom]: qty };
    setQuantities(next);
    const total = DENOMINATIONS.reduce((sum, d) => sum + d.value * (next[d.value] ?? 0), 0);
    onTotalChange(total);
  };

  const total = DENOMINATIONS.reduce((sum, d) => sum + d.value * (quantities[d.value] ?? 0), 0);

  const handleCopy = async () => {
    const rows = DENOMINATIONS.filter(d => quantities[d.value] > 0).map(d => {
      const qty = quantities[d.value];
      const sub = (d.value * qty).toFixed(2);
      return `${d.value} x ${String(qty).padStart(3)}  =  ${sub} €`;
    });
    if (rows.length === 0) return;
    const text = [...rows, '─'.repeat(24), `Totale    =  ${total.toFixed(2)} €`].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <div className="space-y-2">
      {DENOMINATIONS.map(({ label, value }) => {
        const subtotal = value * (quantities[value] ?? 0);
        return (
          <div key={value} className="flex items-center gap-3">
            <Label className="w-12 text-right shrink-0 text-sm">{label}</Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={quantities[value] === 0 ? '' : quantities[value]}
              onChange={(e) => handleChange(value, e.target.value)}
              placeholder="0"
              className="w-20 text-center"
            />
            <span className="text-sm text-muted-foreground w-24 text-right tabular-nums">
              {subtotal > 0 ? `${subtotal.toFixed(2)} €` : '—'}
            </span>
          </div>
        );
      })}

      <div className="border-t pt-2 flex items-center justify-between">
        <span className="font-semibold text-sm">Totale</span>
        <span className="font-bold text-base tabular-nums">{total.toFixed(2)} €</span>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        disabled={total === 0}
        className="w-full"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 mr-2 text-green-500" />
            Copiato ✓
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 mr-2" />
            Copia distinta
          </>
        )}
      </Button>
    </div>
  );
}
