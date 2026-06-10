'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import type { Entity } from '@/types';
import disciplines from '@/data/disciplines.json';
import { parseYear } from '@/lib/dateUtils';

const DISC = Object.fromEntries(disciplines.map((d) => [d.id, d]));

// Slider domain — covers all meaningful history
const SLIDER_MIN = -3500;
const SLIDER_MAX = 2100;

function fmtYear(y: number): string {
  if (y <= 0) return `${Math.abs(y) || '0'} a.C.`;
  return `${y} d.C.`;
}

interface Props {
  entities: Entity[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function MapView({ entities, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<unknown>(null);
  const markersRef   = useRef<unknown[]>([]);
  const onSelectRef  = useRef(onSelect);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  // ── Time range filter (local to map) ──────────────────────────────────────
  const [rangeStart, setRangeStart] = useState(SLIDER_MIN);
  const [rangeEnd,   setRangeEnd]   = useState(SLIDER_MAX);

  const visibleEntities = useMemo(() => entities.filter((e) => {
    const s  = parseYear(e.startDate);
    const en = parseYear(e.endDate ?? undefined) ?? s;
    if (s === null) return true;
    return s <= rangeEnd && (en ?? s) >= rangeStart;
  }), [entities, rangeStart, rangeEnd]);

  // ── Init map once ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!containerRef.current) return;
    let destroyed = false;

    import('leaflet').then((L) => {
      if (destroyed || !containerRef.current || mapRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current!, { center: [25, 15], zoom: 2, worldCopyJump: true });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd', maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      requestAnimationFrame(() => {
        if (!destroyed) (map as { invalidateSize: () => void }).invalidateSize();
      });
    });

    return () => {
      destroyed = true;
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
        markersRef.current = [];
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update markers ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    import('leaflet').then((L) => {
      if (!mapRef.current) return;
      const map = mapRef.current as ReturnType<typeof L.map>;
      markersRef.current.forEach((m) => (m as { remove: () => void }).remove());
      markersRef.current = [];

      visibleEntities.forEach((entity) => {
        entity.places.forEach((place) => {
          if (!place.lat || !place.lng) return;
          const color = DISC[entity.disciplines[0]]?.color ?? '#6b7280';
          const isSel = entity.id === selectedId;
          const size  = Math.max(10, Math.round((entity.importance / 10) * 20));
          const s     = isSel ? size + 6 : size;

          const icon = L.divIcon({
            html: `<div style="width:${s}px;height:${s}px;background:${color};border-radius:50%;border:${isSel ? '2.5px solid #1f2937' : '1.5px solid rgba(255,255,255,0.9)'};opacity:${isSel ? 1 : 0.85};box-shadow:0 2px ${isSel ? 10 : 4}px ${color}66;cursor:pointer;"></div>`,
            className: '', iconSize: [s, s], iconAnchor: [s / 2, s / 2],
          });

          const marker = L.marker([place.lat, place.lng], { icon });
          marker.bindPopup(`
            <div style="font-family:system-ui;min-width:170px;max-width:240px">
              <div style="font-weight:700;font-size:13px;color:#111827;margin-bottom:2px">${entity.title}</div>
              <div style="font-size:11px;color:#6b7280">${place.name}${place.role ? ` — ${place.role}` : ''}</div>
              <div style="font-size:11px;color:#9ca3af;margin-top:4px;line-height:1.4">${entity.summary.slice(0, 100)}…</div>
            </div>
          `);
          marker.on('click', () => onSelectRef.current(entity.id));
          marker.addTo(map);
          markersRef.current.push(marker);
        });
      });
    });
  }, [visibleEntities, selectedId]);

  // ── Slider helpers ─────────────────────────────────────────────────────────
  const pct = (v: number) => ((v - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;

  // Tick marks at meaningful centuries/millennia
  const ticks = [-3000, -2000, -1000, 0, 500, 1000, 1500, 1800, 1900, 2000];

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Map */}
      <div ref={containerRef} className="flex-1 min-h-0" />

      {/* ── Time range slider strip ── */}
      <div className="shrink-0 bg-white border-t border-gray-200 px-5 pt-3 pb-4 select-none"
           style={{ zIndex: 1000 }}>

        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Período</span>
          <span className="text-xs font-medium text-gray-800 tabular-nums">
            {fmtYear(rangeStart)} — {fmtYear(rangeEnd)}
          </span>
          <span className="text-xs text-gray-400">{visibleEntities.length} lugares</span>
        </div>

        {/* Slider track + thumbs */}
        <div className="relative h-5 flex items-center">
          {/* Background track */}
          <div className="absolute inset-x-0 h-1.5 rounded-full bg-gray-200" />

          {/* Selected range highlight */}
          <div
            className="absolute h-1.5 rounded-full bg-blue-500"
            style={{ left: `${pct(rangeStart)}%`, right: `${100 - pct(rangeEnd)}%` }}
          />

          {/* Start thumb */}
          <input
            type="range"
            min={SLIDER_MIN} max={SLIDER_MAX} step={10}
            value={rangeStart}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              setRangeStart(Math.min(v, rangeEnd - 10));
            }}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
            style={{ zIndex: rangeStart > SLIDER_MAX - 100 ? 5 : 3 }}
          />

          {/* End thumb */}
          <input
            type="range"
            min={SLIDER_MIN} max={SLIDER_MAX} step={10}
            value={rangeEnd}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              setRangeEnd(Math.max(v, rangeStart + 10));
            }}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
            style={{ zIndex: 4 }}
          />

          {/* Visual thumbs */}
          <div
            className="absolute w-4 h-4 rounded-full bg-white border-2 border-blue-500 shadow pointer-events-none"
            style={{ left: `${pct(rangeStart)}%`, transform: 'translateX(-50%)', zIndex: 6 }}
          />
          <div
            className="absolute w-4 h-4 rounded-full bg-white border-2 border-blue-500 shadow pointer-events-none"
            style={{ left: `${pct(rangeEnd)}%`, transform: 'translateX(-50%)', zIndex: 6 }}
          />
        </div>

        {/* Tick labels */}
        <div className="relative h-4 mt-1">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute text-[9px] text-gray-400 -translate-x-1/2 whitespace-nowrap"
              style={{ left: `${pct(t)}%` }}
            >
              {t <= 0 ? `${Math.abs(t)}aC` : t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
