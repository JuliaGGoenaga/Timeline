import type { EntityType } from '@/types';

const ICONS: Record<EntityType, string> = {
  person: '👤',
  event: '⚡',
  work: '🎭',
  building: '🏛',
  movement: '🌊',
  style: '🎨',
  invention: '⚙️',
  place: '📍',
  city: '🏙',
  civilization: '🏺',
  institution: '🏫',
  publication: '📖',
  artwork: '🖼',
  technology: '🔧',
  period: '📅',
};

const LABELS: Record<EntityType, string> = {
  person: 'Persona',
  event: 'Acontecimiento',
  work: 'Obra',
  building: 'Edificio',
  movement: 'Movimiento',
  style: 'Estilo',
  invention: 'Invento',
  place: 'Lugar',
  city: 'Ciudad',
  civilization: 'Civilización',
  institution: 'Institución',
  publication: 'Publicación',
  artwork: 'Obra de arte',
  technology: 'Tecnología',
  period: 'Período',
};

export function getEntityIcon(type: EntityType): string {
  return ICONS[type] ?? '•';
}

export function getEntityLabel(type: EntityType): string {
  return LABELS[type] ?? type;
}

export default function EntityTypeIcon({ type }: { type: EntityType }) {
  return (
    <span title={LABELS[type]} className="text-base">
      {ICONS[type] ?? '•'}
    </span>
  );
}
