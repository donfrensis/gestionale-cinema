import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Funzione di utility per formattare i numeri in formato italiano
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

// Funzione alternativa per formattare i numeri senza simbolo valuta
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

// Esempio di utilizzo:
// formatCurrency(1234.56)    → "€ 1.234,56"
// formatNumber(1234.56)      → "1.234,56"
// formatNumber(1234.56789, 3) → "1.234,568"