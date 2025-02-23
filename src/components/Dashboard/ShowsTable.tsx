// src/components/Dashboard/ShowsTable.tsx
import { Clock, Check, AlertCircle, AlertTriangle } from 'lucide-react';
import { type ShowsTableProps, type Show } from './types';

export default function ShowsTable({ shows }: ShowsTableProps) {
  if (!shows?.length) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-center text-gray-500 text-xs">
          Nessun evento programmato
        </div>
      </div>
    );
  }

  // Raggruppa gli eventi per data
  const showsByDate = shows.reduce<Record<string, Show[]>>((acc, show) => {
    const date = new Date(show.datetime)
    const dateString = date.toISOString().split('T')[0]
    if (!acc[dateString]) {
      acc[dateString] = [];
    }
    acc[dateString].push(show);
    return acc;
  }, {});

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const dayMonth = new Intl.DateTimeFormat('it-IT', { 
        day: 'numeric',
        month: 'long'
      }).format(date);
      const weekday = new Intl.DateTimeFormat('it-IT', { 
        weekday: 'long'
      }).format(date);
      return (
        <div className="py-0.5">
          <div>{dayMonth}</div>
          <div className="text-gray-400 text-[11px]">{weekday}</div>
        </div>
      );
    } catch (e) {
      console.error('Error formatting date:', e, dateString);
      return dateString;
    }
  };

  return (
    <div className="border-2 bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b-2 border-red-500">
        <h2 className="text-base font-semibold">Programmazione</h2>
      </div>
      
      <div className="px-4">
        <table className="min-w-full">
          <thead>
            <tr className="text-xs text-gray-500 border-b-2 border-gray-500">
              <th className="py-2 pr-4 text-left font-medium w-32">Data</th>
              <th className="py-2 px-4 text-left font-medium w-20">Ora</th>
              <th className="py-2 px-4 text-left font-medium">Film</th>
              <th className="py-2 px-4 text-left font-medium w-36">Operatore</th>
              <th className="py-2 pl-4 text-right font-medium w-28">Cassa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-400">
            {Object.entries(showsByDate).map(([date, dayShows]) => (
              dayShows.map((show, showIndex) => (
                <tr key={show.id} className="hover:bg-gray-50">
                  {showIndex === 0 && (
                    <td className="pr-4 text-xs font-medium text-gray-500" rowSpan={dayShows.length}>
                      {formatDate(date)}
                    </td>
                  )}
                  <td className="py-1 px-4 text-xs whitespace-nowrap">
                    {new Date(show.datetime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-1 px-4 text-xs whitespace-nowrap">
                    {show.film_title}
                  </td>
                  <td className="py-1 px-4 text-xs text-gray-500 whitespace-nowrap">
                    {show.operator_name ? (
                      <>{show.operator_name}</>
                    ) : (
                      <span className="text-red-600">
                        <AlertTriangle className="inline h-3 w-3" />
                        &nbsp;Scoperto</span>
                    )}
                  </td>
                  <td className="py-1 pl-4 text-right whitespace-nowrap">
                    {show.is_closed ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-0.5" />
                        Chiusa
                      </span>
                    ) : show.report_id ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Clock className="h-3 w-3 mr-0.5" />
                        Aperta
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <AlertCircle className="h-3 w-3 mr-0.5" />
                        Non Aperta
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}