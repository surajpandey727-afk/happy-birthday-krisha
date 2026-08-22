'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { notebookDb, type Note, type Doodle } from '@/lib/notebookDb';
import { RichTextEditor } from './RichTextEditor';
import { DoodleCanvas, type DoodleCanvasHandle } from './DoodleCanvas';
import { sound } from '@/lib/sounds';
import { pushToast } from '@/lib/eggBus';
import { addDoodleSaved } from '@/lib/progress';

const AUTOSAVE_DELAY_MS = 800;

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();
}

function plainTextOf(html: string): string {
  if (typeof document === 'undefined') return html;
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent ?? '';
}

function makeBlankNote(): Note {
  const now = Date.now();
  return { id: newId(), title: '', contentHtml: '', tags: [], pinned: false, archived: false, createdAt: now, updatedAt: now };
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type SaveStatus = 'idle' | 'saving' | 'saved';
type MobileView = 'list' | 'editor';

export function NotebookShell() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [mode, setMode] = useState<'write' | 'draw'>('write');
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const [loaded, setLoaded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const doodleRef = useRef<DoodleCanvasHandle>(null);
  const saveTimer = useRef<number | null>(null);
  const active = useMemo(() => notes.find((n) => n.id === activeId) ?? null, [notes, activeId]);

  useEffect(() => {
    notebookDb.listNotes().then((list) => {
      setNotes(list);
      setLoaded(true);
      if (list.length) setActiveId(list[0].id);
    });
  }, []);

  const persist = useCallback((note: Note) => {
    setSaveStatus('saving');
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      await notebookDb.putNote(note);
      setSaveStatus('saved');
    }, AUTOSAVE_DELAY_MS);
  }, []);

  const updateActive = useCallback(
    (patch: Partial<Note>) => {
      if (!active) return;
      const updated = { ...active, ...patch, updatedAt: Date.now() };
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      persist(updated);
    },
    [active, persist]
  );

  const createNote = useCallback(() => {
    const note = makeBlankNote();
    setNotes((prev) => [note, ...prev]);
    setActiveId(note.id);
    setMode('write');
    setMobileView('editor');
    notebookDb.putNote(note);
    sound.tap();
  }, []);

  const deleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      notebookDb.deleteNote(id);
      if (activeId === id) setActiveId(null);
      sound.pop();
    },
    [activeId]
  );

  const duplicateNote = useCallback((note: Note) => {
    const copy: Note = { ...note, id: newId(), title: note.title ? `${note.title} (copy)` : '', createdAt: Date.now(), updatedAt: Date.now() };
    setNotes((prev) => [copy, ...prev]);
    setActiveId(copy.id);
    notebookDb.putNote(copy);
    sound.select();
  }, []);

  const togglePin = useCallback(
    (note: Note) => {
      const updated = { ...note, pinned: !note.pinned };
      setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
      notebookDb.putNote(updated);
    },
    []
  );

  const toggleArchive = useCallback((note: Note) => {
    const updated = { ...note, archived: !note.archived };
    setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
    notebookDb.putNote(updated);
  }, []);

  const insertDoodle = useCallback(async () => {
    const dataUrl = doodleRef.current?.exportPng();
    if (!dataUrl || !active) return;
    const doodle: Doodle = { id: newId(), dataUrl, createdAt: Date.now() };
    await notebookDb.putDoodle(doodle);
    addDoodleSaved();
    const img = `<img src="${dataUrl}" alt="a doodle" class="my-3 max-w-full rounded-xl" />`;
    updateActive({ contentHtml: (active.contentHtml || '') + img });
    setMode('write');
    sound.success();
    pushToast('tucked into the page.');
  }, [active, updateActive]);

  const exportNote = useCallback((note: Note) => {
    const html = `<!doctype html><meta charset="utf-8"><title>${note.title || 'untitled'}</title><body>${note.contentHtml}</body>`;
    download(`${note.title || 'untitled'}.html`, html, 'text/html');
  }, []);

  // keyboard shortcuts: Cmd/Ctrl+S flush save, Cmd/Ctrl+N new note, Esc exits fullscreen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreen) {
        setFullscreen(false);
        return;
      }
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === 's') {
        e.preventDefault();
        if (active) {
          if (saveTimer.current) window.clearTimeout(saveTimer.current);
          notebookDb.putNote(active).then(() => setSaveStatus('saved'));
        }
      } else if (e.key === 'n') {
        e.preventDefault();
        createNote();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, createNote, fullscreen]);

  // lock page scroll while the fullscreen editor overlay is open
  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  useEffect(() => setFullscreen(false), [activeId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes
      .filter((n) => (showArchived ? true : !n.archived))
      .filter((n) => {
        if (!q) return true;
        return n.title.toLowerCase().includes(q) || plainTextOf(n.contentHtml).toLowerCase().includes(q) || n.tags.some((t) => t.toLowerCase().includes(q));
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
  }, [notes, search, showArchived]);

  const statusLabel = saveStatus === 'saving' ? 'saving…' : saveStatus === 'saved' ? 'saved' : '';

  if (!loaded) return null;

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr_220px]">
      {/* index */}
      <div aria-hidden={fullscreen} className={`${mobileView === 'editor' ? 'hidden lg:block' : ''}`}>
        <div className="mb-3 flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search notes…"
            className="w-full rounded-full border border-brown-warm/30 bg-surface/60 px-3 py-1.5 text-sm text-parchment placeholder:text-muted-dim outline-none focus:border-royal-vivid/50"
          />
          <button
            onClick={createNote}
            aria-label="new note"
            className="tap-target shrink-0 rounded-full bg-royal-vivid/20 text-royal-vivid hover:bg-royal-vivid/30"
          >
            +
          </button>
        </div>

        <button
          onClick={() => setShowArchived((v) => !v)}
          className="font-nebulica mb-2 text-[9px] uppercase tracking-[0.25em] text-muted-dim hover:text-royal-vivid"
        >
          {showArchived ? 'hide archived' : 'show archived'}
        </button>

        <div className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto lg:max-h-[70vh]">
          {filtered.length === 0 && (
            <p className="font-monigue text-sm italic text-muted">
              {notes.length === 0 ? 'not a single page yet.' : 'nothing matches that.'}
            </p>
          )}
          {filtered.map((note) => (
            <button
              key={note.id}
              onClick={() => {
                setActiveId(note.id);
                setMode('write');
                setMobileView('editor');
              }}
              className={`rounded-xl px-3 py-2 text-left transition-colors ${
                activeId === note.id ? 'bg-royal-vivid/15 ring-1 ring-royal-vivid/40' : 'hover:bg-surface/60'
              }`}
            >
              <p className="font-magnode truncate text-sm text-parchment">
                {note.pinned && '📌 '}
                {note.title || 'untitled'}
              </p>
              <p className="truncate text-xs text-muted-dim">{plainTextOf(note.contentHtml).slice(0, 60) || 'empty'}</p>
            </button>
          ))}
        </div>
      </div>

      {/* page — the editor/canvas instances below stay mounted across the
          fullscreen toggle (only the wrapper's classes change); remounting
          them at a different tree position would wipe the doodle canvas and
          drop the RichTextEditor's cursor. */}
      <div
        className={
          fullscreen
            ? 'fixed inset-0 z-[100] overflow-y-auto bg-void/97 px-5 py-6 backdrop-blur-md sm:px-10 sm:py-10'
            : mobileView === 'list'
              ? 'hidden lg:block'
              : ''
        }
      >
        <div className={fullscreen ? 'mx-auto max-w-5xl' : ''}>
          {!active ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-brown-warm/40 text-center">
              <p className="font-monigue text-sm italic text-muted">the first page is still blank.</p>
              <button onClick={createNote} className="font-nebulica text-[10px] uppercase tracking-[0.3em] text-royal-vivid underline underline-offset-4">
                start writing
              </button>
            </div>
          ) : (
            <div>
              {!fullscreen && (
                <button onClick={() => setMobileView('list')} className="font-nebulica mb-3 text-[10px] uppercase tracking-[0.3em] text-muted-dim lg:hidden">
                  ← index
                </button>
              )}

              <div className="flex items-start justify-between gap-3">
                <input
                  value={active.title}
                  onChange={(e) => updateActive({ title: e.target.value })}
                  placeholder="untitled"
                  className="font-apestron w-full bg-transparent text-2xl text-parchment placeholder:text-muted-dim outline-none sm:text-3xl"
                />
                <button
                  onClick={() => {
                    sound.tap();
                    setFullscreen((v) => !v);
                  }}
                  aria-label={fullscreen ? 'exit fullscreen' : 'expand to fullscreen'}
                  title={fullscreen ? 'exit fullscreen (esc)' : 'expand to fullscreen'}
                  className="tap-target shrink-0 rounded-full text-base text-muted-dim transition-colors hover:bg-royal-vivid/15 hover:text-royal-vivid"
                >
                  {fullscreen ? '✕' : '⛶'}
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="flex overflow-hidden rounded-full bg-brown-deep/40 ring-1 ring-brown-warm/40">
                  <button
                    onClick={() => setMode('write')}
                    className={`font-nebulica px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] ${mode === 'write' ? 'bg-royal-vivid text-void' : 'text-muted'}`}
                  >
                    write
                  </button>
                  <button
                    onClick={() => setMode('draw')}
                    className={`font-nebulica px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] ${mode === 'draw' ? 'bg-royal-vivid text-void' : 'text-muted'}`}
                  >
                    draw
                  </button>
                </div>
                <span className="font-monigue text-xs italic text-muted-dim">{statusLabel}</span>
                {fullscreen && (
                  <span className="font-nebulica ml-auto hidden text-[9px] uppercase tracking-[0.25em] text-muted-dim sm:inline">
                    esc to exit
                  </span>
                )}
              </div>

              <div className="mt-4">
                {mode === 'write' ? (
                  <RichTextEditor
                    html={active.contentHtml}
                    onChange={(html) => updateActive({ contentHtml: html })}
                    minHeightClass={fullscreen ? 'min-h-[calc(100dvh-260px)]' : 'min-h-[48vh]'}
                  />
                ) : (
                  <div>
                    <DoodleCanvas ref={doodleRef} heightClass={fullscreen ? 'h-[calc(100dvh-280px)]' : 'h-[52dvh]'} />
                    <button
                      onClick={insertDoodle}
                      className="mt-3 w-full rounded-2xl bg-royal-vivid/20 py-2.5 font-nebulica text-[10px] uppercase tracking-[0.3em] text-royal-vivid hover:bg-royal-vivid/30"
                    >
                      insert into page
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* tools */}
      {active && (
        <div
          aria-hidden={fullscreen}
          className={`${mobileView === 'list' ? 'hidden lg:block' : ''} flex flex-col gap-3`}
        >
          <p className="font-monigue text-xs italic text-muted-dim">
            edited {new Date(active.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
          <div className="flex flex-col gap-1.5">
            <ToolButton onClick={() => togglePin(active)}>{active.pinned ? 'unpin' : 'pin'}</ToolButton>
            <ToolButton onClick={() => duplicateNote(active)}>duplicate</ToolButton>
            <ToolButton onClick={() => toggleArchive(active)}>{active.archived ? 'unarchive' : 'archive'}</ToolButton>
            <ToolButton onClick={() => exportNote(active)}>export .html</ToolButton>
            <ToolButton
              onClick={() => {
                if (confirm('delete this page for good?')) deleteNote(active.id);
              }}
              danger
            >
              delete
            </ToolButton>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolButton({ onClick, children, danger }: { onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`font-nebulica rounded-lg px-3 py-2 text-left text-[10px] uppercase tracking-[0.2em] transition-colors ${
        danger ? 'text-brown-warm hover:bg-brown-deep/40' : 'text-muted hover:bg-royal-vivid/10 hover:text-royal-vivid'
      }`}
    >
      {children}
    </button>
  );
}
