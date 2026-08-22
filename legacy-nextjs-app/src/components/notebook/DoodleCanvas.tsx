'use client';
import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { sound } from '@/lib/sounds';
import { haptics } from '@/lib/haptics';

const PALETTE = ['#efe4d0', '#28479e', '#203a8e', '#a9a19a', '#6a4632', '#4b3226', '#161218', '#d7c6aa'];
const SIZES = [2, 4, 8, 16];
const PAPER_BG = '#161218';

export interface DoodleCanvasHandle {
  exportPng: () => string;
  clear: () => void;
}

/** A drawing canvas with pressure-friendly pointer events, quadratic-curve
 * stroke smoothing (raw point-to-point lineTo reads jittery at normal
 * drawing speed — interpolating through the midpoint of each pair of
 * points, rather than the points themselves, is the standard cheap fix),
 * undo/redo via toDataURL snapshots, brush presets, and an eraser. */
export const DoodleCanvas = forwardRef<
  DoodleCanvasHandle,
  { onDirtyChange?: (dirty: boolean) => void; heightClass?: string }
>(function DoodleCanvas({ onDirtyChange, heightClass = 'h-[52dvh]' }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [color, setColor] = useState(PALETTE[0]);
    const [size, setSize] = useState(SIZES[2]);
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [drawing, setDrawing] = useState(false);

    const undoStack = useRef<string[]>([]);
    const redoStack = useRef<string[]>([]);
    const points = useRef<{ x: number; y: number }[]>([]);
    const dpr = useRef(1);
    const everSetUp = useRef(false);

    const refreshButtons = useCallback(() => {
      setCanUndo(undoStack.current.length > 0);
      setCanRedo(redoStack.current.length > 0);
    }, []);

    // preserve=true redraws whatever was already on the canvas, scaled into
    // the new size — needed because this now also fires when the container
    // itself resizes (fullscreen toggle, sidebar collapse), not just the
    // window, and a resize is not a reason to throw away a drawing.
    const setupCanvas = useCallback((preserve = true) => {
      const c = canvasRef.current;
      if (!c) return;
      const rect = c.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const prevDataUrl = preserve && everSetUp.current ? c.toDataURL() : null;
      dpr.current = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.round(rect.width * dpr.current);
      c.height = Math.round(rect.height * dpr.current);
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr.current, dpr.current);
      ctx.fillStyle = PAPER_BG;
      ctx.fillRect(0, 0, rect.width, rect.height);
      if (prevDataUrl) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
        img.src = prevDataUrl;
      }
      everSetUp.current = true;
    }, []);

    useEffect(() => {
      setupCanvas(false);
      const onResize = () => setupCanvas(true);
      window.addEventListener('resize', onResize);
      const ro = new ResizeObserver(onResize);
      if (canvasRef.current) ro.observe(canvasRef.current);
      return () => {
        window.removeEventListener('resize', onResize);
        ro.disconnect();
      };
    }, [setupCanvas]);

    useImperativeHandle(ref, () => ({
      exportPng: () => canvasRef.current?.toDataURL('image/png') ?? '',
      clear: () => clear(),
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }), []);

    const pos = (e: React.PointerEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const strokeColor = () => (tool === 'eraser' ? PAPER_BG : color);

    const onDown = (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      const c = canvasRef.current;
      if (!c) return;
      undoStack.current.push(c.toDataURL());
      redoStack.current = [];
      refreshButtons();
      onDirtyChange?.(true);
      points.current = [pos(e)];
      setDrawing(true);
      haptics.tap();
    };

    const onMove = (e: React.PointerEvent) => {
      if (!drawing) return;
      const c = canvasRef.current;
      const ctx = c?.getContext('2d');
      if (!c || !ctx) return;
      const p = pos(e);
      points.current.push(p);
      const pts = points.current;
      if (pts.length < 3) return;

      // Draw a quadratic curve through the midpoint of the last two
      // points, using the point before as the control — this is what
      // actually smooths the line, vs. connecting raw samples directly.
      const [p0, p1, p2] = pts.slice(-3);
      const mid1 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
      const mid2 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      ctx.strokeStyle = strokeColor();
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(mid1.x, mid1.y);
      ctx.quadraticCurveTo(p1.x, p1.y, mid2.x, mid2.y);
      ctx.stroke();
    };

    const onUp = () => {
      setDrawing(false);
      points.current = [];
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
      setupCanvas(false);
      refreshButtons();
      onDirtyChange?.(true);
      sound.pop();
    };

    return (
      <div className="card-tactile p-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-full bg-brown-deep/40 ring-1 ring-brown-warm/40">
            <button
              onClick={() => { setTool('pen'); sound.tap(); }}
              className={`font-nebulica px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] ${tool === 'pen' ? 'bg-royal-vivid text-void' : 'text-muted'}`}
            >
              pen
            </button>
            <button
              onClick={() => { setTool('eraser'); sound.tap(); }}
              className={`font-nebulica px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] ${tool === 'eraser' ? 'bg-royal-vivid text-void' : 'text-muted'}`}
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
                className={`h-7 w-7 rounded-full ring-2 transition-transform ${color === c && tool === 'pen' ? 'scale-110 ring-royal-vivid' : 'ring-transparent'}`}
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
                className={`flex h-8 w-8 items-center justify-center rounded-full bg-brown-deep/40 ring-1 ${size === s ? 'ring-royal-vivid' : 'ring-brown-warm/40'}`}
              >
                <span className="rounded-full bg-parchment" style={{ width: s, height: s }} />
              </button>
            ))}
          </div>

          <div className="ml-auto flex gap-1">
            <button aria-label="undo" onClick={undo} disabled={!canUndo} className="tap-target rounded-full text-lg text-parchment enabled:hover:bg-royal-vivid/15 disabled:opacity-30">↶</button>
            <button aria-label="redo" onClick={redo} disabled={!canRedo} className="tap-target rounded-full text-lg text-parchment enabled:hover:bg-royal-vivid/15 disabled:opacity-30">↷</button>
            <button aria-label="clear canvas" onClick={clear} className="tap-target rounded-full text-lg text-parchment hover:bg-royal-vivid/15">✕</button>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          className={`block w-full touch-none select-none rounded-xl ${heightClass}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          onPointerCancel={onUp}
        />
      </div>
    );
  }
);
