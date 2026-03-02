// src/app/api/reports/cartellone/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { getBolCartellone, BolCartelloneRow } from '@/lib/bol-service';
import ExcelJS from 'exceljs';

const MESI_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json({ error: 'Parametri from e to obbligatori (DD/MM/YYYY)' }, { status: 400 });
  }

  const result = await getBolCartellone(from, to);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const rows = result.rows;
  const buffer = await buildExcel(rows);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Export_corrispettivi.xlsx"',
    },
  });
}

async function buildExcel(rows: BolCartelloneRow[]): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Corrispettivi BOL');

  // Font Consolas usato in tutto il foglio
  const consolas: Partial<ExcelJS.Font> = { name: 'Consolas', size: 10 };

  // Formato Contabilità (senza simbolo valuta, allineamento contabile standard)
  const accountingFmt = '_-* #,##0.00_-;-* #,##0.00_-;_-* "-"??_-;_-@_-';

  // ── Intestazioni ────────────────────────────────────────────────────────────
  const headers = ['Anno', 'mese', 'Data/Ora', 'Evento', 'Emessi', 'Annullati', 'Venduti', 'Imponibile', 'IVA', 'Totale'];
  const headerRow = sheet.addRow(headers);
  headerRow.font = { ...consolas, bold: true };

  // Formato colonne: data e contabilità
  sheet.getColumn(3).numFmt = 'DD/MM/YYYY HH:MM';
  sheet.getColumn(8).numFmt = accountingFmt;  // Imponibile
  sheet.getColumn(9).numFmt = accountingFmt;  // IVA
  sheet.getColumn(10).numFmt = accountingFmt; // Totale

  // ── Raggruppamento per mese ─────────────────────────────────────────────────
  // Ordina per data crescente prima di raggruppare, altrimenti mesi non contigui
  // creerebbero gruppi separati e i subtotali risulterebbero errati.
  const sortedRows = [...rows].sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

  type MonthGroup = { rows: BolCartelloneRow[]; year: number; month: number };
  const groups: MonthGroup[] = [];
  for (const row of sortedRows) {
    const y = row.datetime.getFullYear();
    const m = row.datetime.getMonth() + 1;
    const last = groups[groups.length - 1];
    if (last && last.year === y && last.month === m) {
      last.rows.push(row);
    } else {
      groups.push({ rows: [row], year: y, month: m });
    }
  }

  const allDataRowNums: number[] = [];

  for (const group of groups) {
    const groupStartDataRow = sheet.rowCount + 1;

    for (const dataRow of group.rows) {
      const excelRowNum = sheet.rowCount + 1;
      const row = sheet.addRow([
        { formula: `YEAR(C${excelRowNum})` },
        { formula: `MONTH(C${excelRowNum})` },
        dataRow.datetime,
        dataRow.titolo,
        dataRow.emessi,
        dataRow.annullati,
        dataRow.venduti,
        dataRow.imponibile,
        dataRow.iva,
        dataRow.totale,
      ]);
      row.getCell(3).numFmt = 'DD/MM/YYYY HH:MM';
      row.font = consolas;
      // outlineLevel = 1 → riga di dettaglio espandibile/collassabile (come Subtotali Excel)
      row.outlineLevel = 1;
      allDataRowNums.push(excelRowNum);
    }

    const groupEndDataRow = sheet.rowCount;

    // Riga subtotale mensile — outlineLevel 0 (sempre visibile, come la riga di riepilogo)
    const meseName = MESI_IT[group.month - 1];
    const subtotalRow = sheet.addRow([
      '',
      meseName,
      '',
      { formula: `"eventi "&SUBTOTAL(3,G${groupStartDataRow}:G${groupEndDataRow})` },
      { formula: `SUBTOTAL(9,E${groupStartDataRow}:E${groupEndDataRow})` },
      { formula: `SUBTOTAL(9,F${groupStartDataRow}:F${groupEndDataRow})` },
      { formula: `SUBTOTAL(9,G${groupStartDataRow}:G${groupEndDataRow})` },
      { formula: `SUBTOTAL(9,H${groupStartDataRow}:H${groupEndDataRow})` },
      { formula: `SUBTOTAL(9,I${groupStartDataRow}:I${groupEndDataRow})` },
      { formula: `SUBTOTAL(9,J${groupStartDataRow}:J${groupEndDataRow})` },
    ]);
    subtotalRow.font = { ...consolas, bold: true };
  }

  // ── Riga totale finale ───────────────────────────────────────────────────────
  if (allDataRowNums.length > 0) {
    const buildRange = (col: string) =>
      allDataRowNums.map(n => `${col}${n}`).join(',');

    const totalRow = sheet.addRow([
      '',
      'Totale',
      '',
      { formula: `"eventi "&SUBTOTAL(3,G${allDataRowNums[0]}:G${allDataRowNums[allDataRowNums.length - 1]})` },
      { formula: `SUBTOTAL(9,${buildRange('E')})` },
      { formula: `SUBTOTAL(9,${buildRange('F')})` },
      { formula: `SUBTOTAL(9,${buildRange('G')})` },
      { formula: `SUBTOTAL(9,${buildRange('H')})` },
      { formula: `SUBTOTAL(9,${buildRange('I')})` },
      { formula: `SUBTOTAL(9,${buildRange('J')})` },
    ]);
    totalRow.font = { ...consolas, bold: true };
  }

  return workbook.xlsx.writeBuffer();
}
