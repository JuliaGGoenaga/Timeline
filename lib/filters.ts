import type { Entity, FilterState } from '@/types';
import { parseYear } from './dateUtils';

export const DEFAULT_FILTERS: FilterState = {
  disciplines: [],
  periods: [],
  types: [],
  regions: [],
  layers: [],
  searchQuery: '',
  importanceMin: 1,
  validationStatus: [],
};

export function applyFilters(entities: Entity[], filters: FilterState): Entity[] {
  return entities.filter((e) => {
    if (
      filters.disciplines.length > 0 &&
      !filters.disciplines.some((d) => e.disciplines.includes(d as never))
    )
      return false;

    if (filters.types.length > 0 && !filters.types.includes(e.type)) return false;

    if (filters.layers.length > 0 && !filters.layers.includes(e.layer)) return false;

    if (
      filters.regions.length > 0 &&
      !filters.regions.some((r) => e.regions.includes(r))
    )
      return false;

    if (e.importance < filters.importanceMin) return false;

    if (
      filters.validationStatus.length > 0 &&
      !filters.validationStatus.includes(e.validation.status)
    )
      return false;

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const match =
        e.title.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        (e.tags ?? []).some((t) => t.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });
}

export function filterByYearRange(
  entities: Entity[],
  minYear: number,
  maxYear: number,
): Entity[] {
  return entities.filter((e) => {
    const start = parseYear(e.startDate);
    const end = parseYear(e.endDate) ?? start;
    if (start === null) return false;
    return start <= maxYear && (end ?? start) >= minYear;
  });
}
