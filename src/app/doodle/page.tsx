'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WorldShell } from '@/components/world/WorldShell';
import { createStore, subscribe } from '@/lib/persistence';
import { addDoodleSaved } from '@/lib/progress';
import { sound } from '@/lib/sounds';
import { haptics } from '@/lib/haptics';
import { pushToast } from '@/lib/eggBus';

const PALETTE = ['#3027a0', '#ef6a9c', '#5650c2', '#f6c4d6', '#2b2440', '#f6efe4'];
const SIZES = [3, 7, 14];

const doodlesStore = createStore<string[]>('doodles', []);

interface SavedDoodle {
  id: string;
  src: string;
}

export default function DoodlePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState(PALETTE[0]);
  const [size, setSize] = useState(SIZES[1]);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [saved, setSaved] = useState<SavedDoodle[]>([]);
  const [viewDoodle, setViewDoodle] = useState<string | null>(null);
  const [replaying, setReplaying] = useState(false);

  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const strokes = useRef<{ x: number; y: number; color: string; size: number }[][]>([]);
  const currentStroke = useRef<{ x: number; y: number; color: string; size: number }[]>([]);
  const dpr = useRef(1);

  const refreshButtons = useCallback(() => {
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(redoStack.current.length > 0);
  }, []);

  const setupCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    dpr.current = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(rect.width * dpr.current);
    c.height = Math.round(rect.height * dpr.current);
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr.current, dpr.current);
    ctx.fillStyle = '#fdfaf5';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = 'rgba(48,39,160,0.06)';
    for (let x = 8; x < rect.width; x += 18) {
      for (let y = 8; y < rect.height; y += 18) {
        if ((x + y) % 36 === 0) {
          ctx.beginPath();
          ctx.arc(x, y, 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }, []);

  useEffect(() => {
    setupCanvas();
    const onResize = () => setupCanvas();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setupCanvas]);

  useEffect(() => {
    const load = () => setSaved((doodlesStore.load() ?? []).map((src, i) => ({ id: String(i), src })));
    load();
    const off = subscribe('doodles', load);
    return off;
  }, []);

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const drawStroke = (
    ctx: CanvasRenderingContext2D,
    pts: { x: number; y: number; color: string; size: number }[]
  ) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size * 2;
      if (i === 0) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + 0.01, p.y);
      } else {
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    }
  };

  const onDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const c = canvasRef.current;
    if (!c) return;
    undoStack.current.push(c.toDataURL());
    redoStack.current = [];
    refreshButtons();
    currentStroke.current = [];
    const p = pos(e);
    currentStroke.current.push({ ...p, color: tool === 'eraser' ? '#fdfaf5' : color, size: size / 10 });
    setDrawing(true);
    haptics.tap();
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drawing) return;
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const p = pos(e);
    const add = { ...p, color: tool === 'eraser' ? '#fdfaf5' : color, size: size / 10 };
    const seg = currentStroke.current;
    if (seg.length) {
      ctx.strokeStyle = add.color;
      ctx.lineWidth = add.size * 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(seg[seg.length - 1].x, seg[seg.length - 1].y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    seg.push(add);
  };

  const onUp = () => {
    if (!drawing) return;
    setDrawing(false);
    if (currentStroke.current.length >= 2) {
      strokes.current.push(currentStroke.current);
    }
    currentStroke.current = [];
  };

  const restoreFrom = (src: string) => {
    const img = new Image();
    img.onload = () => {
      const c = canvasRef.current;
      const ctx = c?.getContext('2d');
      if (!c || !ctx) return;
      const rect = c.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
    };
    img.src = src;
  };

  const undo = () => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    redoStack.current.push(canvasRef.current!.toDataURL());
    restoreFrom(prev);
    refreshButtons();
    sound.tap();
  };

  const redo = () => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(canvasRef.current!.toDataURL());
    restoreFrom(next);
    refreshButtons();
    sound.tap();
  };

  const clear = () => {
    const c = canvasRef.current;
    if (!c) return;
    undoStack.current.push(c.toDataURL());
    redoStack.current = [];
    setupCanvas();
    strokes.current = [];
    refreshButtons();
    sound.pop();
  };

  const save = () => {
    const c = canvasRef.current;
    if (!c) return;
    const data = c.toDataURL('image/png');
    const list = doodlesStore.load();
    doodlesStore.save([...(list ?? []), data]);
    addDoodleSaved();
    sound.success();
    haptics.success();
    pushToast('saved. it lives in the world now.');
  };

  const replay = () => {
    const c = canvasRef.current;
    if (!c || !strokes.current.length) return;
    setReplaying(true);
    setupCanvas();
    const ctx = c.getContext('2d')!;
    let i = 0;
    const all = strokes.current;
    const timer = window.setInterval(() => {
      if (i >= all.length) {
        window.clearInterval(timer);
        setReplaying(false);
        return;
      }
      drawStroke(ctx, all[i]);
      i++;
    }, 34);
  };

  return (
    <WorldShell kicker="paper & pen" title="doodle" blurb="draw something. it can live here.">
      <div className="rounded-3xl bg-warm-white p-4 shadow-card ring-1 ring-pink-cloud/30">
        {/* toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-full bg-cream ring-1 ring-pink-cloud/50">
            <button
              onClick={() => { setTool('pen'); sound.tap(); }}
              className={`px-4 py-2 font-hand text-lg ${tool === 'pen' ? 'bg-ultramarine text-warm-white' : 'text-ink-soft'}`}
            >
              pen
            </button>
            <button
              onClick={() => { setTool('eraser'); sound.tap(); }}
              className={`px-4 py-2 font-hand text-lg ${tool === 'eraser' ? 'bg-ultramarine text-warm-white' : 'text-ink-soft'}`}
            >
              eraser
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {PALETTE.map((c) => (
              <button
                key={c}
                aria-label={`ink ${c}`}
                onClick={() => { setColor(c); setTool('pen'); sound.tap(); }}
                className={`h-8 w-8 rounded-full ring-2 transition-transform ${color === c ? 'scale-110 ring-flamingo' : 'ring-transparent'}`}
                style={{ background: c }}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {SIZES.map((s) => (
              <button
                key={s}
                aria-label={`brush ${s}`}
                onClick={() => { setSize(s); sound.tap(); }}
                className={`flex h-9 w-9 items-center justify-center rounded-full bg-cream ring-1 ${size === s ? 'ring-flamingo' : 'ring-pink-cloud/40'}`}
              >
                <span className="rounded-full bg-ultramarine" style={{ width: s, height: s }} />
              </button>
            ))}
          </div>

          <div className="ml-auto flex gap-1">
            <button aria-label="undo" onClick={undo} disabled={!canUndo} className="tap-target rounded-full text-lg text-ink enabled:hover:bg-pink-cloud/50 disabled:opacity-35">↶</button>
            <button aria-label="redo" onClick={redo} disabled={!canRedo} className="tap-target rounded-full text-lg text-ink enabled:hover:bg-pink-cloud/50 disabled:opacity-35">↷</button>
            <button aria-label="replay drawing" onClick={replay} disabled={replaying} className="tap-target rounded-full text-lg text-ink enabled:hover:bg-pink-cloud/50 disabled:opacity-35">▶</button>
            <button aria-label="clear canvas" onClick={clear} className="tap-target rounded-full text-lg text-ink hover:bg-pink-cloud/50">✕</button>
          </div>
        </div>

        {/* paper */}
        <div className="relative overflow-hidden rounded-2xl ring-1 ring-pink-cloud/40 paper">
          <canvas
            ref={canvasRef}
            className="block h-[52dvh] w-full touch-none select-none"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
            onPointerCancel={onUp}
          />
        </div>

        <button
          onClick={save}
          className="mt-4 w-full rounded-2xl bg-flamingo py-3 font-hand text-2xl text-warm-white shadow-soft hover:scale-[1.01] transition-transform"
        >
          keep this doodle
        </button>
      </div>

      {/* saved doodles */}
      {saved.length > 0 && (
        <div className="mt-8">
          <p className="font-hand text-2xl text-ink-soft">things we've drawn</p>
          <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {saved.slice(-12).reverse().map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  sound.tap();
                  setViewDoodle(d.src);
                }}
                className="h-28 w-28 shrink-0 overflow-hidden rounded-xl shadow-soft ring-1 ring-pink-cloud/40"
              >
                <img src={d.src} alt="a saved doodle" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {viewDoodle && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-ultramarine-deep/80 p-6 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setViewDoodle(null)}
          >
            <motion.img
              src={viewDoodle}
              alt="doodle"
              className="max-h-[80dvh] max-w-[92vw] rounded-2xl shadow-card"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </WorldShell>
  );
}

