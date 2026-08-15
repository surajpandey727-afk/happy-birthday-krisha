'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GameShell } from '@/components/GameShell';
import {
  generateLevel,
  solveLiquid,
  tryPour,
  isComplete,
  bandForLevel,
  type Move,
} from './logic';
import { makeProgressStore, addPuzzleSolved } from '@/games/framework/progress';
import { sound } from '@/lib/sounds';
import { haptics } from '@/lib/haptics';
import { pushToast } from '@/lib/eggBus';
import { usePageVisibility } from '@/hooks/useMedia';

/** The twelve "liquid" colours — beautiful, non-neon, brand-true. */
export const LIQUID_COLORS = [
  '#3027a0', // ultramarine
  '#ef6a9c', // flamingo
  '#f6c4d6', // pink-cloud
  '#5650c2', // ultramarine-soft
  '#9b9be0', // periwinkle
  '#f79bbd', // flamingo-soft
  '#1d1666', // ultramarine-deep
  '#e6e9f4', // mist
  '#7d79dd',
  '#f9a8c4',
  '#5f5bd0',
  '#f8d7e2',
];

const progressStore = makeProgressStore('liquid');

interface BottleProps {
  contents: number[];
  cap: number;
  selected: boolean;
  complete: boolean;
  dimmed: boolean;
  highlight?: boolean;
  onClick: () => void;
  innerRef?: (el: HTMLButtonElement | null) => void;
}

/** A single glass vessel, drawn in SVG so it stays crisp everywhere. */
function Bottle({ contents, cap, selected, complete, dimmed, highlight, onClick, innerRef }: BottleProps) {
  const segH = 14;
  const total = Math.max(cap, contents.length);
  const fillH = contents.length * segH;
  const topY = 84 - fillH;

  return (
    <button
      ref={innerRef}
      aria-label={contents.length ? `bottle with liquid` : 'empty bottle'}
      onClick={onClick}
      className={`tap-target relative outline-none transition-transform duration-300 ease-out ${
        selected ? '-translate-y-2' : ''
      } ${dimmed && !selected ? 'opacity-45' : 'opacity-100'}`}
    >
      <motion.div
        animate={highlight ? { scale: [1, 1.07, 1] } : { scale: 1 }}
        transition={{ duration: 0.7, repeat: highlight ? Infinity : 0 }}
      >
        <svg
          width="60"
          height="100"
          viewBox="0 0 60 100"
          className="overflow-visible drop-shadow-sm"
        >
          {/* selected glow */}
          {selected && (
            <ellipse cx="30" cy="84" rx="26" ry="8" fill="#ef6a9c" opacity="0.35">
              <animate attributeName="opacity" values="0.35;0.12;0.35" dur="1.6s" repeatCount="indefinite" />
            </ellipse>
          )}

          {/* liquid */}
          {contents.map((c, i) => {
            const y = topY + i * segH;
            const isTop = i === contents.length - 1;
            return (
              <g key={i}>
                <rect
                  x="14"
                  y={y}
                  width="32"
                  height={segH + 1}
                  rx={isTop ? 0 : i === 0 ? 7 : 0}
                  fill={LIQUID_COLORS[c % LIQUID_COLORS.length]}
                  opacity="0.96"
                />
                {isTop && (
                  <ellipse
                    cx="30"
                    cy={y}
                    rx="16"
                    ry="3.4"
                    fill={LIQUID_COLORS[c % LIQUID_COLORS.length]}
                    opacity="1"
                  />
                )}
              </g>
            );
          })}

          {/* glass */}
          <path
            d="M18 6 h24 v62 c0 12 -5.5 22 -12 22 s-12 -10 -12 -22 z"
            fill="rgba(255,255,255,0.14)"
            stroke={complete ? '#5650c2' : 'rgba(43,36,64,0.55)'}
            strokeWidth="2.4"
          />
          {/* highlight */}
          <path
            d="M20 10 h4 v56 c0 9 -2.2 14 -4.6 16.4"
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="2.6"
            strokeLinecap="round"
          />

          {/* lip */}
          <rect x="16" y="4" width="28" height="5" rx="2.4" fill="rgba(43,36,64,0.28)" />

          {complete && (
            <text x="30" y="44" textAnchor="middle" fontSize="18" fill="#ffffff" opacity="0.9">
              ✦
            </text>
          )}
        </svg>
      </motion.div>
    </button>
  );
}

/** The moving liquid stream while a pour is in flight. */
function PourStream({
  from,
  to,
  color,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
}) {
  const midY = Math.max(from.y, to.y) + 60;
  const d = `M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${midY} ${to.x} ${to.y}`;
  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <svg className="h-full w-full" style={{ overflow: 'visible' }}>
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.85"
          pathLength={1}
          style={{
            strokeDasharray: 1,
            animation: 'drawStream 0.5s var(--ease-luxe) forwards',
          }}
        />
        <circle r="4" fill="#ffffff" opacity="0.5">
          <animateMotion dur="0.5s" repeatCount="1" fill="freeze" path={d} />
        </circle>
      </svg>
      <motion.div
        className="absolute h-3 w-7 rounded-full"
        style={{ background: color, boxShadow: '0 0 14px rgba(255,255,255,0.4)' }}
        initial={{ x: from.x - 14, y: from.y - 6, scale: 1 }}
        animate={{ x: to.x - 14, y: to.y - 6, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

export function LiquidGame() {
  const [levelId, setLevelId] = useState(1);
  const [bottles, setBottles] = useState<number[][]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [history, setHistory] = useState<number[][][]>([]);
  const [pouring, setPouring] = useState<{ from: number; to: number; color: string } | null>(null);
  const [stream, setStream] = useState<{ from: { x: number; y: number }; to: { x: number; y: number }; color: string } | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [celebrated, setCelebrated] = useState<number | null>(null);
  const [hint, setHint] = useState<Move | null>(null);

  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const pourTimer = useRef<number | null>(null);
  const visible = usePageVisibility();

  const level = useMemo(() => generateLevel(levelId), [levelId]);
  const solution = useMemo(() => solveLiquid(level.bottles, level.capacity), [level]);

  useEffect(() => {
    setBottles(level.bottles.map((b) => b.slice()));
    setSelected(null);
    setMoves(0);
    setHistory([]);
    setPouring(null);
    setStream(null);
    setShowComplete(false);
    setCelebrated(null);
    setHint(null);
    progressStore.saveLevel(levelId);
  }, [level, levelId]);

  // completion is decided by game logic first, animation follows
  useEffect(() => {
    if (!bottles.length) return;
    if (isComplete(bottles, level.capacity) && celebrated !== levelId) {
      setCelebrated(levelId);
      setShowComplete(true);
      progressStore.recordWin(levelId, moves);
      addPuzzleSolved();
    }
  }, [bottles, levelId, celebrated, moves, level.capacity]);

  useEffect(() => () => {
    if (pourTimer.current) window.clearTimeout(pourTimer.current);
  }, []);

  const handleTap = useCallback(
    (i: number) => {
      if (pouring || showComplete) return;
      if (selected === null) {
        if (bottles[i].length === 0) {
          sound.error();
          haptics.error();
          return;
        }
        setSelected(i);
        sound.select();
        haptics.tap();
        return;
      }
      if (selected === i) {
        setSelected(null);
        return;
      }
      const p = tryPour(bottles, selected, i, level.capacity);
      if (!p) {
        sound.error();
        haptics.error();
        setSelected(i); // forgiving: just select the tapped vessel
        return;
      }
      const top = bottles[selected][bottles[selected].length - 1];
      const color = LIQUID_COLORS[top % LIQUID_COLORS.length];
      const a = refs.current[selected]?.getBoundingClientRect();
      const b = refs.current[i]?.getBoundingClientRect();
      if (a && b) {
        setStream({
          from: { x: a.left + a.width / 2, y: a.top + 14 },
          to: { x: b.left + b.width / 2, y: b.top + 14 },
          color,
        });
      }
      setHistory((h) => [...h, bottles]);
      setPouring({ from: selected, to: i, color });
      sound.pour();
      if (pourTimer.current) window.clearTimeout(pourTimer.current);
      pourTimer.current = window.setTimeout(() => {
        setBottles(p.next);
        setMoves((m) => m + 1);
        setPouring(null);
        setStream(null);
        setSelected(null);
        haptics.tap();
      }, 560);
    },
    [pouring, showComplete, selected, bottles, level.capacity]
  );

  const undo = useCallback(() => {
    if (pouring || showComplete) return;
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setBottles(prev);
      setMoves((m) => Math.max(0, m - 1));
      setSelected(null);
      return h.slice(0, -1);
    });
    sound.tap();
  }, [pouring, showComplete]);

  const doHint = useCallback(() => {
    if (!solution || solution.length === 0) {
      pushToast('this one is already nearly home.');
      return;
    }
    const hints = progressStore.load().hintsUsed[levelId] ?? 0;
    const step = solution[Math.min(hints, solution.length - 1)];
    setHint(step);
    progressStore.recordHint(levelId);
    sound.select();
    window.setTimeout(() => setHint(null), 2400);
  }, [solution, levelId]);

  const selectLevel = (n: number) => setLevelId(Math.max(1, n));
  const changeBy = (d: number) => setLevelId((l) => Math.max(1, l + d));
  const nextLevel = () => setLevelId((l) => l + 1);

  const band = bandForLevel(levelId);
  const totalLevels = levelId > 100 ? 999 : 100;

  return (
    <GameShell
      gameId="liquid"
      title="liquid love"
      subtitle="pour until every glass holds one colour"
      current={levelId}
      total={totalLevels}
      doneMoves={moves}
      onUndo={undo}
      onRestart={() => {
        setBottles(level.bottles.map((b) => b.slice()));
        setHistory([]);
        setMoves(0);
        setSelected(null);
      }}
      onHint={doHint}
      onSelectLevel={selectLevel}
      onLevelChangeBy={changeBy}
      onNext={nextLevel}
      onCompleteTap={() => setShowComplete(false)}
      showComplete={showComplete}
      band={band}
      undoDisabled={history.length === 0}
    >
      <div className="w-full max-w-xl">
        {levelId === 1 && moves === 0 && (
          <p className="mb-6 text-center font-hand text-2xl text-ink-soft">
            pour until every glass holds one colour.
          </p>
        )}

        <div className="flex flex-wrap items-end justify-center gap-x-1 gap-y-4 sm:gap-x-3">
          {bottles.map((b, i) => (
            <Bottle
              key={`${levelId}-${i}`}
              contents={b}
              cap={level.capacity}
              selected={selected === i}
              complete={b.length === level.capacity && new Set(b).size === 1}
              dimmed={selected !== null && selected !== i}
              highlight={hint ? hint.from === i || hint.to === i : false}
              onClick={() => handleTap(i)}
              innerRef={(el) => {
                refs.current[i] = el;
              }}
            />
          ))}
        </div>

        {!visible && (
          <p className="mt-8 text-center font-hand text-xl text-ink-soft">
            the liquid is resting while you're away.
          </p>
        )}

        {stream && <PourStream from={stream.from} to={stream.to} color={stream.color} />}
      </div>
    </GameShell>
  );
}

