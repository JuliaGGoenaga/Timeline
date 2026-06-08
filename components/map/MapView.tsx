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
  const mapRef      = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);
  const markers     = useRef<unknown[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (mapInstance.current) return;

    import('leaflet').then((L) => {
      if (!mapRef.current || mapInstance.current) return;

      const map = L.map(mapRef.current, { center: [30, 15], zoom: 3 });

      // Light CartoDB tiles
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map);

      mapInstance.current = map;
    });

    return () => {
      if (mapInstance.current) {
        (mapInstance.current as { remove: () => void }).remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;
    import('leaflet').then((L) => {
      const map = mapInstance.current as ReturnType<typeof L.map>;
      markers.current.forEach((m) => (m as { remove: () => void }).remove());
      markers.current = [];

      entities.forEach((entity) => {
        entity.places.forEach((place) => {
          if (!place.lat || !place.lng) return;

          const color  = DISC[entity.disciplines[0]]?.color ?? '#6b7280';
          const isSel  = entity.id === selectedId;
          const size   = Math.max(10, (entity.importance / 10) * 20);

          const icon = L.divIcon({
            html: `<div style="
              width:${isSel ? size + 5 : size}px;
              height:${isSel ? size + 5 : size}px;
              background:${color};
              border-radius:50%;
              border:${isSel ? '2.5px solid #1f2937' : '2px solid white'};
              opacity:${isSel ? 1 : 0.82};
              box-shadow: 0 2px ${isSel ? 10 : 4}px ${color}55;
            "></div>`,
            className: '',
            iconSize:   [size, size],
            iconAnchor: [size / 2, size / 2],
          });

          const marker = L.marker([place.lat, place.lng], { icon });
          marker.bindPopup(`
            <div style="font-family:system-ui;min-width:160px">
              <div style="font-weight:700;font-size:13px;color:#111827;margin-bottom:2px">${entity.title}</div>
              <div style="font-size:11px;color:#6b7280">${place.name}${place.role ? ` — ${place.role}` : ''}</div>
              <div style="font-size:11px;color:#9ca3af;margin-top:4px">${entity.summary.slice(0, 90)}…</div>
            </div>
          `);
          marker.on('click', () => onSelect(entity.id));
          marker.addTo(map);
          markers.current.push(marker);
        });
      });
    });
  }, [entities, selectedId, onSelect]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
        <div className="bg-white/80 backdrop-blur border border-gray-200 shadow-sm rounded-full px-3 py-1 text-xs text-gray-500">
          Haz clic en un punto para ver el detalle
        </div>
      </div>
    </div>
  );
}
