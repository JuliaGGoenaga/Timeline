export function parseYear(dateStr: string | undefined): number | null {
  if (!dateStr) return null;

  // Negative years (a.C.) start with '-', e.g. "-3100", "-447"
  // A plain split('-') on "-3100" gives ["", "3100"] — first token is "" → NaN.
  if (dateStr.startsWith('-')) {
    const n = parseInt(dateStr.slice(1).split('-')[0], 10);
    return isNaN(n) ? null : -n;
  }

  // Positive years: "1789", "1685-03-31" → take the year part
  const n = parseInt(dateStr.split('-')[0], 10);
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
