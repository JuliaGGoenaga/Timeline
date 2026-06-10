'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import * as d3 from 'd3';
import type { Entity } from '@/types';
import { parseYear, formatYear } from '@/lib/dateUtils';
import disciplinesData from '@/data/disciplines.json';
import periodsData     from '@/data/periods.json';

// ─── Discipline groups ────────────────────────────────────────────────────────
// Disciplines are merged into 5 meaningful clusters.

interface DGroup { id: string; label: string; icon: string; color: string; disciplines: string[] }

const GROUPS: DGroup[] = [
  { id: 'pensamiento', label: 'Pensamiento',    icon: '💭', color: '#6366f1',
    disciplines: ['philosophy', 'religion', 'politics'] },
  { id: 'arte',        label: 'Arte y Espacio', icon: '🎨', color: '#f59e0b',
    disciplines: ['architecture', 'art', 'urbanism'] },
  { id: 'conocimiento',label: 'Conocimiento',   icon: '🔬', color: '#0ea5e9',
    disciplines: ['science', 'technology'] },
  { id: 'expresion',   label: 'Expresión',      icon: '🎵', color: '#a855f7',
    disciplines: ['music', 'literature', 'cinema'] },
  { id: 'sociedad',    label: 'Sociedad',       icon: '👥', color: '#64748b',
    disciplines: ['society', 'economy'] },
];

// These entity types become BACKGROUND EPOCH BUBBLES, not lane items.
const EPOCH_TYPES = new Set(['civilization', 'period']);

// Mega-groups: shown when zoomed out so far that individual epochs are too small.
// Each covers a broad era of human history with a distinct color.
const MEGA_GROUPS = [
  { label: 'Prehistoria y Antigüedad', short: 'Antigüedad',  color: '#92400e', start: -10000, end:  -300 },
  { label: 'Mundo Clásico',            short: 'Clásico',     color: '#1d4ed8', start:   -300, end:   500 },
  { label: 'Edad Media',               short: 'Medieval',    color: '#065f46', start:    500, end:  1300 },
  { label: 'Modernidad Temprana',      short: 'Modernidad',  color: '#7c3aed', start:   1300, end:  1700 },
  { label: 'Industrialización',        short: 'Industria',   color: '#b45309', start:   1700, end:  1914 },
  { label: 'Siglo XX',                 short: 'S.XX',        color: '#dc2626', start:   1914, end:  2000 },
  { label: 'Era Digital',              short: 'Digital',     color: '#0f766e', start:   2000, end:  2100 },
];

const DISC        = Object.fromEntries(disciplinesData.map((d) => [d.id, d]));
const PERIOD_CLR  = Object.fromEntries(periodsData.map((p) => [p.id, p.color]));

function entityGroup(e: Entity): DGroup | null {
  return GROUPS.find((g) => g.disciplines.includes(e.disciplines[0])) ?? null;
}

function shortYr(y: number): string {
  return y < 0 ? `${Math.abs(y)} a.C.` : `${y}`;
}

// ─── Zoom system ──────────────────────────────────────────────────────────────

const TYPE_MIN: Record<string, number> = {
  civilization: 1, period: 1,
  movement: 2, event: 2,
  technology: 3, invention: 3, institution: 3, style: 3, city: 3, place: 3,
  person: 4, building: 4, artwork: 4, publication: 4, work: 4,
};

// These types only appear when a lane is focused (clicked to expand)
const FOCUS_ONLY_TYPES = new Set(['person']);

const LEVEL_NAMES = ['', 'Grandes épocas', 'Épocas y movimientos',
  'Corrientes culturales', 'Protagonistas', 'Vista detallada'];

const TYPE_SYM: Record<string, d3.SymbolType> = {
  person: d3.symbolCircle,   city: d3.symbolCircle,    place: d3.symbolCircle,
  building: d3.symbolSquare, institution: d3.symbolSquare,
  event: d3.symbolDiamond,   work: d3.symbolDiamond,   artwork: d3.symbolDiamond,
  publication: d3.symbolDiamond,
  invention: d3.symbolTriangle, technology: d3.symbolTriangle,
  civilization: d3.symbolStar,
  movement: d3.symbolWye,    style: d3.symbolWye,      period: d3.symbolCross,
};

const TYPE_LABEL: Record<string, string> = {
  person: 'Persona', city: 'Ciudad', place: 'Lugar',
  building: 'Edificio', institution: 'Institución',
  event: 'Acontecimiento', work: 'Obra', artwork: 'Arte visual',
  publication: 'Publicación', invention: 'Invento', technology: 'Tecnología',
  civilization: 'Civilización', movement: 'Movimiento', style: 'Estilo', period: 'Período',
};

function getZL(yr: number): 1|2|3|4|5 {
  if (yr > 3000) return 1;
  if (yr > 1000) return 2;
  if (yr > 300)  return 3;
  if (yr > 60)   return 4;
  return 5;
}

function minImp(zl: number, typeMin: number): number {
  const d = zl - typeMin;
  if (d < 0) return Infinity;
  if (d === 0) return 8;
  if (d === 1) return 6;
  if (d === 2) return 4;
  return 1;
}

function showLabel(e: Entity, zl: number): boolean {
  const d = zl - (TYPE_MIN[e.type] ?? 3);
  if (d < 0)  return false;
  if (d === 0) return e.importance >= 9;
  if (d === 1) return e.importance >= 8;
  if (d === 2) return e.importance >= 6;
  return e.importance >= 4;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  entities: Entity[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function TimelineView({ entities, selectedId, onSelect }: Props) {
  const svgRef       = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef      = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const domainRef    = useRef<[number, number]>([-3300, 2100]);
  // Saved visible year range — persists across redraws (filter changes, resize).
  // Storing years (not pixels) means the transform is recalculated correctly
  // when the container width changes (e.g. filter panel opens/closes).
  const savedViewRef = useRef<{ startYear: number; endYear: number } | null>(null);

  const selectedIdRef   = useRef<string | null>(selectedId);
  const focusedGroupRef = useRef<string | null>(null); // focused lane id
  const renderAllRef    = useRef<((xs: d3.ScaleLinear<number, number>) => void) | null>(null);
  const currentXSRef    = useRef<d3.ScaleLinear<number, number> | null>(null);

  const [showLegend,    setShowLegend]    = useState(false);
  const [currentLevel,  setCurrentLevel]  = useState<1|2|3|4|5>(1);
  const [visibleCount,  setVisibleCount]  = useState(0);
  const [focusedGroup,  setFocusedGroup]  = useState<string | null>(null);


  // Selection change → re-render items without resetting zoom
  useEffect(() => {
    selectedIdRef.current = selectedId;
    if (renderAllRef.current && currentXSRef.current) {
      renderAllRef.current(currentXSRef.current);
    }
  }, [selectedId]);

  // Lane focus change → update ref and re-render layout without zoom reset
  useEffect(() => {
    focusedGroupRef.current = focusedGroup;
    if (renderAllRef.current && currentXSRef.current) {
      renderAllRef.current(currentXSRef.current);
    }
  }, [focusedGroup]);



  const draw = useCallback(() => {
    const svg  = d3.select(svgRef.current);
    const cont = containerRef.current;
    if (!svg.node() || !cont) return;
    svg.selectAll('*').remove();

    const W  = cont.clientWidth  || 900;
    const H  = cont.clientHeight || 520;
    const ML = 140; // left margin (group labels)
    const MR = 16;
    const MT = 16;
    const MB = 36;
    const GROUP_GAP = 3;

    // Layout constants mirrored here so the clip path can use them
    const LANE_INDENT_PX = 18;
    const LABEL_GAP_PX   = 18;
    const BUBBLE_GAP_PX  = 52;
    const groupTopPx     = MT + LABEL_GAP_PX + BUBBLE_GAP_PX;

    // Static white background
    svg.append('rect').attr('width', W).attr('height', H).attr('fill', '#ffffff');

    // Clip path for entity items — constrains icons, bars, labels and dots
    // to the group lanes area so nothing bleeds outside.
    const clipId = 'atlas-item-clip';
    // The clip rect y/height are updated dynamically inside renderAll
    // because laneAreaTop changes with zoom level.
    const clipRect = svg.append('defs').append('clipPath').attr('id', clipId)
      .append('rect')
      .attr('x',     ML + LANE_INDENT_PX)
      .attr('y',     MT)
      .attr('width', W - ML - MR - LANE_INDENT_PX * 2)
      .attr('height', H - MB - MT);

    // Drawing groups (cleared on every renderAll)
    const epochsG = svg.append('g').attr('class', 'epochs');
    const lanesG  = svg.append('g').attr('class', 'lanes');
    const labG    = svg.append('g').attr('class', 'labels');
    const gridG   = svg.append('g').attr('class', 'grid');
    const itemsG  = svg.append('g').attr('class', 'items')
      .attr('clip-path', `url(#${clipId})`);
    const axisG   = svg.append('g').attr('transform', `translate(0,${H - MB})`);
    // Today marker — always on top of everything else
    const todayG  = svg.append('g').attr('class', 'today');

    // Current fractional year (month-precision)
    const _now = new Date();
    const NOW_YEAR = _now.getFullYear() + _now.getMonth() / 12;

    // X scale
    const allYears = entities
      .flatMap((e) => [parseYear(e.startDate), parseYear(e.endDate)])
      .filter((y): y is number => y !== null);
    const domMin = allYears.length ? Math.min(...allYears) - 150 : -3300;
    const domMax = allYears.length ? Math.max(...allYears) + 200 : 2100;
    domainRef.current = [domMin, domMax];
    const xScale = d3.scaleLinear().domain([domMin, domMax]).range([ML, W - MR]);

    // ── Main render (called on zoom + selection change) ────────────────────
    function renderAll(xs: d3.ScaleLinear<number, number>) {
      epochsG.selectAll('*').remove();
      lanesG.selectAll('*').remove();
      labG.selectAll('*').remove();
      gridG.selectAll('*').remove();
      itemsG.selectAll('*').remove();

      const visMin    = xs.invert(ML);
      const visMax    = xs.invert(W - MR);
      const yearRange = visMax - visMin;
      const zl        = getZL(yearRange);
      setCurrentLevel(zl);

      // ── Epoch entities: tight viewport filter (pills must be on screen) ────
      const allEpochs = entities.filter((e) => {
        if (!EPOCH_TYPES.has(e.type)) return false;
        const typeMin = TYPE_MIN[e.type] ?? 3;
        if (e.importance < minImp(zl, typeMin)) return false;
        const sy = parseYear(e.startDate);
        if (sy === null) return false;
        const ey = parseYear(e.endDate ?? undefined) ?? sy;
        return xs(ey) >= ML - 100 && xs(sy) <= W - MR + 100;
      });

      // ── Lane items: use zl≥2 so movements always appear when lanes are visible.
      //    Wide viewport (±W) so cultural currents appear even if the current
      //    camera is positioned in an era with sparse content.
      const laneZl = Math.max(zl, 2) as 1|2|3|4|5;
      const laneItems = entities.filter((e) => {
        if (EPOCH_TYPES.has(e.type)) return false;
        if (FOCUS_ONLY_TYPES.has(e.type)) return false; // only shown in focused lane
        const typeMin = TYPE_MIN[e.type] ?? 3;
        if (e.importance < minImp(laneZl, typeMin)) return false;
        const sy = parseYear(e.startDate);
        if (sy === null) return false;
        const ey = parseYear(e.endDate ?? undefined) ?? sy;
        return xs(ey) >= ML - W && xs(sy) <= W - MR + W;
      });

      setVisibleCount(allEpochs.length + laneItems.length);

      // ── Geometry ──────────────────────────────────────────────────────────
      // ─────────────────────────────────────────────────────────────────────────
      // NEW LAYOUT: two horizontal zones that resize as you zoom
      //
      //  ┌──────────────────────────────────────────────────────────────────┐
      //  │  EPOCH ZONE (top)  ← grandes épocas as pills                    │
      //  │  height → 100% when yearRange ≥ 3000, shrinks to 0 at 1000      │
      //  ├──────────────────────────────────────────────────────────────────┤  ← divider
      //  │  LANE ZONE (bottom) ← 5 discipline lanes                        │
      //  │  height → 0 when yearRange ≥ 3000, grows to 100% at 1000        │
      //  └──────────────────────────────────────────────────────────────────┘
      //
      //  Content in lane zone depends on zl (yearRange):
      //   zl=2 (3000–1000yr): movements/events as bars
      //   zl=3 (1000–300yr):  + styles/technology/institutions
      //   zl=4 (<300yr):      + persons/buildings
      // ─────────────────────────────────────────────────────────────────────────

      const SUPER_ZOOM_THRESHOLD = 5500;
      const SPLIT_START = 3000;  // yearRange where epoch zone is at 100%
      const SPLIT_END   = 1000;  // yearRange where lane zone is at 100%
      const LANE_INDENT = 18;
      // Clip bounds for the lane item area (must match the clipPath rect defined above)
      const CLIP_L = ML + LANE_INDENT;
      const CLIP_R = W - MR - LANE_INDENT;

      const totalAvailH = H - MT - MB;
      const splitFactor = Math.max(0, Math.min(1,
        (SPLIT_START - yearRange) / (SPLIT_START - SPLIT_END)
      ));
      const ZONE_GAP    = (splitFactor > 0.02 && splitFactor < 0.98) ? 5 : 0;

      // Epoch zone occupies the TOP portion
      const epochAreaH   = Math.round((1 - splitFactor) * (totalAvailH - ZONE_GAP));
      const epochAreaTop = MT;
      // Lane zone occupies the BOTTOM portion
      const laneAreaH    = Math.round(splitFactor * (totalAvailH - ZONE_GAP));
      const laneAreaTop  = MT + epochAreaH + ZONE_GAP;

      // Epoch pill sizing — adapts to available epoch zone height
      const PILL_H   = Math.min(24, Math.max(14, Math.floor((epochAreaH - 12) / 16)));
      const PILL_GAP = 3;
      const MAX_ROWS = epochAreaH > 20
        ? Math.max(4, Math.floor((epochAreaH - 12) / (PILL_H + PILL_GAP)))
        : 0;
      const pillAreaTop = epochAreaTop + 4;

      // Lane sizing
      const laneH = laneAreaH > 0
        ? Math.max(22, Math.floor((laneAreaH - (GROUPS.length - 1) * GROUP_GAP) / GROUPS.length))
        : 0;

      // subRows per lane
      function laneSubRows(h: number) { return Math.min(10, Math.max(3, Math.floor(h / 14))); }
      const subRows = laneSubRows(laneH);

      // gInfo — lanes positioned in the BOTTOM zone
      const focusId = focusedGroupRef.current;
      interface GInfo { y: number; h: number; group: DGroup }
      const gInfo: Record<string, GInfo> = {};

      if (laneAreaH > 0) {
        if (focusId && GROUPS.some(g => g.id === focusId)) {
          const avail    = laneAreaH - (GROUPS.length - 1) * GROUP_GAP;
          const focusedH = Math.max(60, Math.floor(avail * 0.52));
          const contextH = Math.max(16, Math.floor((avail - focusedH) / (GROUPS.length - 1)));
          let y = laneAreaTop;
          GROUPS.forEach((g) => {
            const h = g.id === focusId ? focusedH : contextH;
            gInfo[g.id] = { y, h, group: g };
            y += h + GROUP_GAP;
          });
        } else {
          GROUPS.forEach((g, i) => {
            gInfo[g.id] = { y: laneAreaTop + i * (laneH + GROUP_GAP), h: laneH, group: g };
          });
        }
      }

      // Update clip rect to match the current lane area top so items in the
      // topmost lane are never cut off as the epoch zone shrinks.
      clipRect
        .attr('y',      laneAreaTop)
        .attr('height', H - MB - laneAreaTop);

      // ── Grid + axis ───────────────────────────────────────────────────────
      const ticks = Math.max(4, Math.floor(W / 130));
      axisG.call(d3.axisBottom(xs).tickFormat((v) => formatYear(v as number)).ticks(ticks));
      axisG.select('.domain').attr('stroke', '#e5e7eb');
      axisG.selectAll('.tick line').attr('stroke', '#e5e7eb');
      axisG.selectAll('.tick text').attr('fill', '#9ca3af').attr('font-size', 10);
      xs.ticks(ticks).forEach((yr) => {
        gridG.append('line')
          .attr('x1', xs(yr)).attr('x2', xs(yr))
          .attr('y1', laneAreaH > 0 ? laneAreaTop : epochAreaTop)
          .attr('y2', H - MB)
          .attr('stroke', '#f3f4f6').attr('stroke-width', 1);
      });

      // ── SUPER-ZOOM: 7 mega-groups, single centered line ───────────────────
      if (yearRange > SUPER_ZOOM_THRESHOLD) {
        const MEGA_H = Math.min(52, Math.max(32, Math.floor(totalAvailH * 0.10)));
        const cy     = MT + totalAvailH / 2;
        MEGA_GROUPS.forEach((mg) => {
          const bSX = Math.max(xs(mg.start), ML);
          const bEX = Math.min(xs(mg.end),   W - MR);
          const bw  = bEX - bSX;
          if (bw < 2) return;
          epochsG.append('rect')
            .attr('x', bSX).attr('y', cy - MEGA_H / 2)
            .attr('width', bw).attr('height', MEGA_H).attr('rx', MEGA_H / 2)
            .attr('fill', mg.color).attr('fill-opacity', 0.16)
            .attr('stroke', mg.color).attr('stroke-opacity', 0.72).attr('stroke-width', 1.5);
          if (bw > 18) {
            const txt = bw > 130 ? mg.label : (bw > 50 ? mg.short : '');
            if (txt) epochsG.append('text')
              .attr('x', bSX + bw / 2).attr('y', cy)
              .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
              .attr('fill', mg.color).attr('font-size', Math.min(11, MEGA_H - 8)).attr('font-weight', 700)
              .text(txt);
          }
        });
        return;
      }

      // ── EPOCH ZONE (top): individual epoch chips ──────────────────────────
      // Sorted by pixel width (widest first so longer epochs get placed first).
      const sortedEpochs = [...allEpochs].sort((a, b) => {
        const w = (e: Entity) => {
          const s = parseYear(e.startDate) ?? 0;
          const f = parseYear(e.endDate ?? undefined) ?? s;
          return xs(f) - xs(s);
        };
        return w(b) - w(a);
      });

      // Arrow function — avoids block-scope issues with function declarations
      const epochRanges2 = sortedEpochs.map((e) => ({
        pxL: xs(parseYear(e.startDate) ?? 0),
        pxR: xs(parseYear(e.endDate ?? undefined) ?? parseYear(e.startDate) ?? 0),
      }));
      const epochOverlaps = (i: number) => {
        const { pxL, pxR } = epochRanges2[i];
        return epochRanges2.some((r, j) => j !== i && pxL < r.pxR - 4 && pxR > r.pxL + 4);
      };

      if (epochAreaH > 16 && MAX_ROWS > 0) {
        // Opacity: full visibility until splitFactor=0.75, then fade to 0
        const epochOpacity = Math.min(1, (1 - splitFactor) / 0.25);
        const pillRowEnds: number[] = new Array(MAX_ROWS).fill(-Infinity);

        sortedEpochs.forEach((entity, idx) => {
          const sy   = parseYear(entity.startDate) ?? 0;
          const ey   = parseYear(entity.endDate ?? undefined) ?? sy;
          const pSX  = Math.max(xs(sy), ML);
          const pEX  = Math.min(xs(ey), W - MR);
          const bw   = pEX - pSX;
          if (bw < 4) return;

          // Row assignment
          let row = MAX_ROWS - 1;
          for (let r = 0; r < MAX_ROWS; r++) {
            if (pillRowEnds[r] <= pSX - PILL_GAP) { row = r; break; }
          }
          pillRowEnds[row] = pEX + PILL_GAP;

          const pillY = pillAreaTop + row * (PILL_H + PILL_GAP);
          if (pillY + PILL_H > epochAreaTop + epochAreaH) return; // outside epoch zone

          // Always keep the period's own color — overlapping ones just get
          // slightly lower opacity, NOT a gray override (which made them invisible)
          const baseColor = PERIOD_CLR[entity.historicalPeriods?.[0]] ??
            DISC[entity.disciplines[0]]?.color ?? '#6b7280';
          const overlaps  = epochOverlaps(idx);
          const isSel     = entity.id === selectedIdRef.current;

          const g = epochsG.append('g').style('cursor', 'pointer')
            .attr('opacity', epochOpacity)
            .on('click', (ev) => { ev.stopPropagation(); onSelect(entity.id); });

          // Fill and stroke always use baseColor — opacity difference only
          g.append('rect')
            .attr('x', pSX).attr('y', pillY)
            .attr('width', bw).attr('height', PILL_H)
            .attr('rx', PILL_H / 2)
            .attr('fill', baseColor)
            .attr('fill-opacity', isSel ? 0.35 : (overlaps ? 0.12 : 0.20))
            .attr('stroke', baseColor)
            .attr('stroke-opacity', isSel ? 1 : (overlaps ? 0.50 : 0.80))
            .attr('stroke-width', isSel ? 2 : 1.5);

          if (bw > 24) {
            const datePart = bw > 150 ? `  (${shortYr(sy)} – ${shortYr(ey)})` : '';
            const maxCh    = Math.max(3, Math.floor(bw / 5.8));
            const raw      = entity.title + datePart;
            const txt      = raw.length <= maxCh ? raw : raw.slice(0, maxCh - 1) + '…';
            g.append('text')
              .attr('x', pSX + bw / 2).attr('y', pillY + PILL_H / 2)
              .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
              .attr('fill', baseColor)
              .attr('font-size', Math.min(10, PILL_H - 3))
              .attr('font-weight', overlaps ? 500 : 700)
              .text(txt);
          }
        });

        // Subtle divider line between the two zones
        if (ZONE_GAP > 0) {
          epochsG.append('line')
            .attr('x1', ML).attr('x2', W - MR)
            .attr('y1', laneAreaTop - Math.round(ZONE_GAP / 2))
            .attr('y2', laneAreaTop - Math.round(ZONE_GAP / 2))
            .attr('stroke', '#e5e7eb').attr('stroke-width', 1)
            .attr('opacity', epochOpacity);
        }
      }

      // ── LANE ZONE (bottom): discipline lanes ──────────────────────────────
      // Visible when laneAreaH > 0. The lane opacity fades in as splitFactor grows.
      const laneOpacity = Math.min(1, splitFactor / 0.25); // fade first 25%

      // White cover that hides fading epoch pills bleeding through transparent lane backgrounds
      if (laneAreaH > 0) {
        lanesG.append('rect')
          .attr('x', ML).attr('y', laneAreaTop)
          .attr('width', W - ML - MR).attr('height', laneAreaH)
          .attr('fill', 'white')
          .attr('opacity', Math.min(1, laneOpacity * 4));
      }

      // ── Group lane backgrounds, labels & click handlers ─────────────────
      if (laneAreaH > 10) GROUPS.forEach((group) => {
        const gi      = gInfo[group.id];
        const isFocus = focusId === group.id;
        const lx = ML + LANE_INDENT;
        const lw = W - ML - MR - LANE_INDENT * 2;
        const ly = gi.y + 3;
        const lh = gi.h - 6;

        // Clickable hit area (full lane rect, transparent)
        lanesG.append('rect')
          .attr('x', lx).attr('y', ly).attr('width', lw).attr('height', lh)
          .attr('rx', 8)
          .attr('fill', isFocus ? group.color : '#000')
          .attr('fill-opacity', isFocus ? 0.06 * laneOpacity : 0.03 * laneOpacity)
          .style('cursor', 'pointer')
          .on('click', (ev) => {
            ev.stopPropagation();
            const newFocus = focusedGroupRef.current === group.id ? null : group.id;
            focusedGroupRef.current = newFocus;
            setFocusedGroup(newFocus);
          });

        // Border — colored when focused, neutral otherwise
        lanesG.append('rect')
          .attr('x', lx).attr('y', ly).attr('width', lw).attr('height', lh)
          .attr('rx', 8).attr('fill', 'none')
          .attr('stroke', isFocus ? group.color : '#d1d5db')
          .attr('stroke-opacity', (isFocus ? 0.55 : 0.8) * laneOpacity)
          .attr('stroke-width', isFocus ? 1.5 : 1)
          .style('pointer-events', 'none'); // clicks handled by fill rect

        labG.append('text')
          .attr('x', ML - 8).attr('y', ly + lh / 2)
          .attr('text-anchor', 'end').attr('dominant-baseline', 'middle')
          .attr('fill', group.color)
          .attr('font-size', isFocus ? 12 : 11)
          .attr('font-weight', isFocus ? 800 : 700)
          .attr('opacity', laneOpacity)
          .text(`${group.icon} ${group.label}`);
      });

      // ── Lane entities ─────────────────────────────────────────────────────
      // When a lane is focused:
      //   • focused lane → show all entity types (persons, buildings…) at zl=4 level
      //   • context lanes → show only movement/event/style bars (corrientes culturales)
      // Skip entity rendering when lane zone is invisible or empty
      if (laneAreaH <= 10) return;
      if (laneItems.length === 0 && !focusId) return;


      // Entities for the focused lane (level-4 filter: persons/buildings visible)
      const focusedLaneItems = focusId
        ? entities.filter((e) => {
            if (EPOCH_TYPES.has(e.type)) return false;
            const grp = entityGroup(e);
            if (!grp || grp.id !== focusId) return false;
            const typeMin = TYPE_MIN[e.type] ?? 3;
            if (e.importance < minImp(4, typeMin)) return false; // always use zl=4
            const sy = parseYear(e.startDate);
            if (sy === null) return false;
            const ey = parseYear(e.endDate ?? undefined) ?? sy;
            return xs(ey) >= ML - 100 && xs(sy) <= W - MR + 100;
          })
        : [];

      // Entities for context lanes (only bars: movements/events/styles)
      const contextItems = focusId
        ? entities.filter((e) => {
            if (EPOCH_TYPES.has(e.type)) return false;
            if (!['movement', 'style', 'event'].includes(e.type)) return false;
            if (e.importance < 6) return false;
            const grp = entityGroup(e);
            if (!grp || grp.id === focusId) return false;
            const sy = parseYear(e.startDate);
            if (sy === null) return false;
            const ey = parseYear(e.endDate ?? undefined) ?? sy;
            return xs(ey) >= ML - 100 && xs(sy) <= W - MR + 100;
          })
        : [];

      const byGroup = new Map<string, Entity[]>();
      GROUPS.forEach((g) => byGroup.set(g.id, []));

      if (focusId) {
        // Focused mode: use special entity sets per lane
        focusedLaneItems.forEach((e) => {
          const grp = entityGroup(e);
          if (grp) byGroup.get(grp.id)?.push(e);
        });
        contextItems.forEach((e) => {
          const grp = entityGroup(e);
          if (grp) byGroup.get(grp.id)?.push(e);
        });
      } else {
        // Normal mode: use laneItems
        laneItems.forEach((e) => {
          const grp = entityGroup(e);
          if (grp && gInfo[grp.id]) byGroup.get(grp.id)?.push(e);
        });
      }

      byGroup.forEach((groupEntities, groupId) => {
        const gi      = gInfo[groupId];
        const isFocus = focusId === groupId;
        const isCtx   = focusId !== null && !isFocus;
        if (!gi || !groupEntities.length) return;

        // subRows: more rows for the focused (tall) lane
        const sr = laneSubRows(gi.h);

        // Most important entities placed first
        const sorted = [...groupEntities].sort((a, b) => {
          const d = b.importance - a.importance;
          return d !== 0 ? d : (parseYear(a.startDate) ?? 0) - (parseYear(b.startDate) ?? 0);
        });

        // Bars stack from the bottom of the lane upward.
        // Point items stack from the top downward. Separate row trackers so they don't interfere.
        const barRowEnds: number[] = new Array(sr).fill(-Infinity);
        const ptRowEnds:  number[] = new Array(sr).fill(-Infinity);
        const slotH = gi.h / sr;

        sorted.forEach((entity) => {
          const sy = parseYear(entity.startDate);
          if (!sy && sy !== 0) return;
          const ey        = parseYear(entity.endDate ?? undefined) ?? sy;
          const sx        = xs(sy);
          const ex        = xs(ey);
          const discColor = DISC[entity.disciplines[0]]?.color ?? '#6b7280';
          const isSel     = entity.id === selectedIdRef.current;

          const isBar = isCtx
            ? ex - sx > 2
            : ['movement', 'style', 'event'].includes(entity.type) && ex - sx > 8;

          const effectiveZl = isFocus ? Math.max(zl, 4) as 1|2|3|4|5 : laneZl;
          const baseSize = Math.max(20, (entity.importance / 10) * 52);
          const iconR    = Math.sqrt(baseSize / Math.PI) + 1;
          const wLabel   = isCtx ? showLabel(entity, 3 as 1|2|3|4|5) : showLabel(entity, effectiveZl);
          const labelW   = wLabel ? Math.min(entity.title.length * 6, 120) : 0;
          const GAP      = isBar ? (isCtx ? 4 : 8) : 12;
          const itemLeft  = isBar ? sx - 2 : sx - iconR - 2;
          const itemRight = isBar ? ex + 4  : sx + iconR + labelW + 6;

          const isThinLine = isBar && (isCtx || zl >= 4);

          // Bars: rows numbered 0 = bottom, stack upward.
          // Points: rows numbered 0 = top, stack downward.
          const rowEndsArr = isBar ? barRowEnds : ptRowEnds;
          let row = -1;
          for (let r = 0; r < sr; r++) {
            if (rowEndsArr[r] <= itemLeft - GAP) { row = r; break; }
          }
          if (row === -1) {
            if (isThinLine) {
              row = rowEndsArr.indexOf(Math.min(...rowEndsArr));
            } else {
              return;
            }
          }
          rowEndsArr[row] = itemRight + GAP;

          // Bars: cy grows from lane bottom upward (row 0 = bottom edge).
          // Points: cy grows from lane top downward (row 0 = top).
          const cy = isBar
            ? gi.y + gi.h - slotH * row - slotH / 2
            : gi.y + slotH * row + slotH / 2;

          const g = itemsG.append('g')
            .attr('transform', `translate(${sx},${cy})`)
            .style('cursor', 'pointer')
            .on('click', (ev) => { ev.stopPropagation(); onSelect(entity.id); });

          if (isBar) {
            // ── Movement / event / style bar ──
            const barW = Math.max(ex - sx, 10);
            const barH = isThinLine
              ? (isSel ? 3 : 2)
              : Math.max(12, Math.min(20, slotH * 0.62));

            g.append('rect') // main bar / line
              .attr('x', 0).attr('y', -barH / 2)
              .attr('width', barW).attr('height', barH)
              .attr('rx', isThinLine ? 1 : barH / 2)
              .attr('fill', discColor)
              .attr('fill-opacity', isThinLine ? (isSel ? 0.35 : 0.18) : (isSel ? 0.22 : 0.13))
              .attr('stroke', discColor)
              .attr('stroke-width', isThinLine ? (isSel ? 1 : 0.5) : (isSel ? 1 : 0.6))
              .attr('stroke-opacity', isThinLine ? (isSel ? 1 : 0.7) : (isSel ? 1 : 0.85));

            if (wLabel) {
              const fontSize = isThinLine ? 9 : 10;
              const lbl = entity.title.length > 26 ? entity.title.slice(0, 26) + '…' : entity.title;

              // Label centered on visible portion of bar (stays on screen for wide bars)
              const visL   = Math.max(sx, CLIP_L + 4);
              const visR   = Math.min(ex, CLIP_R - 4);
              const visMid = ((visL + visR) / 2) - sx;
              const labelX = Math.max(4, Math.min(barW - 4, visMid));

              // Clamp Y so text never exits the lane boundary
              const rawLabelY = isThinLine ? -(slotH / 2) + 2 : 0;
              const minLabelY = gi.y - cy + fontSize / 2 + 1;
              const maxLabelY = gi.y + gi.h - cy - fontSize / 2 - 1;
              const labelY    = Math.max(minLabelY, Math.min(maxLabelY, rawLabelY));

              const labelColor = discColor;

              g.append('text')
                .attr('x', labelX).attr('y', labelY)
                .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
                .attr('fill', labelColor)
                .attr('font-size', fontSize)
                .attr('font-weight', 700).text(lbl);
            }
          } else {
            // ── Person / building / work symbol ──
            const symPath = d3.symbol()
              .type(TYPE_SYM[entity.type] ?? d3.symbolCircle)
              .size(baseSize * (isSel ? 1.45 : 1))();
            if (!symPath) return;

            if (isSel) {
              g.append('circle').attr('r', iconR + 5)
                .attr('fill', discColor).attr('fill-opacity', 0.15);
            }
            g.append('path').attr('d', symPath)
              .attr('fill', discColor).attr('fill-opacity', isSel ? 1 : 0.82)
              .attr('stroke', isSel ? '#1f2937' : 'white')
              .attr('stroke-width', isSel ? 1.5 : 0.8);

            // Secondary discipline dots
            entity.disciplines.slice(1).slice(0, 3)
              .forEach((d, di, arr) => {
                const dColor = DISC[d]?.color ?? '#9ca3af';
                const angle  = (di / Math.max(arr.length, 1)) * Math.PI * 1.4 + Math.PI * 0.8;
                const dist   = iconR + 4;
                g.append('circle')
                  .attr('cx', Math.cos(angle) * dist).attr('cy', Math.sin(angle) * dist)
                  .attr('r', 2.5).attr('fill', dColor)
                  .attr('stroke', 'white').attr('stroke-width', 0.5);
              });

            if (wLabel) {
              const fontSize = isSel ? 10 : 9;
              const lbl = entity.title.length > 22 ? entity.title.slice(0, 22) + '…' : entity.title;
              // Clamp Y so text never exits the lane boundary
              const rawLabelY = 0;
              const minLabelY = gi.y - cy + fontSize / 2 + 1;
              const maxLabelY = gi.y + gi.h - cy - fontSize / 2 - 1;
              const labelY    = Math.max(minLabelY, Math.min(maxLabelY, rawLabelY));
              g.append('text')
                .attr('x', iconR + 4).attr('y', labelY)
                .attr('dominant-baseline', 'middle')
                .attr('fill', isSel ? '#111827' : '#374151')
                .attr('font-size', fontSize)
                .attr('font-weight', isSel ? 600 : 400)
                .text(lbl);
            }
          }
        });
      });

      // ── Today marker ─────────────────────────────────────────────────────
      todayG.selectAll('*').remove();
      const nowX = xs(NOW_YEAR);
      if (nowX >= ML && nowX <= W - MR) {
        // Vertical line spanning the full content area
        todayG.append('line')
          .attr('x1', nowX).attr('x2', nowX)
          .attr('y1', MT).attr('y2', H - MB)
          .attr('stroke', '#ef4444')
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.65);

        // "Hoy" label to the RIGHT of the line, with a small margin
        const labelText  = 'Hoy';
        const labelW     = 28;
        const labelMargin = 4; // px gap between line and label
        const labelX     = nowX + labelMargin;

        todayG.append('rect')
          .attr('x', labelX).attr('y', MT + 1)
          .attr('width', labelW).attr('height', 14)
          .attr('rx', 7)
          .attr('fill', '#ef4444').attr('fill-opacity', 0.12)
          .attr('stroke', '#ef4444').attr('stroke-opacity', 0.35)
          .attr('stroke-width', 1);

        todayG.append('text')
          .attr('x', labelX + labelW / 2).attr('y', MT + 8)
          .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
          .attr('fill', '#ef4444')
          .attr('font-size', 9).attr('font-weight', 700)
          .text(labelText);

        // Small triangle/dot on the axis
        todayG.append('circle')
          .attr('cx', nowX).attr('cy', H - MB)
          .attr('r', 4)
          .attr('fill', '#ef4444').attr('fill-opacity', 0.80);
      }

    } // end renderAll

    renderAllRef.current = renderAll;
    currentXSRef.current = xScale;

    // Helper: build a d3 zoom transform that shows [startYear, endYear]
    // for the current container width W. Pure math — no side effects.
    function transformForYears(startYear: number, endYear: number) {
      const sx   = xScale(startYear);
      const ex   = xScale(endYear);
      const span = ex - sx;
      if (span <= 0) return null;
      const k  = (W - ML - MR) / span;
      const tx = ML - sx * k;
      return d3.zoomIdentity.translate(tx, 0).scale(k);
    }

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.03, 600])
      .on('zoom', (event) => {
        // Save visible year range so it survives resizes and filter redraws
        const xs = event.transform.rescaleX(xScale);
        const [domMin2, domMax2] = domainRef.current;
        const visW = W - ML - MR;
        savedViewRef.current = {
          startYear: xs.invert(ML),
          endYear:   xs.invert(ML + visW),
        };
        // Clamp to avoid saving nonsense outside the full domain
        savedViewRef.current.startYear = Math.max(domMin2 - 200, savedViewRef.current.startYear);
        savedViewRef.current.endYear   = Math.min(domMax2 + 200, savedViewRef.current.endYear);

        currentXSRef.current = xs;
        renderAll(xs);
      });

    zoomRef.current = zoom;
    svg.call(zoom as never);

    // ── Initial / restored view ───────────────────────────────────────────────
    const view = savedViewRef.current;
    const t = view
      ? transformForYears(view.startYear, view.endYear)   // restore after filter/resize
      : transformForYears(-3400, 2100);                   // first load: recorded history

    if (t) {
      svg.call(zoom.transform as never, t);
    } else {
      renderAll(xScale);
    }

  }, [entities, onSelect]); // selectedId intentionally omitted

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const obs = new ResizeObserver(() => draw());
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [draw]);

  // Reset zoom to show the full timeline
  function resetZoom() {
    const svgEl = svgRef.current, cont = containerRef.current;
    if (!svgEl || !cont || !zoomRef.current) return;
    const W = cont.clientWidth || 900;
    const [domMin, domMax] = domainRef.current;
    const ML = 140, MR = 16;
    const tmp = d3.scaleLinear().domain([domMin, domMax]).range([ML, W - MR]);
    const sx = tmp(domMin - 50), ex = tmp(domMax + 50);
    const k = (W - ML - MR) / (ex - sx);
    if (!isFinite(k) || k <= 0) return;
    d3.select(svgEl).transition().duration(500)
      .call(zoomRef.current.transform, d3.zoomIdentity.translate(ML - sx * k, 0).scale(k));
  }

  // Pan to center a year WITHOUT changing the current zoom scale
  function panToYear(centerYear: number) {
    const svgEl = svgRef.current, cont = containerRef.current;
    if (!svgEl || !cont || !zoomRef.current) return;
    const W = cont.clientWidth || 900;
    const [domMin, domMax] = domainRef.current;
    const ML = 140, MR = 16;
    const tmp = d3.scaleLinear().domain([domMin, domMax]).range([ML, W - MR]);
    // Get current scale — only change translation, never the zoom level
    const current = d3.zoomTransform(svgEl);
    const k = current.k;
    const newTx = W / 2 - tmp(centerYear) * k;
    d3.select(svgEl).transition().duration(500)
      .call(zoomRef.current.transform, d3.zoomIdentity.translate(newTx, 0).scale(k));
  }

  // Era navigation: [label, center year of that era]
  // Bottom nav uses the same MEGA_GROUPS classification — center year of each era
  const ERA_NAV = MEGA_GROUPS.map((mg) => ({
    label: mg.short,
    color: mg.color,
    centerYear: Math.round((mg.start + mg.end) / 2),
  }));

  return (
    <div ref={containerRef} className="relative w-full h-full bg-white select-none overflow-hidden">

      {/* ── Top controls — vertical stack, top-left corner ── */}
      <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">

        {/* 1 — Leyenda */}
        <button
          onClick={() => setShowLegend((v) => !v)}
          className={`flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-lg border shadow-sm transition-all font-medium w-fit ${
            showLegend ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                       : 'bg-white/90 border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="1" width="4" height="4" rx="0.5"/>
            <rect x="7" y="1" width="4" height="4" rx="0.5"/>
            <rect x="1" y="7" width="4" height="4" rx="0.5"/>
            <rect x="7" y="7" width="4" height="4" rx="0.5"/>
          </svg>
          Leyenda
        </button>

        {/* 2 — Contador + reset zoom en la misma línea */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-400 bg-white/90 border border-gray-200 rounded-lg shadow-sm px-2 py-1.5">
            {visibleCount}/{entities.length}
          </span>
          <button onClick={resetZoom}
            title="Ver toda la historia"
            className="text-[11px] px-2 py-1.5 bg-white/90 border border-gray-200 rounded-lg shadow-sm text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
            ⌂
          </button>
        </div>

        {/* 3 — Nivel de zoom actual */}
        <span className="text-[10px] font-semibold px-2 py-1.5 bg-white/90 border border-gray-200 rounded-lg shadow-sm text-gray-500 w-fit">
          {LEVEL_NAMES[currentLevel]}
        </span>

      </div>

      {/* ── Era navigation — bottom strip, pans WITHOUT changing zoom ── */}
      {/* ── Era navigation — same classification as the mega-group view ── */}
      <div className="absolute bottom-9 left-0 right-0 z-20 flex justify-center pointer-events-none">
        <div className="flex items-center gap-0.5 bg-white/85 backdrop-blur border border-gray-200 rounded-full px-2 py-1 shadow-sm pointer-events-auto">
          {ERA_NAV.map((era) => (
            <button
              key={era.label}
              onClick={() => panToYear(era.centerYear)}
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full hover:bg-gray-100 transition-colors"
              style={{ color: era.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0 opacity-70" style={{ backgroundColor: era.color }} />
              {era.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Legend ── */}
      {showLegend && (
        <div className="absolute top-11 left-2.5 z-30 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-64 max-h-[80vh] overflow-y-auto">
          <section className="mb-3">
            <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Niveles de zoom</h4>
            <div className="space-y-1">
              {[
                { lvl:1, color:'#6366f1', desc:'Burbujas de épocas históricas' },
                { lvl:2, color:'#3b82f6', desc:'+ Movimientos y eventos' },
                { lvl:3, color:'#10b981', desc:'+ Tecnologías y estilos' },
                { lvl:4, color:'#f59e0b', desc:'+ Personas y edificios' },
                { lvl:5, color:'#9ca3af', desc:'Vista completa' },
              ].map((item) => (
                <div key={item.lvl}
                  className={`flex items-center gap-2 px-1.5 py-1 rounded-md ${currentLevel === item.lvl ? 'bg-gray-50' : ''}`}>
                  <span className="text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: item.color }}>{item.lvl}</span>
                  <span className={`text-[10px] ${currentLevel === item.lvl ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>
                    {item.desc}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="border-t border-gray-100 pt-3 mb-3">
            <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Grupos de disciplinas</h4>
            <div className="space-y-2.5">
              {GROUPS.map((g) => (
                <div key={g.id} className="flex items-start gap-2">
                  <div className="w-3 h-3 rounded-sm shrink-0 mt-0.5" style={{ backgroundColor: g.color }} />
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{g.icon} {g.label}</p>
                    <p className="text-[9px] text-gray-400">{g.disciplines.join(' · ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Épocas históricas</h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Las <strong>burbujas de fondo</strong> representan grandes civilizaciones y períodos. Son el marco temporal en el que ocurren los demás eventos. Haz clic en ellas para ver su detalle.
            </p>
          </div>

          <div className="border-t border-gray-100 pt-3 mt-3">
            <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Tipos de entidad</h4>
            <div className="space-y-1">
              {[
                { sym: d3.symbolCircle,   label: 'Persona / Ciudad' },
                { sym: d3.symbolSquare,   label: 'Edificio / Institución' },
                { sym: d3.symbolDiamond,  label: 'Acontecimiento / Obra' },
                { sym: d3.symbolTriangle, label: 'Invento / Tecnología' },
              ].map(({ sym, label }) => {
                const path = d3.symbol().type(sym).size(60)() ?? '';
                return (
                  <div key={label} className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="-8 -8 16 16" className="shrink-0">
                      <path d={path} fill="#9ca3af" stroke="white" strokeWidth={0.5} />
                    </svg>
                    <span className="text-[10px] text-gray-600">{label}</span>
                  </div>
                );
              })}
              <div className="flex items-center gap-2">
                <div className="w-8 h-3 rounded-full shrink-0" style={{ backgroundColor: '#9ca3af', opacity: 0.85 }} />
                <span className="text-[10px] text-gray-600">Movimiento / Estilo</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="absolute bottom-9 right-3 z-10 text-[10px] text-gray-300 pointer-events-none">
        🖱 Rueda = zoom · Arrastra = navegar · Clic = detalle
      </p>

      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}
