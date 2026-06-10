import type { Entity, FilterState } from '@/types';
import { parseYear } from './dateUtils';

export const ALL_CONTINENT_IDS = ['europe', 'asia', 'africa', 'americas', 'middle-east', 'oceania', 'global'];

export const DEFAULT_FILTERS: FilterState = {
  disciplines: [],
  periods: [],
  types: [],
  regions: [],
  continents: [...ALL_CONTINENT_IDS],   // all active by default
  layers: [],
  searchQuery: '',
  importanceMin: 1,
  validationStatus: [],
};

// Groups all region string variants (mixed case, hyphenated…) under each continent
export const CONTINENT_REGIONS: Record<string, string[]> = {
  europe: [
    'europe', 'Europe', 'central-europe', 'eastern-europe', 'western-europe',
    'southern-europe', 'northern-europe', 'scandinavia',
  ],
  asia: [
    'asia', 'Asia', 'east-asia', 'southeast-asia', 'central-asia', 'south-asia',
  ],
  africa: [
    'africa', 'Africa', 'north-africa', 'north_africa', 'North Africa',
    'northern-africa', 'sub-saharan-africa', 'west-africa',
  ],
  americas: [
    'americas', 'Americas', 'north-america', 'north_america', 'North America',
    'south-america', 'South America', 'latin-america', 'mesoamerica', 'caribbean',
  ],
  'middle-east': [
    'middle-east', 'Middle East', 'middle_east', 'mediterranean',
    'Mediterranean', 'levant', 'near-east',
  ],
  oceania: ['oceania', 'Oceania', 'australia', 'pacific'],
  global:  ['global', 'Global', 'worldwide'],
};

export const CONTINENTS = [
  { id: 'europe',      label: 'Europa',        flag: '🇪🇺' },
  { id: 'asia',        label: 'Asia',           flag: '🌏' },
  { id: 'africa',      label: 'África',         flag: '🌍' },
  { id: 'americas',    label: 'Américas',       flag: '🌎' },
  { id: 'middle-east', label: 'Oriente Medio',  flag: '🕌' },
  { id: 'oceania',     label: 'Oceanía',        flag: '🦘' },
  { id: 'global',      label: 'Global',         flag: '🌐' },
];

export function applyFilters(entities: Entity[], filters: FilterState): Entity[] {
  // Pre-compute the full set of region strings for selected continents.
  // If all continents are selected (or none), skip the filter entirely.
  const allSelected = filters.continents.length === 0 || filters.continents.length === ALL_CONTINENT_IDS.length;
  const continentRegionSet: Set<string> | null = allSelected
    ? null
    : new Set(filters.continents.flatMap((c) => CONTINENT_REGIONS[c] ?? []));

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

    // Continent filter: entity must have at least one region in the selected set
    if (
      continentRegionSet &&
      !e.regions.some((r) => continentRegionSet.has(r))
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
