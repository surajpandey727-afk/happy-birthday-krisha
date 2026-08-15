'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { GameShell } from '@/components/GameShell';
import { generateLevel, countCrossings, type P } from './logic';
import { makeProgressStore, addPuzzleSolved } from '@/games/framework/progress';
import { sound } from '@/lib/sounds';
import { haptics } from '@/lib/haptics';
import { pushToast } from '@/lib/eggBus';
import { usePageVisibility } from '@/hooks/useMedia';

const progressStore = makeProgressStore('untangle');

const NODE_COLORS = [
  '#3027a0', '#ef6a9c', '#5650c2', '#f79bbd', '#1d1666',
  '#9b9be0', '#f6c4d6', '#5f5bd0', '#f9a8c4', '#7d79dd',
];

const VB = 1000;

export function UntangleGame() {
  const [levelId, setLevelId] = useState(1);
  const level = useMemo(() => generateLevel(levelId), [levelId]);
  const [points, setPoints] = useState<P[]>(level.initial);
  const [dragId, setDragId] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [history, setHistory] = useState<P[][]>([]);
  const [showComplete, setShowComplete] = useState(false);
  const [celebrated, setCelebrated] = useState<number | null>(null);
  const [hintNode, setHintNode] = useState<number | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const nodeRefs = useRef<(SVGGElement | null)[]>([]);
  const edgeRefs = useRef<(SVGLineElement | null)[]>([]);
  const pointsRef = useRef<P[]>(points);
  const visible = usePageVisibility();

  const crossings = useMemo(() => countCrossings(points, level.edges), [points, level.edges]);
  const solved = crossings === 0 && points.length > 0;

  // reset on level change
  useEffect(() => {
    setPoints(level.initial);
    setMoves(0);
    setHistory([]);
    setDragId(null);
    setShowComplete(false);
    setCelebrated(null);
    setHintNode(null);
    progressStore.saveLevel(levelId);
  }, [level, levelId]);

  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  useEffect(() => {
    if (solved && celebrated !== levelId) {
      setCelebrated(levelId);
      setShowComplete(true);
      progressStore.recordWin(levelId, moves);
      addPuzzleSolved();
    }
  }, [solved, levelId, celebrated, moves]);

  /** Direct-DOM dragging: no React re-render per pointermove. */
  const syncVisual = (pts: P[]) => {
    pts.forEach((p, i) => {
      nodeRefs.current[i]?.setAttribute('transform', `translate(${p.x * VB} ${p.y * VB})`);
    });
    level.edges.forEach(([a, b], k) => {
      const el = edgeRefs.current[k];
      if (!el) return;
      const pa = pts[a];
      const pb = pts[b];
      el.setAttribute('x1', `${pa.x * VB}`);
      el.setAttribute('y1', `${pa.y * VB}`);
      el.setAttribute('x2', `${pb.x * VB}`);
      el.setAttribute('y2', `${pb.y * VB}`);
    });
  };

  useEffect(() => {
    syncVisual(points);
  }, [points, level]);

  const toView = (e: { clientX: number; clientY: number }): P => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0.5, y: 0.5 };
    return {
      x: Math.max(0.02, Math.min(0.98, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0.02, Math.min(0.98, (e.clientY - rect.top) / rect.height)),
    };
  };

  const onPointerDown = useCallback(
    (i: number) => (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      setDragId(i);
      sound.select();
    },
    []
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragId == null) return;
      const p = toView(e);
      const next = pointsRef.current.map((pt, i) => (i === dragId ? p : pt));
      pointsRef.current = next;
      syncVisual(next);
    },
    [dragId]
  );

  const onPointerUp = useCallback(() => {
    if (dragId == null) return;
    setHistory((h) => [...h, pointsRef.current.map((p) => ({ ...p }))]);
    setPoints(pointsRef.current.map((p) => ({ ...p })));
    setMoves((m) => m + 1);
    setDragId(null);
    sound.connect();
  }, [dragId]);

  const undo = useCallback(() => {
    if (dragId != null) return;
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setPoints(prev);
      setMoves((m) => Math.max(0, m - 1));
      return h.slice(0, -1);
    });
    sound.tap();
  }, [dragId]);

  const doHint = useCallback(() => {
    // highlight the node with the most crossings touching its edges
    let best = -1;
    let bestScore = -1;
    for (let i = 0; i < points.length; i++) {
      let s = 0;
      for (let k = 0; k < level.edges.length; k++) {
        const [a, b] = level.edges[k];
        if (a === i || b === i) {
          for (let m = k + 1; m < level.edges.length; m++) {
            const [c, d] = level.edges[m];
            if (c === i || d === i || c === a || d === a || c === b || d === b) continue;
            const pa = points[a];
            const pb = points[b];
            const pc = points[c];
            const pd = points[d];
            const sgn = (p: P, q: P, r: P) =>
              (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
            const o1 = sgn(pa, pb, pc);
            const o2 = sgn(pa, pb, pd);
            const o3 = sgn(pc, pd, pa);
            const o4 = sgn(pc, pd, pb);
            if (o1 > 0 !== o2 > 0 && o3 > 0 !== o4 > 0) s++;
          }
        }
      }
      if (s > bestScore) {
        bestScore = s;
        best = i;
      }
    }
    sound.select();
    setHintNode(best >= 0 ? best : 0);
    window.setTimeout(() => setHintNode(null), 2400);
  }, [points, level]);


  const selectLevel = (n: number) => setLevelId(Math.max(1, n));
  const changeBy = (d: number) => setLevelId((l) => Math.max(1, l + d));
  const nextLevel = () => setLevelId((l) => l + 1);
  const totalLevels = levelId > 100 ? 999 : 100;

  return (
    <GameShell
      gameId="untangle"
      title="untangle"
      subtitle="pull the knots out — no lines may cross"
      current={levelId}
      total={totalLevels}
      doneMoves={moves}
      onUndo={undo}
      onRestart={() => {
        setPoints(level.initial);
        setHistory([]);
        setMoves(0);
        syncVisual(level.initial);
      }}
      onHint={doHint}
      onSelectLevel={selectLevel}
      onLevelChangeBy={changeBy}
      onNext={nextLevel}
      onCompleteTap={() => setShowComplete(false)}
      showComplete={showComplete}
      undoDisabled={history.length === 0}
    >
      <div className="w-full max-w-xl">
        <p className="mb-3 text-center font-hand text-xl text-ink-soft">
          {solved ? 'not a single knot. ' : `${crossings} ${crossings === 1 ? 'knot' : 'knots'} left`}
        </p>

        <div className="relative overflow-hidden rounded-3xl bg-warm-white/70 shadow-card ring-1 ring-pink-cloud/40 paper">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB} ${VB}`}
            className="h-auto w-full touch-none select-none"
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {level.edges.map(([a, b], k) => {
              const pa = points[a];
              const pb = points[b];
              return (
                <motion.line
                  key={k}
                  ref={(el) => { edgeRefs.current[k] = el; }}
                  x1={pa.x * VB}
                  y1={pa.y * VB}
                  x2={pb.x * VB}
                  y2={pb.y * VB}
                  stroke="rgba(48,39,160,0.55)"
                  strokeWidth={14}
                  strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              );
            })}

            {points.map((p, i) => (
              <g
                key={i}
                ref={(el) => { nodeRefs.current[i] = el; }}
                transform={`translate(${p.x * VB} ${p.y * VB})`}
                onPointerDown={onPointerDown(i)}
                className="cursor-grab"
                style={{ touchAction: 'none' }}
              >
                <circle r={130} fill="transparent" />
                {hintNode === i && (
                  <circle r={70} fill="none" stroke="#ef6a9c" strokeWidth={12} opacity={0.7}>
                    <animate attributeName="r" values="70;92;70" dur="1s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle r={40} fill={NODE_COLORS[i % NODE_COLORS.length]} stroke="#fdfaf5" strokeWidth={8} />
                <text
                  y={14}
                  textAnchor="middle"
                  fontSize={46}
                  fill="#fdfaf5"
                  fontWeight={600}
                  pointerEvents="none"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {i + 1}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </GameShell>
  );
}

