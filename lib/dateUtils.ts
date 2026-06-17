export function parseYear(dateStr: string | number | undefined | null): number | null {
  if (dateStr === undefined || dateStr === null) return null;

  // Numeric dates (e.g. startDate: 1887 or -3000) — used in simplified entities
  if (typeof dateStr === 'number') return isNaN(dateStr) ? null : dateStr;

  const s = String(dateStr);
  if (!s) return null;

  // Negative years (a.C.) start with '-', e.g. "-3100", "-447"
  if (s.startsWith('-')) {
    const n = parseInt(s.slice(1).split('-')[0], 10);
    return isNaN(n) ? null : -n;
  }

  // Positive years: "1789", "1685-03-31" → take the year part
  const n = parseInt(s.split('-')[0], 10);
  return isNaN(n) ? null : n;
}

export function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} a.C.`;
  return `${year} d.C.`;
}

export function yearToPixel(year: number, minYear: number, maxYear: number, width: number): number {
  return ((year - minYear) / (maxYear - minYear)) * width;
}

export function pixelToYear(px: number, minYear: number, maxYear: number, width: number): number {
  return minYear + (px / width) * (maxYear - minYear);
}

export function getYearRange(entities: { startDate?: string }[]): [number, number] {
  const years = entities
    .map((e) => parseYear(e.startDate))
    .filter((y): y is number => y !== null);
  if (years.length === 0) return [-3000, 2025];
  return [Math.min(...years), Math.max(...years)];
}

export function formatDateRange(start?: string, end?: string): string {
  const s = parseYear(start);
  const e = parseYear(end);
  if (!s) return 'Fecha desconocida';
  if (!e) return formatYear(s);
  return `${formatYear(s)} – ${formatYear(e)}`;
}
