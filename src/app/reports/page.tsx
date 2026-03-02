'use client';

import { useState } from 'react';

function toInputDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

function fromInputDate(value: string): string {
  // "YYYY-MM-DD" → "DD/MM/YYYY"
  const [yyyy, mm, dd] = value.split('-');
  return `${dd}/${mm}/${yyyy}`;
}

export default function ReportsPage() {
  const today = new Date();
  const firstOfYear = new Date(today.getFullYear(), 0, 1);

  const [fromInput, setFromInput] = useState(toInputDate(firstOfYear));
  const [toInput, setToInput] = useState(toInputDate(today));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setError(null);
    setLoading(true);
    try {
      const from = fromInputDate(fromInput);
      const to = fromInputDate(toInput);
      const res = await fetch(`/api/reports/cartellone?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Errore ${res.status}`);
      }
      const blob = await res.blob();
      const now = new Date();
      const yyyymmdd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${yyyymmdd}_Export_corrispettivi.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il download');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reports</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Esportazione corrispettivi</h2>
        <p className="text-sm text-gray-500 mb-4">
          Genera un file Excel con i corrispettivi per titolo ed evento nel periodo selezionato.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dal</label>
            <input
              type="date"
              value={fromInput}
              onChange={e => setFromInput(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Al</label>
            <input
              type="date"
              value={toInput}
              onChange={e => setToInput(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleDownload}
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Generazione in corso…
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              Scarica corrispettivi .xlsx
            </>
          )}
        </button>
      </div>
    </div>
  );
}
