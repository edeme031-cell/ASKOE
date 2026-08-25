import * as XLSX from "xlsx";
import { daysInMonth, hourLabel, MONTHS } from "./types";
import { emptyMonth } from "./defaults";

/** Парсинг файлу зі структурою "час × дата": перший стовпець — година, далі дні. */
export async function parseMonthFile(
  file: File,
  monthIndex: number,
): Promise<(number | null)[][]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("Файл порожній");
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new Error("Не вдалося прочитати аркуш");
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });

  const days = daysInMonth(monthIndex);
  const md = emptyMonth(monthIndex);

  // знаходимо рядки, що починаються з мітки години
  let hourCursor = 0;
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 2) continue;
    const first = String(row[0] ?? "").trim();
    const m = first.match(/^(\d{1,2})\s*[:.]?\d{0,2}/);
    let hour: number | null = null;
    if (m && m[1] !== undefined && first.includes(":")) hour = Number(m[1]);
    else if (/^\d{1,2}$/.test(first)) hour = Number(first);
    if (hour === null || hour < 0 || hour > 23) continue;
    if (hour === 24) hour = 23;
    hourCursor = hour;
    for (let d = 0; d < days; d++) {
      const raw = row[d + 1];
      if (raw === undefined || raw === null || raw === "") continue;
      const num = typeof raw === "number" ? raw : Number(String(raw).replace(",", ".").replace(/\s/g, ""));
      const target = md[hourCursor];
      if (Number.isFinite(num) && target) target[d] = Math.round(num);
    }
  }
  return md;
}

export function exportMonth(
  monthIndex: number,
  monthData: (number | null)[][],
  extraRows: (string | number)[][] = [],
) {
  const days = daysInMonth(monthIndex);
  const header = ["Година", ...Array.from({ length: days }, (_, d) => String(d + 1))];
  const body = monthData.map((row, h) => [hourLabel(h), ...row.slice(0, days).map((v) => v ?? "")]);
  const ws = XLSX.utils.aoa_to_sheet([header, ...body, [], ...extraRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, MONTHS[monthIndex] ?? "Місяць");
  XLSX.writeFile(wb, `ASKOE_${MONTHS[monthIndex]}.xlsx`);
}

export function exportRows(rows: (string | number)[][], fileName: string, sheet = "Дані") {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  XLSX.writeFile(wb, fileName);
}
