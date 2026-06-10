'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import type { Entity } from '@/types';
import disciplines from '@/data/disciplines.json';
import { parseYear } from '@/lib/dateUtils';

const DISC = Object.fromEntries(disciplines.map((d) => [d.id, d]));

const SLIDER_MIN = -3500;
const SLIDER_MAX = 2100;
const STEP = 10;

function fmtYear(y: number): string {
  if (y < 0) return `${Math.abs(y)} a.C.`;
  if (y === 0) return '0';
  return `${y} d.C.`;
}

// ── Custom dual-handle range slider ──────────────────────────────────────────
function DualSlider({
  min, max, step, start, end,
  onChange,
}: {
  min: number; max: number; step: number;
  start: number; end: number;
  onChange: (start: number, end: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<'start' | 'end' | null>(null);

  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  const valueFromClientX = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = min + ratio * (max - min);
    return Math.round(raw / step) * step;
  }, [min, max, step]);

  const onPointerDown = (thumb: 'start' | 'end') =>
    (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragging.current = thumb;
    };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const v = valueFromClientX(e.clientX);
    if (dragging.current === 'start') {
      onChange(Math.min(v, end - step), end);
    } else {
      onChange(start, Math.max(v, start + step));
    }
  };

  const onPointerUp = () => { dragging.current = null; };

  // Also allow clicking on the track itself to move the nearest thumb
  const onTrackClick = (e: React.MouseEvent) => {
    if (dragging.current) return;
    const v = valueFromClientX(e.clientX);
    const dStart = Math.abs(v - start);
    const dEnd   = Math.abs(v - end);
    if (dStart <= dEnd) onChange(Math.min(v, end - step), end);
    else                onChange(start, Math.max(v, start + step));
  };

  const ticks = [-3000, -2000, -1000, 0, 500, 1000, 1500, 1800, 2000];

  return (
    <div>
      {/* Track area */}
      <div
        ref={trackRef}
        className="relative h-6 flex items-center cursor-pointer mx-2"
        onClick={onTrackClick}
      >
        {/* Background */}
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-gray-200" />

        {/* Selected range */}
        <div
          className="absolute h-1.5 rounded-full bg-blue-500 pointer-events-none"
          style={{ left: `${pct(start)}%`, right: `${100 - pct(end)}%` }}
        />

        {/* Start thumb */}
        <div
          className="absolute w-4 h-4 rounded-full bg-white border-2 border-blue-500 shadow-md touch-none"
          style={{ left: `${pct(start)}%`, transform: 'translateX(-50%)', zIndex: 10, cursor: 'grab' }}
          onPointerDown={onPointerDown('start')}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />

        {/* End thumb */}
        <div
          className="absolute w-4 h-4 rounded-full bg-white border-2 border-blue-500 shadow-md touch-none"
          style={{ left: `${pct(end)}%`, transform: 'translateX(-50%)', zIndex: 10, cursor: 'grab' }}
          onPointerDown={onPointerDown('end')}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      </div>

      {/* Tick labels */}
      <div className="relative h-4 mt-0.5 mx-2">
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute text-[9px] text-gray-400 -translate-x-1/2 whitespace-nowrap pointer-events-none"
            style={{ left: `${pct(t)}%` }}
          >
            {t < 0 ? `${Math.abs(t)}aC` : t === 0 ? '0' : t}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── MapView ───────────────────────────────────────────────────────────────────
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

  const [rangeStart, setRangeStart] = useState(SLIDER_MIN);
  const [rangeEnd,   setRangeEnd]   = useState(SLIDER_MAX);

  const visibleEntities = useMemo(() => entities.filter((e) => {
    const s  = parseYear(e.startDate);
    const en = parseYear(e.endDate ?? undefined) ?? s;
    if (s === null) return true;
    return s <= rangeEnd && (en ?? s) >= rangeStart;
  }), [entities, rangeStart, rangeEnd]);

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;
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

  // ── Update markers ─────────────────────────────────────────────────────────
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

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Map */}
      <div ref={containerRef} className="flex-1 min-h-0" />

      {/* ── Time range strip ── */}
      <div className="shrink-0 bg-white border-t border-gray-200 px-4 pt-2 pb-3" style={{ zIndex: 1000 }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Período</span>
          <span className="text-xs font-medium text-blue-700 tabular-nums">
            {fmtYear(rangeStart)} — {fmtYear(rangeEnd)}
          </span>
          <span className="text-xs text-gray-400">{visibleEntities.length} lugares</span>
        </div>

        <DualSlider
          min={SLIDER_MIN} max={SLIDER_MAX} step={STEP}
          start={rangeStart} end={rangeEnd}
          onChange={(s, e) => { setRangeStart(s); setRangeEnd(e); }}
        />
      </div>
    </div>
  );
}
