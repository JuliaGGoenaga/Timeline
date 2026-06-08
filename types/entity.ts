export type EntityType =
  | 'person'
  | 'event'
  | 'work'
  | 'building'
  | 'movement'
  | 'style'
  | 'invention'
  | 'place'
  | 'city'
  | 'civilization'
  | 'institution'
  | 'publication'
  | 'artwork'
  | 'technology'
  | 'period';

export type Discipline =
  | 'architecture'
  | 'art'
  | 'music'
  | 'literature'
  | 'science'
  | 'technology'
  | 'philosophy'
  | 'religion'
  | 'politics'
  | 'economy'
  | 'society'
  | 'urbanism'
  | 'cinema'
  | 'history';

export type DatePrecision = 'exact' | 'year' | 'decade' | 'century' | 'approximate' | 'debated';

export type ValidationStatus = 'verified' | 'partially_verified' | 'needs_review';

export type SourceType = 'book' | 'paper' | 'museum' | 'archive' | 'encyclopedia' | 'database' | 'primary_source';

export type SourceReliability = 'high' | 'medium';

export type RelationType =
  | 'influenced'
  | 'influenced_by'
  | 'collaborated_with'
  | 'opposed'
  | 'contemporary_of'
  | 'part_of'
  | 'evolved_into'
  | 'response_to'
  | 'founded'
  | 'created'
  | 'belonged_to'
  | 'commissioned'
  | 'lived_in'
  | 'caused'
  | 'preceded'
  | 'followed';

export interface Place {
  name: string;
  lat: number;
  lng: number;
  wikidataId?: string;
  geonamesId?: string;
  role?: string;
}

export interface Relation {
  targetId: string;
  relationType: RelationType;
  strength: 1 | 2 | 3 | 4 | 5;
  note?: string;
}

export interface Source {
  title: string;
  author?: string;
  publisher?: string;
  year?: string;
  url?: string;
  type: SourceType;
  reliability: SourceReliability;
  notes?: string;
}

export interface Media {
  type: 'image' | 'audio' | 'video' | 'manuscript' | 'score' | 'map' | 'model3d';
  url: string;
  caption?: string;
  source?: string;
  rights?: string;
}

export interface Validation {
  status: ValidationStatus;
  reviewedBy?: string;
  lastReviewed?: string;
  notes?: string;
}

export interface Entity {
  id: string;
  title: string;
  type: EntityType;
  disciplines: Discipline[];
  historicalPeriods: string[];
  startDate?: string;
  endDate?: string;
  datePrecision: DatePrecision;
  summary: string;
  description: string;
  importance: number; // 1–10
  regions: string[];
  places: Place[];
  relations: Relation[];
  sources: Source[];
  media: Media[];
  validation: Validation;
  layer: 'global' | 'intermediate' | 'detailed';
  tags?: string[];
}
