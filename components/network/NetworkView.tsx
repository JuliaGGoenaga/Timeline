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

export default function NetworkView({ entities, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef   = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const entityMap = new Map(entities.map((e) => [e.id, e]));
    const nodeSet   = new Set<string>();
    const edgesRaw: { from: string; to: string; label: string }[] = [];

    entities.forEach((e) => {
      nodeSet.add(e.id);
      e.relations.forEach((r) => {
        if (entityMap.has(r.targetId)) {
          nodeSet.add(r.targetId);
          edgesRaw.push({ from: e.id, to: r.targetId, label: r.relationType.replace(/_/g, ' ') });
        }
      });
    });

    const nodes = Array.from(nodeSet).map((id) => {
      const e     = entityMap.get(id)!;
      const color = DISC[e?.disciplines[0]]?.color ?? '#6b7280';
      const isSel = id === selectedId;
      return {
        id,
        label:  e?.title ?? id,
        color: {
          background: color + 'cc',
          border:     isSel ? '#1f2937' : color,
          highlight:  { background: color, border: '#1f2937' },
          hover:      { background: color + 'ee', border: color },
        },
        size:        Math.max(12, ((e?.importance ?? 5) / 10) * 30),
        font:        { color: '#374151', size: isSel ? 13 : 11, strokeWidth: 3, strokeColor: '#ffffff' },
        borderWidth: isSel ? 3 : 1.5,
      };
    });

    const edges = edgesRaw.map((e, i) => ({
      id:     i,
      from:   e.from,
      to:     e.to,
      title:  e.label,
      color:  { color: '#d1d5db', highlight: '#6b7280', hover: '#9ca3af' },
      width:  1,
      arrows: { to: { enabled: true, scaleFactor: 0.4 } },
      smooth: { enabled: true, type: 'dynamic' as const, roundness: 0.4 },
    }));

    import('vis-network').then(({ Network, DataSet }) => {
      if (!containerRef.current) return;
      if (networkRef.current) (networkRef.current as { destroy: () => void }).destroy();

      const net = new Network(
        containerRef.current,
        { nodes: new DataSet(nodes), edges: new DataSet(edges) },
        {
          physics: {
            stabilization: { iterations: 150 },
            barnesHut: { gravitationalConstant: -4000, springLength: 130 },
          },
          interaction: { hover: true, tooltipDelay: 100 },
          layout:      { improvedLayout: true },
          nodes:       { shape: 'dot' },
        }
      );

      net.on('click', (params) => {
        if (params.nodes.length > 0) onSelect(String(params.nodes[0]));
      });

      networkRef.current = net;
    });

    return () => {
      if (networkRef.current) {
        (networkRef.current as { destroy: () => void }).destroy();
        networkRef.current = null;
      }
    };
  }, [entities, selectedId, onSelect]);

  return (
    <div className="relative w-full h-full bg-gray-50">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-500 shadow-sm">
          Arrastra · Rueda para zoom · Clic para seleccionar
        </div>
      </div>
    </div>
  );
}
