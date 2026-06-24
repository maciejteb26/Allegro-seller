import * as XLSX from 'xlsx';

export function readSpreadsheetBuffer(buffer: Buffer, fileName: string): string[][] {
  const isCsv = fileName.toLowerCase().endsWith('.csv');
  const workbook = isCsv ? readCsvWorkbook(buffer) : XLSX.read(buffer, { type: 'buffer' });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });
}

function readCsvWorkbook(buffer: Buffer): XLSX.WorkBook {
  let text = buffer.toString('utf8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  const delimiter = semicolons > commas ? ';' : ',';

  return XLSX.read(text, { type: 'string', FS: delimiter });
}

export function rowsToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map((header) => String(header).trim());
  return rows.slice(1).map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (header) record[header] = String(row[index] ?? '').trim();
    });
    return record;
  });
}
