'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { FilterState } from '@/types';
import { ALL_ENTITIES, getEntityById } from '@/lib/data';
import { applyFilters, DEFAULT_FILTERS } from '@/lib/filters';
import EntityPanel from '@/components/EntityPanel';
import FilterPanel from '@/components/FilterPanel';

const TimelineView = dynamic(() => import('@/components/timeline/TimelineView'), {
  ssr: false,
  loading: () => <PanelLoader label="Cargando línea del tiempo…" />,
});
const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => <PanelLoader label="Cargando mapa…" />,
});
const NetworkView = dynamic(() => import('@/components/network/NetworkView'), {
  ssr: false,
  loading: () => <PanelLoader label="Cargando grafo de relaciones…" />,
});

function PanelLoader({ label }: { label: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
      <span className="animate-pulse">{label}</span>
    </div>
  );
}

type ActiveView = 'timeline' | 'map' | 'network';

const VIEW_LABELS: Record<ActiveView, string> = {
  timeline: 'Línea del tiempo',
  map: 'Mapa',
  network: 'Relaciones',
};
const VIEW_ICONS: Record<ActiveView, string> = {
  timeline: '⏱',
  map: '🗺',
  network: '🕸',
};

export default function Home() {
  const [activeView, setActiveView] = useState<ActiveView>('timeline');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredEntities = useMemo(() => applyFilters(ALL_ENTITIES, filters), [filters]);
  const selectedEntity = selectedId ? getEntityById(selectedId) : null;

  const activeFilterCount =
    filters.disciplines.length +
    filters.types.length +
    filters.layers.length +
    (filters.importanceMin > 1 ? 1 : 0) +
    (filters.searchQuery ? 1 : 0);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 z-10 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-base font-bold tracking-tight text-gray-900">
            🌍 Atlas Cronológico Universal
          </span>
          <span className="hidden sm:inline text-xs text-gray-400 border border-gray-200 rounded-full px-2 py-0.5">
            {filteredEntities.length} entidades
          </span>
        </div>

        <nav className="flex items-center gap-1">
          {(Object.keys(VIEW_LABELS) as ActiveView[]).map((v) => (
            <button
              key={v}
              onClick={() => { setActiveView(v); setSelectedId(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeView === v
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>{VIEW_ICONS[v]}</span>
              <span className="hidden sm:inline">{VIEW_LABELS[v]}</span>
            </button>
          ))}
        </nav>

        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            showFilters
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <span>⚙</span>
          <span className="hidden sm:inline">Filtros</span>
          {activeFilterCount > 0 && (
            <span className="bg-white text-violet-600 text-xs rounded-full px-1.5 py-0.5 leading-none font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {showFilters && (
          <div className="w-64 shrink-0 overflow-hidden border-r border-gray-200">
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onClose={() => setShowFilters(false)}
            />
          </div>
        )}

        {/* Full-width visualization — never resized by the detail panel */}
        <div className="flex-1 overflow-hidden relative">
          {activeView === 'timeline' && (
            <TimelineView
              entities={filteredEntities}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
          {activeView === 'map' && (
            <MapView
              entities={filteredEntities}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
          {activeView === 'network' && (
            <NetworkView
              entities={filteredEntities}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}

          {/* ── Floating detail panel — ~1/3 screen width, semi-transparent ── */}
          {selectedEntity && (
            <div
              className="animate-in absolute top-3 right-3 bottom-3 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
              style={{zIndex: 1500}}
              style={{
                width: 'clamp(300px, 33vw, 520px)',
                background: 'rgba(255,255,255,0.60)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.55)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)',
              }}
            >
              <EntityPanel
                entity={selectedEntity}
                onSelectEntity={(id) => setSelectedId(id)}
                onClose={() => setSelectedId(null)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <footer className="px-4 py-1.5 bg-gray-50 border-t border-gray-200 shrink-0 flex items-center gap-4 text-xs text-gray-400">
        <span>{ALL_ENTITIES.length} entidades totales</span>
        <span>·</span>
        <span>{filteredEntities.length} visibles con filtros actuales</span>
        <span className="ml-auto">v1.0 — datos verificados con fuentes académicas</span>
      </footer>
    </div>
  );
}
