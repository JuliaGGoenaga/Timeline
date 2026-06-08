export * from './entity';

export interface HistoricalPeriod {
  id: string;
  title: string;
  startYear: number;
  endYear: number;
  summary: string;
  color: string;
}

export interface FilterState {
  disciplines: string[];
  periods: string[];
  types: string[];
  regions: string[];
  layers: string[];
  searchQuery: string;
  importanceMin: number;
  validationStatus: string[];
}

export interface ViewMode {
  timeline: boolean;
  map: boolean;
  network: boolean;
}
