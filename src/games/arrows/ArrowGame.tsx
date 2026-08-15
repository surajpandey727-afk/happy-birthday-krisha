'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { GameShell } from '@/components/GameShell';
import {
  generateLevel,
  simulate,
  targetCells,
  isArrow,
  type ArrowLevel,
  type Tile,
} from './logic';
import { makeProgressStore, addPuzzleSolved } from '@/games/framework/progress';
import { sound } from '@/lib/sounds';
import { haptics } from '@/lib/haptics';
import { pushToast } from '@/lib/eggBus';
import { usePageVisibility } from '@/hooks/useMedia';

const progressStore = makeProgressStore('arrows');

const ARROW_GLYPH: Record<string, string> = { '^': '▲', v: '▼', '<': '◀', '>': '▶' };

function TileView({
  tile,
  hit,
  fired,
  index,
  onClick,
}: {
  tile: Tile;
  hit: boolean;
  fired: boolean;
  index: number;
  onClick: () => void;
}) {
  const base = 'tap-target relative aspect-square w-full rounded-xl transition-all duration-300';
  if (tile === '#') {
    return <div className={`${base} bg-ultramarine-deep/15 ring-1 ring-ultramarine-deep/20`} />;
  }
  if (tile === 'T') {
    return (
      <div className={`${base} bg-pink-wash ring-1 ${hit ? 'ring-flamingo' : 'ring-pink-cloud'}`}>
        <span
          className={`text-xl transition-all duration-300 ${hit ? 'text-flamingo scale-100' : 'text-pink-cloud scale-75'}`}
        >
          ♥
        </span>
      </div>
    );
  }
  if (isArrow(tile)) {
    const isStarter = true; // every arrow is fireable in this edition
    void isStarter;
    return (
      <button
        aria-label={`fire arrow ${index + 1}`}
        onClick={onClick}
        className={`${base} bg-warm-white ring-1 ring-ultramarine-soft/30 hover:ring-flamingo shadow-soft ${
          fired ? 'opacity-40' : ''
        }`}
      >
        <span className={`text-2xl text-ultramarine ${fired ? 'opacity-30' : ''}`}>
          {ARROW_GLYPH[tile]}
        </span>
      </button>
    );
  }
  return (
    <div className={`${base} ${hit ? 'bg-pink-cloud/40 ring-1 ring-pink-cloud' : 'bg-cream/50'}`} />
  );
}

export function ArrowGame() {
  const [levelId, setLevelId] = useState(1);
  const level = useMemo(() => generateLevel(levelId), [levelId]);
  const targets = useMemo(() => targetCells(level), [level]);
  const [hit, setHit] = useState<Set<number>>(new Set());
  const [fired, setFired] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [beam, setBeam] = useState<{ steps: number[]; chain: number } | null>(null);
  const [history, setHistory] = useState<{ hit: number[]; fired: number[]; moves: number }[]>([]);
  const [showComplete, setShowComplete] = useState(false);
  const [celebrated, setCelebrated] = useState<number | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const visible = usePageVisibility();

  const solved = hit.size === targets.length && targets.length > 0;

  useEffect(() => {
    setHit(new Set());
    setFired(new Set());
    setMoves(0);
    setHistory([]);
    setBeam(null);
    setShowComplete(false);
    setCelebrated(null);
    progressStore.saveLevel(levelId);
  }, [level, levelId]);

  useEffect(() => {
    if (solved && celebrated !== levelId) {
      setCelebrated(levelId);
      setShowComplete(true);
      progressStore.recordWin(levelId, moves);
      addPuzzleSolved();
    }
  }, [solved, levelId, celebrated, moves]);

  const fire = useCallback(
    (idx: number) => {
      if (beam || showComplete || fired.has(idx)) return;
      const t = level.tiles[idx];
      if (!isArrow(t)) return;

      const prevHit = [...hit];
      const prevFired = [...fired];
      setHistory((h) => [...h, { hit: prevHit, fired: prevFired, moves }]);

      const res = simulate(level, idx);
      const newHit = new Set(hit);
      res.targetsHit.forEach((c) => newHit.add(c));
      const newFired = new Set(fired);
      newFired.add(idx);

      setHit(newHit);
      setFired(newFired);
      setMoves((m) => m + 1);
      setBeam({ steps: res.steps, chain: res.chain });
      haptics.tap();

      if (res.chain > 0) {
        sound.chain();
        window.setTimeout(() => sound.chain(), 90);
        if (res.chain >= 3) pushToast(`chain × ${res.chain + 1}`);
      } else {
        sound.connect();
      }
      window.setTimeout(() => setBeam(null), 900);
    },
    [beam, showComplete, fired, hit, level, moves]
  );


  const undo = useCallback(() => {
    if (beam || showComplete) return;
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setHit(new Set(prev.hit));
      setFired(new Set(prev.fired));
      setMoves(prev.moves);
      return h.slice(0, -1);
    });
    sound.tap();
  }, [beam, showComplete]);

  const doHint = useCallback(() => {
    // best unfired arrow = one that clears the most remaining targets
    let best = -1;
    let bestScore = -1;
    for (let i = 0; i < level.tiles.length; i++) {
      if (fired.has(i)) continue;
      if (!isArrow(level.tiles[i])) continue;
      const res = simulate(level, i);
      const cleared = res.targetsHit.filter((c) => !hit.has(c)).length;
      if (cleared > bestScore) {
        bestScore = cleared;
        best = i;
      }
    }
    if (best < 0) {
      pushToast('every good arrow has already flown.');
      return;
    }
    setHintIdx(best);
    progressStore.recordHint(levelId);
    sound.select();
    window.setTimeout(() => setHintIdx(-1), 2400);
  }, [level, fired, hit, levelId]);

  const [hintIdx, setHintIdx] = useState(-1);
  const selectLevel = (n: number) => setLevelId(Math.max(1, n));
  const changeBy = (d: number) => setLevelId((l) => Math.max(1, l + d));
  const nextLevel = () => setLevelId((l) => l + 1);
  const totalLevels = levelId > 100 ? 999 : 100;

  const cellX = (idx: number) => (((idx % level.w) + 0.5) / level.w) * 100;
  const cellY = (idx: number) => ((Math.floor(idx / level.w) + 0.5) / level.h) * 100;
  const beamStart = beam && beam.steps.length ? beam.steps[0] : null;

  return (
    <GameShell
      gameId="arrows"
      title="arrow // chain"
      subtitle="start the chain. predict the cascade."
      current={levelId}
      total={totalLevels}
      doneMoves={moves}
      onUndo={undo}
      onRestart={() => {
        setHit(new Set());
        setFired(new Set());
        setMoves(0);
        setHistory([]);
        setBeam(null);
      }}
      onHint={doHint}
      onSelectLevel={selectLevel}
      onLevelChangeBy={changeBy}
      onNext={nextLevel}
      onCompleteTap={() => setShowComplete(false)}
      showComplete={showComplete}
      undoDisabled={history.length === 0}
    >
      <div className="w-full max-w-md">
        <p className="mb-3 text-center font-hand text-xl text-ink-soft">
          {solved
            ? 'every little heart is lit. '
            : `${targets.length - hit.size} ${targets.length - hit.size === 1 ? 'heart' : 'hearts'} to light`}
        </p>

        <div
          ref={boardRef}
          className="relative overflow-hidden rounded-3xl bg-warm-white/70 p-3 shadow-card ring-1 ring-pink-cloud/40 paper"
          style={{ aspectRatio: `${level.w} / ${level.h}` }}
        >
          <div
            className="grid h-full w-full gap-1.5"
            style={{ gridTemplateColumns: `repeat(${level.w}, 1fr)`, gridTemplateRows: `repeat(${level.h}, 1fr)` }}
          >
            {level.tiles.map((tile, i) => (
              <div key={i} className="relative">
                <TileView
                  tile={tile}
                  hit={hit.has(i)}
                  fired={fired.has(i)}
                  index={i}
                  onClick={() => fire(i)}
                />
                {hintIdx === i && (
                  <span className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-flamingo" />
                )}
              </div>
            ))}
          </div>

          {/* beam tracer */}
          {beam && beamStart != null && (
            <motion.div
              className="pointer-events-none absolute z-20 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-flamingo shadow-[0_0_16px_4px_rgba(239,106,156,0.7)]"
              initial={{ left: `${cellX(beamStart)}%`, top: `${cellY(beamStart)}%` }}
              animate={
                beam.steps.length > 1
                  ? {
                      left: beam.steps.slice(1).map((s) => `${cellX(s)}%`),
                      top: beam.steps.slice(1).map((s) => `${cellY(s)}%`),
                    }
                  : { left: `${cellX(beamStart)}%`, top: `${cellY(beamStart)}%` }
              }
              transition={{ duration: 0.55, ease: 'easeInOut' }}
            />
          )}
          {beam && beam.chain > 0 && (
            <motion.p
              className="absolute inset-x-0 top-2 z-30 text-center font-hand text-2xl text-ultramarine drop-shadow-sm"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              chain × {beam.chain + 1}
            </motion.p>
          )}
        </div>

        {!visible && (
          <p className="mt-4 text-center font-hand text-lg text-ink-soft">
            the arrows rest while you're away.
          </p>
        )}
      </div>
    </GameShell>
  );
}