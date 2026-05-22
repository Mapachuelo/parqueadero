import Papa from "papaparse";

export function generateCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: string[]
): string {
  return Papa.unparse({
    fields: columns,
    data: data.map((row) => {
      const out: Record<string, string> = {};
      for (const col of columns) {
        const val = row[col];
        out[col] = val != null ? String(val) : "";
      }
      return out;
    }),
  });
}

export function parseCsv<T>(csv: string): T[] {
  const result = Papa.parse<T>(csv, {
    header: true,
    skipEmptyLines: true,
  });
  return result.data;
}
