'use client';

import { useState } from 'react';
import type { FilterState } from '@/types';
import { DEFAULT_FILTERS, CONTINENTS } from '@/lib/filters';
import disciplines from '@/data/disciplines.json';

const ENTITY_TYPES = [
  { id: 'person', label: 'Persona' },
  { id: 'event', label: 'Acontecimiento' },
  { id: 'building', label: 'Edificio' },
  { id: 'movement', label: 'Movimiento' },
  { id: 'invention', label: 'Invento' },
  { id: 'civilization', label: 'Civilización' },
  { id: 'institution', label: 'Institución' },
  { id: 'style', label: 'Estilo' },
  { id: 'period', label: 'Período' },
  { id: 'technology', label: 'Tecnología' },
];

const LAYERS = [
  { id: 'global', label: 'Global' },
  { id: 'intermediate', label: 'Intermedia' },
  { id: 'detailed', label: 'Detallada' },
];

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onClose: () => void;
}

function toggle(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export default function FilterPanel({ filters, onChange, onClose }: Props) {
  const [search, setSearch] = useState(filters.searchQuery);

  const handleSearch = (v: string) => {
    setSearch(v);
    onChange({ ...filters, searchQuery: v });
  };

  const reset = () => {
    setSearch('');
    onChange(DEFAULT_FILTERS);
  };

  const active =
    filters.disciplines.length +
    filters.types.length +
    filters.continents.length +
    filters.layers.length +
    (filters.importanceMin > 1 ? 1 : 0) +
    (filters.searchQuery ? 1 : 0);

  return (
    <div className="flex flex-col h-full bg-white text-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-700">Filtros</span>
          {active > 0 && (
            <span className="bg-violet-100 text-violet-700 text-xs rounded-full px-1.5 py-0.5 font-bold">
              {active}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {active > 0 && (
            <button
              onClick={reset}
              className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              Limpiar
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Search */}
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">Buscar</label>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Nombre, descripción…"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Disciplines */}
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1.5">Disciplina</p>
          <div className="flex flex-wrap gap-1">
            {disciplines.map((d) => {
              const isActive = filters.disciplines.includes(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => onChange({ ...filters, disciplines: toggle(filters.disciplines, d.id) })}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    isActive ? 'text-white border-transparent' : 'text-gray-500 border-gray-200 hover:border-gray-400'
                  }`}
                  style={isActive ? { backgroundColor: d.color, borderColor: d.color } : {}}
                >
                  {d.icon} {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Continents */}
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1.5">Continente / Región</p>
          <div className="flex flex-wrap gap-1">
            {CONTINENTS.map((c) => {
              const isActive = filters.continents.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() =>
                    onChange({ ...filters, continents: toggle(filters.continents, c.id) })
                  }
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'text-gray-500 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {c.flag} {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Types */}
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1.5">Tipo de entidad</p>
          <div className="flex flex-wrap gap-1">
            {ENTITY_TYPES.map((t) => {
              const isActive = filters.types.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => onChange({ ...filters, types: toggle(filters.types, t.id) })}
                  className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'text-gray-500 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Layers */}
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1.5">Capa de detalle</p>
          <div className="flex gap-1">
            {LAYERS.map((l) => {
              const isActive = filters.layers.includes(l.id);
              return (
                <button
                  key={l.id}
                  onClick={() => onChange({ ...filters, layers: toggle(filters.layers, l.id) })}
                  className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                    isActive
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'text-gray-500 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Importance */}
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">
            Importancia mínima:{' '}
            <span className="text-gray-900 font-semibold">{filters.importanceMin}</span>
          </p>
          <input
            type="range"
            min={1}
            max={10}
            value={filters.importanceMin}
            onChange={(e) => onChange({ ...filters, importanceMin: parseInt(e.target.value) })}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>1</span>
            <span>10</span>
          </div>
        </div>
      </div>
    </div>
  );
}
