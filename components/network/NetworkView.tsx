'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Entity } from '@/types';
import disciplines from '@/data/disciplines.json';

const DISC = Object.fromEntries(disciplines.map((d) => [d.id, d]));

interface Props {
  entities: Entity[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  color: string;
  size: number;
  importance: number;
}

interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
  label: string;
}

export default function NetworkView({ entities, selectedId, onSelect }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const W = svgRef.current.clientWidth  || 800;
    const H = svgRef.current.clientHeight || 600;

    const entityMap = new Map(entities.map((e) => [e.id, e]));

    // Build nodes & links — only entities that appear in at least one valid relation
    const usedIds = new Set<string>();
    const linksRaw: { from: string; to: string; label: string }[] = [];

    entities.forEach((e) => {
      e.relations.forEach((r) => {
        if (entityMap.has(r.targetId)) {
          usedIds.add(e.id);
          usedIds.add(r.targetId);
          linksRaw.push({ from: e.id, to: r.targetId, label: r.relationType.replace(/_/g, ' ') });
        }
      });
    });

    // Limit to top-N by importance to avoid overloading the layout
    const MAX_NODES = 120;
    const sortedIds = Array.from(usedIds).sort((a, b) => {
      const ia = entityMap.get(a)?.importance ?? 0;
      const ib = entityMap.get(b)?.importance ?? 0;
      return ib - ia;
    }).slice(0, MAX_NODES);
    const kept = new Set(sortedIds);

    const nodes: NodeDatum[] = sortedIds.map((id) => {
      const e = entityMap.get(id)!;
      const color = DISC[e.disciplines[0]]?.color ?? '#6b7280';
      return { id, title: e.title, color, size: Math.max(5, (e.importance / 10) * 18), importance: e.importance };
    });

    const links: LinkDatum[] = linksRaw
      .filter((l) => kept.has(l.from) && kept.has(l.to) && l.from !== l.to)
      .map((l) => ({ source: l.from, target: l.to, label: l.label }));

    // D3 force simulation
    const sim = d3.forceSimulation<NodeDatum>(nodes)
      .force('link', d3.forceLink<NodeDatum, LinkDatum>(links).id((d) => d.id).distance(80).strength(0.3))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide<NodeDatum>().radius((d) => d.size + 4))
      .alphaDecay(0.03);   // converge más rápido y para solo

    // Zoom container
    const g = svg.append('g');
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (ev) => g.attr('transform', ev.transform))
    );

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 18).attr('refY', 0)
      .attr('markerWidth', 6).attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path').attr('d', 'M0,-4L8,0L0,4').attr('fill', '#d1d5db');

    // Links
    const linkSel = g.append('g').selectAll<SVGLineElement, LinkDatum>('line')
      .data(links).join('line')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1)
      .attr('marker-end', 'url(#arrow)');

    // Node groups
    const nodeSel = g.append('g').selectAll<SVGGElement, NodeDatum>('g')
      .data(nodes, (d) => d.id)
      .join('g')
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, NodeDatum>()
          .on('start', (ev, d) => { d.fx = d.x; d.fy = d.y; })
          .on('drag',  (ev, d) => {
            if (!ev.active) sim.alphaTarget(0.3).restart();
            d.fx = ev.x; d.fy = ev.y;
          })
          .on('end',   (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = d.x; d.fy = d.y; })
      )
      .on('click', (_ev, d) => onSelect(d.id))
      .on('mouseenter', (_ev, d) => setHoverId(d.id))
      .on('mouseleave', () => setHoverId(null));

    nodeSel.append('circle')
      .attr('r', (d) => d.size)
      .attr('fill', (d) => d.color + 'cc')
      .attr('stroke', (d) => d.id === selectedId ? '#1f2937' : d.color)
      .attr('stroke-width', (d) => d.id === selectedId ? 3 : 1.5);

    nodeSel.append('text')
      .text((d) => d.title)
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => d.size + 11)
      .attr('font-size', 9)
      .attr('fill', '#374151')
      .attr('paint-order', 'stroke')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 3)
      .style('pointer-events', 'none')
      .style('display', (d) => d.importance >= 6 ? 'block' : 'none');

    // Tick
    sim.on('tick', () => {
      linkSel
        .attr('x1', (d) => (d.source as NodeDatum).x ?? 0)
        .attr('y1', (d) => (d.source as NodeDatum).y ?? 0)
        .attr('x2', (d) => (d.target as NodeDatum).x ?? 0)
        .attr('y2', (d) => (d.target as NodeDatum).y ?? 0);

      nodeSel.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => { sim.stop(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entities, selectedId]);

  // Tooltip for hovered node
  const hoveredEntity = hoverId ? entities.find((e) => e.id === hoverId) : null;

  return (
    <div className="relative w-full h-full bg-gray-50">
      <svg ref={svgRef} className="w-full h-full" />

      {/* Hover tooltip */}
      {hoveredEntity && (
        <div className="absolute top-3 left-3 z-20 bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 max-w-xs pointer-events-none">
          <p className="font-semibold text-sm text-gray-900">{hoveredEntity.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{hoveredEntity.summary}</p>
        </div>
      )}

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-500 shadow-sm">
          Arrastra nodos · Rueda para zoom · Clic para seleccionar
        </div>
      </div>
    </div>
  );
}
