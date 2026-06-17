'use client';

import type { Entity } from '@/types';
import { formatDateRange } from '@/lib/dateUtils';
import { getRelatedEntities } from '@/lib/data';
import ValidationBadge from './ui/ValidationBadge';
import DisciplineTag from './ui/DisciplineTag';
import EntityTypeIcon, { getEntityLabel } from './ui/EntityTypeIcon';

interface Props {
  entity: Entity;
  onSelectEntity: (id: string) => void;
  onClose: () => void;
}

export default function EntityPanel({ entity, onSelectEntity, onClose }: Props) {
  const related = getRelatedEntities(entity);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-transparent text-gray-900">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-gray-100">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <EntityTypeIcon type={entity.type} />
            <span className="text-xs text-gray-400">{getEntityLabel(entity.type)}</span>
            <ValidationBadge status={entity.validation?.status} />
          </div>
          <h2 className="text-base font-bold leading-tight text-gray-900">{entity.title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDateRange(entity.startDate, entity.endDate ?? undefined)}
            {entity.datePrecision === 'debated' && (
              <span className="ml-1 text-amber-600">(fechas debatidas)</span>
            )}
            {entity.datePrecision === 'approximate' && (
              <span className="ml-1 text-gray-400">(aprox.)</span>
            )}
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Image */}
        {(entity.media ?? []).filter((m) => m.type === 'image').length > 0 && (
          <div className="rounded-xl overflow-hidden border border-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={(entity.media ?? []).find((m) => m.type === 'image')!.url}
              alt={(entity.media ?? []).find((m) => m.type === 'image')!.caption ?? entity.title}
              className="w-full h-36 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            {entity.media![0].caption && (
              <p className="text-xs text-gray-400 p-2 italic">{entity.media![0].caption}</p>
            )}
          </div>
        )}

        {/* Summary */}
        <p className="text-sm text-gray-600 leading-relaxed">{entity.summary}</p>

        {/* Disciplines */}
        <div className="flex flex-wrap gap-1">
          {entity.disciplines.map((d) => (
            <DisciplineTag key={d} id={d} />
          ))}
        </div>

        {/* Description */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Descripción</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{entity.description ?? ''}</p>
        </div>

        {/* Places */}
        {entity.places.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Lugares</h3>
            <ul className="space-y-1">
              {entity.places.map((p, i) => (
                <li key={i} className="text-sm text-gray-600 flex gap-2">
                  <span className="text-gray-300">📍</span>
                  <span>
                    <strong className="text-gray-800">{p.name}</strong>
                    {p.role && <span className="text-gray-400"> — {p.role}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Relations */}
        {related.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Relaciones</h3>
            <ul className="space-y-0.5">
              {entity.relations.map((rel) => {
                const target = related.find((r) => r.id === rel.targetId);
                if (!target) return null;
                return (
                  <li key={rel.targetId}>
                    <button
                      onClick={() => onSelectEntity(rel.targetId)}
                      className="text-sm text-left w-full flex items-start gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <EntityTypeIcon type={target.type} />
                      <span className="flex-1 min-w-0">
                        <span className="text-gray-800 font-medium">{target.title}</span>
                        <span className="block text-xs text-gray-400">
                          {(rel.relationType ?? (rel as never as {type:string}).type ?? '').replace(/_/g, ' ')}
                          {rel.note && ` — ${rel.note}`}
                        </span>
                      </span>
                      {rel.strength && (
                        <span className="text-gray-200 text-xs shrink-0">
                          {Array(rel.strength).fill('●').join('')}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Sources */}
        {(entity.sources ?? []).length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Fuentes</h3>
            <ul className="space-y-2">
              {(entity.sources ?? []).map((s, i) => (
                <li key={i} className="text-xs text-gray-500 border-l-2 border-gray-100 pl-2">
                  <span className="text-gray-700 font-medium">{s.title}</span>
                  {s.author && <span> · {s.author}</span>}
                  {s.publisher && <span> · {s.publisher}</span>}
                  {s.year && <span> ({s.year})</span>}
                  <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    s.reliability === 'high'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {s.reliability === 'high' ? '★ Alta' : '◎ Media'}
                  </span>
                  {s.url && (
                    <a href={s.url} target="_blank" rel="noopener noreferrer"
                      className="ml-1 text-blue-500 hover:text-blue-600">↗</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tags */}
        {entity.tags && entity.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {entity.tags.map((t) => (
              <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
