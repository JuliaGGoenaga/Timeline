'use client';

import { useEffect, useRef } from 'react';
import type { Entity } from '@/types';
import disciplines from '@/data/disciplines.json';

const DISC = Object.fromEntries(disciplines.map((d) => [d.id, d]));

interface Props {
  entities: Entity[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function MapView({ entities, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<unknown>(null);
  const markersRef   = useRef<unknown[]>([]);
  // Keep a stable ref to onSelect so the marker click doesn't capture a stale closure
  const onSelectRef  = useRef(onSelect);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  // ── Init map once ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!containerRef.current) return;

    let destroyed = false;

    import('leaflet').then((L) => {
      if (destroyed || !containerRef.current || mapRef.current) return;

      // Fix default icon paths broken by Webpack/Next.js bundling
      // (needed even though we use divIcon, because leaflet CSS still references them)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current!, {
        center: [25, 15],
        zoom: 2,
        worldCopyJump: true,
      });

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
            '&copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map);

      mapRef.current = map;

      // Leaflet needs the container to have real dimensions.
      // invalidateSize() corrects any 0×0 init that happened before paint.
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

  // ── Update markers whenever entities / selectedId changes ─────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    import('leaflet').then((L) => {
      if (!mapRef.current) return;
      const map = mapRef.current as ReturnType<typeof L.map>;

      // Remove old markers
      markersRef.current.forEach((m) => (m as { remove: () => void }).remove());
      markersRef.current = [];

      entities.forEach((entity) => {
        entity.places.forEach((place) => {
          if (!place.lat || !place.lng) return;

          const color = DISC[entity.disciplines[0]]?.color ?? '#6b7280';
          const isSel = entity.id === selectedId;
          const size  = Math.max(10, Math.round((entity.importance / 10) * 20));
          const s     = isSel ? size + 6 : size;

          const icon = L.divIcon({
            html: `<div style="
              width:${s}px;height:${s}px;
              background:${color};
              border-radius:50%;
              border:${isSel ? '2.5px solid #1f2937' : '1.5px solid rgba(255,255,255,0.9)'};
              opacity:${isSel ? 1 : 0.85};
              box-shadow:0 2px ${isSel ? 10 : 4}px ${color}66;
              cursor:pointer;
            "></div>`,
            className: '',
            iconSize:   [s, s],
            iconAnchor: [s / 2, s / 2],
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
  }, [entities, selectedId]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
        <div className="bg-white/80 backdrop-blur border border-gray-200 shadow-sm rounded-full px-3 py-1 text-xs text-gray-500">
          Haz clic en un punto para ver el detalle
        </div>
      </div>
    </div>
  );
}
